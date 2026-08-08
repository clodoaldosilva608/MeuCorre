import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createUserToken } from "@/lib/user-auth";
import { applyRateLimit } from "@/lib/rate-limit";

// POST /api/auth/login
// Login de usuário entregador
export async function POST(req: NextRequest) {
  // Rate limit desabilitado temporariamente pra testes
  // TODO: reativar com Upstash Redis antes de produção
  // const limited = applyRateLimit(req, { windowMs: 15 * 60 * 1000, maxRequests: 100 });
  // if (limited) return limited;

  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
  }

  // Atualiza lastLoginAt
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = await createUserToken({
    userId: user.id,
    email: user.email,
    isPro: user.isPro,
  });

  const res = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isPro: user.isPro,
      licenseKey: user.licenseKey,
    },
  });

  res.cookies.set("meucorre_user", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  });

  return res;
}
