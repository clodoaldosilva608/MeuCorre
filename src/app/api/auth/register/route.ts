import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createUserToken } from "@/lib/user-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { validatePassword } from "@/lib/password-policy";

// POST /api/auth/register
// Cadastro de novo usuário entregador
export async function POST(req: NextRequest) {
  // Rate limit: 3 cadastros por IP por hora
  const limited = await applyRateLimit(req, {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
  });
  if (limited) return limited;

  let body: { name?: string; email?: string; password?: string; phone?: string; city?: string; referralCode?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  // Validações
  if (!name || name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: "Nome inválido (2-100 caracteres)" }, { status: 400 });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }
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
      phone: body.phone?.trim().slice(0, 30) || null,
      city: body.city?.trim().slice(0, 100) || null,
    },
  });

  // ===== Referral: se veio com código de indicação, registra =====
  const referralCode = body.referralCode?.trim();
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
