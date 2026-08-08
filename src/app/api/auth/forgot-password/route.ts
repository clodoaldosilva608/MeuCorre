import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/user-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

// POST /api/auth/forgot-password
// Gera token de reset e "envia por email" (MVP: apenas salva no DB)
// Em produção, integrar com Resend/SendGrid.
export async function POST(req: NextRequest) {
  // Rate limit: 3 requests por IP por hora (anti enumeração)
  const limited = applyRateLimit(req, {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
  });
  if (limited) return limited;

  let body: { email?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
  }

  // Por segurança, sempre retorna sucesso (não revela se email existe)
  const genericResponse = NextResponse.json({
    ok: true,
    message: "Se o email existir, você receberá um link de recuperação.",
  });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return genericResponse;
  }

  // Gera token (crypto random + JWT)
  const token = await createPasswordResetToken();
  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Salva token no DB (válido por 1h)
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token: tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  // MVP: não enviamos email real. Em produção, usar Resend:
  // await fetch("https://api.resend.com/emails", { ... })
  //
  // Por ora, logamos o link no console do servidor (apenas pra teste)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://meucorre.vercel.app";
  const resetLink = `${appUrl}/recuperar-senha?token=${token}`;
  console.log(`[forgot-password] Reset link para ${email}: ${resetLink}`);

  // TODO: quando configurar Resend, descomentar:
  // if (process.env.RESEND_API_KEY) {
  //   await sendResetEmail(email, resetLink);
  // }

  return genericResponse;
}
