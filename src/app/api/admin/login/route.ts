import { NextRequest, NextResponse } from "next/server";
import { createAdminToken, verifyAdminPassword } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { loginSchema, validateOrError } from "@/lib/zod-schemas";
import { z } from "zod";

// POST /api/admin/login
// Auth por email + senha. Suporta 2 modos:
// 1. MULTI-ADMIN: tabela AdminUser no banco (múltiplos admins com roles)
// 2. LEGACY: env vars ADMIN_EMAIL + ADMIN_PASSWORD (single admin, fallback)
//
// Seta cookie httpOnly com JWT assinado (HMAC-SHA256).
// Proteção contra brute force: máx 5 tentativas por IP a cada 15 min.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 min
const attempts = new Map<string, { count: number; firstAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: now });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  entry.count++;
  if (entry.count > MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count };
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// PUBLIC ROUTE — Esta rota é intencionalmente pública (login/logout/cron usam auth própria)
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, remaining } = checkRateLimit(ip);

  if (!allowed) {
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

  // Verifica credenciais (tenta AdminUser table primeiro, depois env vars)
  const result = await verifyAdminPassword(email.trim(), password);

  if (!result.valid) {
    logger.warn("Admin login falhou", { email, ip });
    return NextResponse.json(
      {
        error: `Email ou senha incorretos. ${remaining} tentativa(s) restante(s).`,
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
    sameSite: "strict",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
  return res;
}
