// ===== Backup automático — exportação de tabelas críticas =====
//
// Este script roda via cron (Vercel Cron ou agendador externo) e
// exporta tabelas críticas para um formato JSON compacto.
// Pode ser enviado para S3, Google Drive, ou salvo localmente.
//
// Configuração:
//   BACKUP_S3_BUCKET — bucket S3 para upload (opcional)
//   BACKUP_S3_REGION — região do bucket
//   BACKUP_S3_ACCESS_KEY — access key
//   BACKUP_S3_SECRET_KEY — secret key
//
// Se S3 não estiver configurado, salva em /tmp/backup-{date}.json
//
// Cron na Vercel (vercel.json):
//   { "path": "/api/cron/backup", "schedule": "0 4 * * *" } // todo dia 4h da manhã
//
// Ou rodar manualmente:
//   npx tsx scripts/backup-database.ts

import { PrismaClient } from "@prisma/client";
import * as fs from "node:fs";
import * as path from "node:path";

const prisma = new PrismaClient({ log: ["error"] });

interface BackupData {
  timestamp: string;
  version: string;
  tables: Record<string, unknown[]>;
  stats: {
    totalRecords: number;
    tablesExported: number;
  };
}

async function main() {
  const now = new Date();
  const timestamp = now.toISOString();
  const dateStr = now.toISOString().slice(0, 10);

  console.log(`📦 Iniciando backup — ${timestamp}`);
  console.log("=".repeat(60));

  const backup: BackupData = {
    timestamp,
    version: "1.0.0",
    tables: {},
    stats: { totalRecords: 0, tablesExported: 0 },
  };

  // Tabelas críticas para backup (não exportamos SyncedDelivery/Expense
  // que são grandes — essas ficam no IndexedDB do usuário)
  const tablesToBackup = [
    { name: "User", model: prisma.user },
    { name: "AdminUser", model: prisma.adminUser },
    { name: "Subscription", model: prisma.subscription },
    { name: "Ad", model: prisma.ad },
    { name: "Offer", model: prisma.offer },
    { name: "BlogPost", model: prisma.blogPost },
    { name: "Setting", model: prisma.setting },
    { name: "ReferralCode", model: prisma.referralCode },
    { name: "Referral", model: prisma.referral },
    { name: "ReferralCampaign", model: prisma.referralCampaign },
    { name: "Lead", model: prisma.lead },
    { name: "Feedback", model: prisma.feedback },
    { name: "AdminAction", model: prisma.adminAction },
    { name: "Partner", model: prisma.partner },
    { name: "PartnerContact", model: prisma.partnerContact },
    { name: "Opportunity", model: prisma.opportunity },
    { name: "PartnerActivity", model: prisma.partnerActivity },
    { name: "PartnerLog", model: prisma.partnerLog },
    { name: "Proposal", model: prisma.proposal },
    { name: "CommercialAsset", model: prisma.commercialAsset },
    { name: "PartnerCampaign", model: prisma.partnerCampaign },
    { name: "OutboundTemplate", model: prisma.outboundTemplate },
    { name: "OutboundLog", model: prisma.outboundLog },
    { name: "Team", model: prisma.team },
    { name: "TeamMember", model: prisma.teamMember },
    { name: "TeamInvite", model: prisma.teamInvite },
    { name: "PartnerPortalToken", model: prisma.partnerPortalToken },
    { name: "Campaign", model: prisma.campaign },
    { name: "PromotionPost", model: prisma.promotionPost },
    { name: "PromotionAsset", model: prisma.promotionAsset },
    { name: "SocialChannel", model: prisma.socialChannel },
    { name: "PromotionReminder", model: prisma.promotionReminder },
  ];

  for (const { name, model } of tablesToBackup) {
    try {
      const records = await (model as { findMany: (args?: unknown) => Promise<unknown[]> }).findMany({
        take: 10000, // limite por tabela
      });
      backup.tables[name] = records;
      backup.stats.totalRecords += records.length;
      backup.stats.tablesExported++;
      console.log(`  ✅ ${name}: ${records.length} registros`);
    } catch (err) {
      console.error(`  ❌ ${name}: ${err instanceof Error ? err.message : "erro"}`);
      backup.tables[name] = [];
    }
  }

  console.log("=".repeat(60));
  console.log(`📊 Total: ${backup.stats.totalRecords} registros em ${backup.stats.tablesExported} tabelas`);

  // Salva como JSON
  const json = JSON.stringify(backup, null, 2);
  const filename = `backup-${dateStr}.json`;

  // Tenta salvar em S3 (se configurado)
  const s3Bucket = process.env.BACKUP_S3_BUCKET;
  const s3Key = process.env.BACKUP_S3_ACCESS_KEY;
  const s3Secret = process.env.BACKUP_S3_SECRET_KEY;
  const s3Region = process.env.BACKUP_S3_REGION || "us-east-1";

  if (s3Bucket && s3Key && s3Secret) {
    console.log(`\n☁️  Enviando para S3: ${s3Bucket}/${filename}...`);
    try {
      // Upload via S3 REST API (sem SDK para evitar dependência)
      const { createHash, createHmac } = await import("node:crypto");
      const date = now.toISOString().slice(0, 10).replace(/-/g, "");
      const datetime = now.toISOString().slice(0, 19).replace(/[-:T]/g, "") + "Z";

      const payload = json;
      const payloadHash = createHash("sha256").update(payload).digest("hex");

      const canonicalRequest = [
        "PUT",
        `/${filename}`,
        "",
        `host:${s3Bucket}.s3.${s3Region}.amazonaws.com`,
        `x-amz-content-sha256:${payloadHash}`,
        `x-amz-date:${datetime}`,
        "",
        "host;x-amz-content-sha256;x-amz-date",
        payloadHash,
      ].join("\n");

      const stringToSign = [
        "AWS4-HMAC-SHA256",
        datetime,
        `${date}/${s3Region}/s3/aws4_request`,
        createHash("sha256").update(canonicalRequest).digest("hex"),
      ].join("\n");

      const signingKey = ["AWS4" + s3Secret, date, s3Region, "s3", "aws4_request"]
        .reduce((key, data) => createHmac("sha256", key).update(data).digest(), "");

      const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

      const authHeader = `AWS4-HMAC-SHA256 Credential=${s3Key}/${date}/${s3Region}/s3/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${signature}`;

      const res = await fetch(`https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${filename}`, {
        method: "PUT",
        headers: {
          Host: `${s3Bucket}.s3.${s3Region}.amazonaws.com`,
          "x-amz-content-sha256": payloadHash,
          "x-amz-date": datetime,
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: payload,
      });

      if (res.ok) {
        console.log(`   ✅ Backup enviado para S3: ${filename}`);
      } else {
        console.error(`   ❌ Erro S3: ${res.status} ${await res.text()}`);
        // Fallback: salva localmente
        const localPath = path.resolve(process.cwd(), "tmp", filename);
        fs.writeFileSync(localPath, json);
        console.log(`   💾 Salvo localmente: ${localPath}`);
      }
    } catch (err) {
      console.error(`   ❌ Erro S3: ${err}`);
      const localPath = path.resolve(process.cwd(), "tmp", filename);
      fs.writeFileSync(localPath, json);
      console.log(`   💾 Salvo localmente: ${localPath}`);
    }
  } else {
    // Sem S3 — salva localmente
    const localDir = path.resolve(process.cwd(), "tmp");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const localPath = path.join(localDir, filename);
    fs.writeFileSync(localPath, json);
    console.log(`\n💾 Backup salvo: ${localPath}`);
    console.log(`   Tamanho: ${(json.length / 1024).toFixed(1)} KB`);
    console.log("\n💡 Para backup automático em S3, configure:");
    console.log("   BACKUP_S3_BUCKET, BACKUP_S3_ACCESS_KEY, BACKUP_S3_SECRET_KEY");
  }

  console.log("\n✅ Backup concluído!");
}

main()
  .catch((e) => {
    console.error("💥 Erro fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
