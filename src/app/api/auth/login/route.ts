import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createUserToken } from "@/lib/user-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

// POST /api/auth/login
// Login de usuário entregador
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// PUBLIC ROUTE — Esta rota é intencionalmente pública (não requer admin auth)
export async function POST(req: NextRequest) {
  // Rate limit: 30 tentativas por IP por 15 min
  const limited = await applyRateLimit(req, {
    windowMs: 15 * 60 * 1000,
    maxRequests: 30,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Validação Zod
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;

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
