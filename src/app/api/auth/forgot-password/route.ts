import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/user-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";

// POST /api/auth/forgot-password
// Gera token de reset e retorna o link de recuperação.
// Em produção com RESEND_API_KEY configurado, envia email real.
// Sem RESEND_API_KEY, retorna o link na resposta (para o frontend mostrar).
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, {
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
  });
  if (limited) return limited;

  let body: { email?: string };
  try {
    body = (await req.json()) as { email?: string };
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

  // Gera token
  const token = await createPasswordResetToken();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  // Salva token no DB (válido por 1h)
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token: tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://meucorre.vercel.app";
  const resetLink = `${appUrl}/recuperar-senha?token=${token}`;

  // Se RESEND_API_KEY estiver configurado, envia email real
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    try {
      await sendResetEmail(email, user.name, resetLink);
      console.log(`[forgot-password] Email enviado para ${email}`);
      return genericResponse;
    } catch (err) {
      console.error("[forgot-password] Erro ao enviar email:", err);
      // Fall through to return link in response
    }
  }

  // Sem Resend configurado: loga o link e retorna na resposta
  // (para desenvolvimento/teste — em produção, configurar RESEND_API_KEY)
  console.log(`[forgot-password] Reset link para ${email}: ${resetLink}`);

  // Retorna o link na resposta (apenas em desenvolvimento)
  // Em produção com Resend, o link não é retornado (só email)
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json({
      ok: true,
      message: "Link de recuperação gerado (verifique o console do servidor).",
      resetLink, // apenas em desenvolvimento
    });
  }

  return genericResponse;
}

// Envia email de recuperação via Resend
async function sendResetEmail(email: string, name: string, resetLink: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: "MeuCorre — Recuperação de Senha",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #10b981;">⚡ MeuCorre</h2>
          <p>Olá, ${name}!</p>
          <p>Você solicitou a recuperação de senha. Clique no link abaixo para definir uma nova senha:</p>
          <p><a href="${resetLink}" style="display: inline-block; background: #10b981; color: #09090b; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Redefinir senha</a></p>
          <p>Ou copie este link: ${resetLink}</p>
          <p style="color: #71717a; font-size: 12px;">Este link expira em 1 hora. Se você não solicitou, ignore este email.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend API error: ${res.status}`);
  }
}
