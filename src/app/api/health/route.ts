import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ===== Health check endpoint =====
//
// GET /api/health — verifica saúde do sistema.
// Usado por:
// - Load balancers / uptime monitors (UptimeRobot, BetterStack)
// - Vercel deployment checks
// - Internal monitoring dashboards
//
// Retorna 200 se tudo OK, 503 se algum componente falhar.
// Não requer auth (público) — não expõe dados sensíveis.

// PUBLIC ROUTE — Esta rota é intencionalmente pública (não requer admin auth)
export async function GET() {
  const checks: Record<string, "ok" | "down" | "not_configured" | "configured"> = {};
  let allHealthy = true;

  // 1. Database (PostgreSQL via Prisma)
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "down";
    allHealthy = false;
  }

  // 2. Redis (Upstash) — opcional, não derruba health se não configurado
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  if (redisUrl) {
    try {
      const res = await fetch(`${redisUrl}/ping`, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
        signal: AbortSignal.timeout(2000),
      });
      checks.redis = res.ok ? "ok" : "down";
      if (!res.ok) allHealthy = false;
    } catch {
      checks.redis = "down";
      // Redis down NÃO derruba health geral (fallback in-memory funciona)
    }
  } else {
    checks.redis = "not_configured";
  }

  // 3. Sentry — apenas reporta se DSN está configurado (não testa conectividade)
  checks.sentry = process.env.SENTRY_DSN ? "configured" : "not_configured";

  // 4. Build info (para debug)
  const buildInfo = {
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    environment: process.env.NODE_ENV ?? "unknown",
    region: process.env.VERCEL_REGION ?? "unknown",
  };

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "unhealthy",
      checks,
      build: buildInfo,
      timestamp: new Date().toISOString(),
    },
    { status: allHealthy ? 200 : 503 },
  );
}
