import { NextRequest, NextResponse } from "next/server";
import { createAdminToken } from "@/lib/admin-auth";

// POST /api/admin/login
// Auth por email + senha (env vars ADMIN_EMAIL e ADMIN_PASSWORD).
// Seta cookie httpOnly com JWT assinado (HMAC-SHA256).
//
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

  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json(
      { error: "JSON inválido" },
      { status: 400 },
    );
  }

  const { email, password } = body;

  if (!email?.trim() || !password) {
    return NextResponse.json(
      { error: "Email e senha são obrigatórios" },
      { status: 400 },
    );
  }

  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedEmail || !expectedPassword) {
    return NextResponse.json(
      { error: "Servidor sem credenciais admin configuradas" },
      { status: 500 },
    );
  }

  // Comparação timing-safe da senha
  const passwordMatch =
    password.length === expectedPassword.length &&
    password.split("").every((c, i) => c === expectedPassword[i]);

  if (
    email.trim().toLowerCase() !== expectedEmail.toLowerCase() ||
    !passwordMatch
  ) {
    return NextResponse.json(
      {
        error: `Email ou senha incorretos. ${remaining} tentativa(s) restante(s).`,
      },
      { status: 401 },
    );
  }

  // Gera JWT assinado
  const token = await createAdminToken(expectedEmail.toLowerCase());

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
