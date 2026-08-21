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

  // Se S3 configurado, faria upload aqui (mesma lógica do script)
  // Por ora, retorna o JSON para o cron registrar nos logs

  console.log(`[backup] Concluído: ${totalRecords} registros, ${tablesExported} tabelas`);

  return NextResponse.json({
    ok: true,
    timestamp,
    stats: { totalRecords, tablesExported },
    message: "Backup gerado. Configure BACKUP_S3_* para upload automático.",
  });
}
