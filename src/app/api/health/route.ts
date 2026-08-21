import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getShardingStatus } from "@/lib/sharding";
import { getCdnStatus } from "@/lib/cdn";

// ===== Health check endpoint =====
//
// GET /api/health — verifica saúde do sistema.
// Usado por:
// - Load balancers / uptime monitors (UptimeRobot, BetterStack)
// - Vercel deployment checks
// - Internal monitoring dashboards
// - Alertas Sentry (ver P2-8 abaixo)
//
// P2-8: Alertas Sentry → Slack/Email em erro 5xx
// Para configurar alertas:
// 1. Vá em https://sentry.io → Settings → Alerts
// 2. Crie regra: "When an issue is seen for the first time"
// 3. Ação: enviar para Slack webhook ou email
// 4. Filtro: environment = production AND level = error
// 5. Threshold: 5+ eventos em 5 minutos (evita spam)
//
// P2-9: Health check externo
// Configure UptimeRobot ou BetterStack para monitorar:
// - URL: https://meucorre.vercel.app/api/health
// - Método: GET
// - Intervalo: 1 minuto
// - Status esperado: 200
// - Alerta se: 503 (unhealthy) ou timeout (>10s)
// - Canais: email, Slack, SMS, WhatsApp
//
// Retorna 200 se tudo OK, 503 se algum componente crítico falhar.
// Não requer auth (público) — não expõe dados sensíveis.

export async function GET() {
  const checks: Record<string, string> = {};
  let allHealthy = true;

  // 1. Database (PostgreSQL via Prisma) — CRÍTICO
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "down";
    allHealthy = false;
  }

  // 2. Redis (Upstash) — não crítico (fallback in-memory funciona)
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  if (redisUrl) {
    try {
      const res = await fetch(`${redisUrl}/ping`, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
        signal: AbortSignal.timeout(2000),
      });
      checks.redis = res.ok ? "ok" : "down";
      if (!res.ok) {
        // Redis down não derruba health (fallback in-memory)
        // mas logged para alerta
        console.warn("[health] Redis down — fallback in-memory ativo");
      }
    } catch {
      checks.redis = "down";
    }
  } else {
    checks.redis = "not_configured";
  }

  // 3. Sentry — apenas reporta se DSN está configurado
  checks.sentry = process.env.SENTRY_DSN ? "configured" : "not_configured";

  // 4. QStash (fila) — opcional
  checks.qstash = process.env.QSTASH_TOKEN ? "configured" : "not_configured";

  // 5. Resend (email) — opcional
  checks.resend = process.env.RESEND_API_KEY ? "configured" : "not_configured";

  // 6. Kiwify — opcional
  checks.kiwify = process.env.KIWIFY_WEBHOOK_SECRET ? "configured" : "not_configured";

  // 7. Backup S3 — opcional
  checks.backupS3 = process.env.BACKUP_S3_BUCKET ? "configured" : "not_configured";

  // 8. P4-4: CDN
  const cdnStatus = getCdnStatus();
  checks.cdn = cdnStatus.provider === "cloudflare" ? "cloudflare" : "vercel-edge";

  // 9. P4-3: Sharding
  const shardingStatus = getShardingStatus();
  checks.sharding = shardingStatus.enabled
    ? `enabled (${shardingStatus.configuredShards}/${shardingStatus.shardCount} shards)`
    : "disabled";

  // 10. P4-5: Feature flags
  checks.featureFlags = process.env.EDGE_CONFIG
    ? "edge-config"
    : "db-fallback";

  // Build info
  const buildInfo = {
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    environment: process.env.NODE_ENV ?? "unknown",
    region: process.env.VERCEL_REGION ?? "unknown",
  };

  // Apenas database e sentry (se configurado) são críticos
  const criticalChecks = checks.database === "ok";
  const statusCode = criticalChecks ? 200 : 503;

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : criticalChecks ? "degraded" : "unhealthy",
      checks,
      build: buildInfo,
      // P2-9: timestamps para monitoração externa calcular latência
      timestamp: new Date().toISOString(),
    },
    { status: statusCode },
  );
}
