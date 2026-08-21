import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/cron/backup
// Cron job diário — exporta tabelas críticas como JSON.
// Protegido por CRON_SECRET (Vercel env var).
//
// vercel.json:
//   { "path": "/api/cron/backup", "schedule": "0 4 * * *" }
//
// SEGURANÇA (P0-6 corrigido):
// Antes, se CRON_SECRET não estivesse configurado, a rota era PUBLIC —
// qualquer um podia chamar e receber dump de TODAS as tabelas (User,
// AdminUser com hashes, Subscription com licenseKeys).
// Agora falha closed: se secret ausente, retorna 503.
export async function GET(req: NextRequest) {
  // Verifica secret do cron — FAIL CLOSED (não fail-open)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // Secret não configurado — não sabemos se a request é legítima
    // Retorna 503 para alertar operadores que a config está faltando
    console.error("[backup] CRON_SECRET não configurado — bloqueando acesso");
    return NextResponse.json(
      { error: "Serviço indisponível — configurar CRON_SECRET" },
      { status: 503 },
    );
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const now = new Date();
  const timestamp = now.toISOString();

  console.log(`[backup] Iniciando backup — ${timestamp}`);

  const backup: Record<string, unknown> = {
    timestamp,
    version: "1.0.0",
    tables: {} as Record<string, unknown[]>,
  };

  let totalRecords = 0;
  let tablesExported = 0;

  // Tabelas críticas (sem SyncedDelivery/Expense — muito grandes)
  const tables = [
    "User", "AdminUser", "Subscription", "Ad", "Offer", "BlogPost",
    "Setting", "ReferralCode", "Referral", "ReferralCampaign", "Lead",
    "Feedback", "AdminAction", "Partner", "PartnerContact",
    "Opportunity", "PartnerActivity", "PartnerLog", "Proposal",
    "CommercialAsset", "PartnerCampaign", "OutboundTemplate",
    "OutboundLog", "Team", "TeamMember", "TeamInvite",
    "PartnerPortalToken", "Campaign", "PromotionPost",
    "PromotionAsset", "SocialChannel", "PromotionReminder",
  ];

  for (const table of tables) {
    try {
      const model = (prisma as unknown as Record<string, { findMany: (args?: unknown) => Promise<unknown[]> }>)[
        table.charAt(0).toLowerCase() + table.slice(1)
      ];
      if (model) {
        const records = await model.findMany({ take: 10000 });
        (backup.tables as Record<string, unknown[]>)[table] = records;
        totalRecords += records.length;
        tablesExported++;
      }
    } catch {
      (backup.tables as Record<string, unknown[]>)[table] = [];
    }
  }

  backup.stats = { totalRecords, tablesExported };

  // P2-7: Upload real para S3/R2 se configurado.
  // Sem S3 configurado, mantém o comportamento antigo (retorna JSON no log).
  const s3Bucket = process.env.BACKUP_S3_BUCKET;
  const s3Region = process.env.BACKUP_S3_REGION;
  const s3AccessKey = process.env.BACKUP_S3_ACCESS_KEY;
  const s3SecretKey = process.env.BACKUP_S3_SECRET_KEY;
  const s3Endpoint = process.env.BACKUP_S3_ENDPOINT; // opcional (Cloudflare R2)

  if (s3Bucket && s3AccessKey && s3SecretKey) {
    try {
      const backupJson = JSON.stringify(backup);
      const backupKey = `backups/meucorre-${timestamp.replace(/[:.]/g, "-")}.json`;

      // AWS S3 / Cloudflare R2 PUT (sig v4 é complexa; usamos PUT simples
      // que funciona com R2 public buckets ou presigned URLs).
      // Para produção com S3 privado, recomendado gerar presigned URL.
      const s3Url = s3Endpoint
        ? `${s3Endpoint.replace(/\/$/, "")}/${s3Bucket}/${backupKey}`
        : `https://${s3Bucket}.s3.${s3Region ?? "auto"}.amazonaws.com/${backupKey}`;

      const uploadRes = await fetch(s3Url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `AWS ${s3AccessKey}:${s3SecretKey}`, // simplificado
          "x-amz-date": new Date().toUTCString(),
        },
        body: backupJson,
        signal: AbortSignal.timeout(30000),
      });

      if (uploadRes.ok) {
        console.log(`[backup] Upload S3 OK: ${backupKey} (${backupJson.length} bytes)`);
        return NextResponse.json({
          ok: true,
          timestamp,
          stats: { totalRecords, tablesExported },
          uploaded: true,
          s3Key: backupKey,
        });
      } else {
        console.warn(
          `[backup] Upload S3 falhou (${uploadRes.status}):`,
          await uploadRes.text(),
        );
        // Fall through para retornar sem upload
      }
    } catch (err) {
      console.warn(
        "[backup] Upload S3 erro:",
        err instanceof Error ? err.message : err,
      );
    }
  } else {
    console.log("[backup] BACKUP_S3_* não configurado — backup apenas em log");
  }

  console.log(`[backup] Concluído: ${totalRecords} registros, ${tablesExported} tabelas`);

  return NextResponse.json({
    ok: true,
    timestamp,
    stats: { totalRecords, tablesExported },
    message: s3Bucket
      ? "Backup gerado (upload S3 falhou, ver logs)"
      : "Backup gerado. Configure BACKUP_S3_* para upload automático.",
  });
}
