import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createUserToken } from "@/lib/user-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { validatePassword } from "@/lib/password-policy";
import { z } from "zod";

// POST /api/auth/register
// Cadastro de novo usuário entregador
const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto").max(100, "Nome muito longo"),
  email: z.string().email("Email inválido").max(254),
  password: z.string().min(1, "Senha é obrigatória"),
  phone: z.string().max(30).optional(),
  city: z.string().max(100).optional(),
  referralCode: z.string().max(50).optional(),
});

// PUBLIC ROUTE — Esta rota é intencionalmente pública (não requer admin auth)
export async function POST(req: NextRequest) {
  // Rate limit: 3 cadastros por IP por hora
  const limited = await applyRateLimit(req, {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Validação Zod
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const name = parsed.data.name.trim();
  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;

  // Validação de senha com política forte
  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) {
    return NextResponse.json(
      { error: pwCheck.errors[0] },
      { status: 400 },
    );
  }

  // Verifica se email já existe
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email já cadastrado. Faça login." }, { status: 409 });
  }

  // Cria usuário
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      phone: parsed.data.phone?.trim().slice(0, 30) || null,
      city: parsed.data.city?.trim().slice(0, 100) || null,
    },
  });

  // ===== Referral: se veio com código de indicação, registra =====
  const referralCode = parsed.data.referralCode?.trim();
  if (referralCode) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://meucorre.vercel.app"}/api/referral/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: user.name,
          code: referralCode,
        }),
      });
    } catch {
      // Referral falha silenciosamente — não bloqueia registro
    }
  }

  // Gera token de sessão
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
