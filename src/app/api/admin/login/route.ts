import { NextRequest, NextResponse } from "next/server";
import { createAdminToken, verifyAdminPassword } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { loginSchema, validateOrError } from "@/lib/zod-schemas";
import { applyRateLimit } from "@/lib/rate-limit";

// POST /api/admin/login
// Auth por email + senha. Suporta 2 modos:
// 1. MULTI-ADMIN: tabela AdminUser no banco (múltiplos admins com roles)
// 2. LEGACY: env vars ADMIN_EMAIL + ADMIN_PASSWORD (single admin, fallback)
//
// Seta cookie httpOnly com JWT assinado (HMAC-SHA256).
// Proteção contra brute force: máx 5 tentativas por IP a cada 15 min.
//
// SEGURANÇA (P1-4 corrigido):
// Antes, rate limit era in-memory (`attempts = new Map()`).
// Em Vercel serverless, cada instância tem seu próprio Map — atacante
// distribui tentativas entre cold starts e contorna o limite.
// Agora usa applyRateLimit (Redis distribuído via Upstash quando
// configurado, fallback in-memory em dev).

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit distribuído (Redis em prod, in-memory em dev)
  // 5 tentativas por IP a cada 15 min
  // NOTA: admin-login usa por-IP (não userId) pois usuário ainda não logou.
  const limited = await applyRateLimit(req, {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
  });
  if (limited) {
    return NextResponse.json(
      {
        error: "Muitas tentativas. Tente novamente em 15 minutos.",
      },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "JSON inválido" },
      { status: 400 },
    );
  }

  // Validação com Zod
  const validation = validateOrError(loginSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 },
    );
  }

  const { email, password } = validation.data;

  // Verifica se env vars mínimas estão configuradas (diagnóstico rápido)
  const hasJwtSecret = !!process.env.ADMIN_JWT_SECRET;
  const hasAdminEmail = !!process.env.ADMIN_EMAIL;
  const hasAdminPassword = !!process.env.ADMIN_PASSWORD;

  if (!hasJwtSecret) {
    logger.error("Admin login falhou — ADMIN_JWT_SECRET não configurado", { ip });
    return NextResponse.json(
      {
        error: "Servidor mal configurado: ADMIN_JWT_SECRET ausente. Contate o administrador.",
      },
      { status: 500 },
    );
  }

  if (!hasAdminEmail || !hasAdminPassword) {
    logger.error("Admin login falhou — credenciais env não configuradas", { ip, hasAdminEmail, hasAdminPassword });
    return NextResponse.json(
      {
        error: "Servidor mal configurado: ADMIN_EMAIL/ADMIN_PASSWORD ausentes. Contate o administrador.",
      },
      { status: 500 },
    );
  }

  // Verifica credenciais (tenta AdminUser table primeiro, depois env vars)
  const result = await verifyAdminPassword(email.trim(), password);

  if (!result.valid) {
    logger.warn("Admin login falhou — credenciais inválidas", { email, ip });
    return NextResponse.json(
      {
        error: `Email ou senha incorretos.`,
      },
      { status: 401 },
    );
  }

  // Determina source (db ou env) para o token
  const source = result.role === "super_admin" && email.trim().toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()
    ? "env"
    : "db";

  // Gera JWT assinado com role e source
  const token = await createAdminToken(
    email.trim().toLowerCase(),
    result.role,
    source,
  );

  logger.info("Admin login sucesso", { email: email.trim(), role: result.role, ip });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("meucorre_admin", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
  return res;
}
