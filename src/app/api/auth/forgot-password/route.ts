import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/user-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { enqueue } from "@/lib/queue";
import { z } from "zod";
import crypto from "crypto";

// POST /api/auth/forgot-password
// Gera token de reset e enfileira envio de email via fila.
//
// SEGURANÇA/PERFORMANCE (P2-1 corrigido):
// Antes: envio de email era síncrono. Se Resend lento (5s), response demorava.
// Em scale, 5 users pedindo reset ao mesmo tempo = 25s de latência total.
// Agora: enfileira para /api/queue/send-email (QStash em prod, sync em dev).
// Response retorna imediato (token já está no DB).

const forgotSchema = z.object({
  email: z.string().email("Email inválido"),
});

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, {
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

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

  // Se RESEND_API_KEY configurado, enfileira envio de email
  if (process.env.RESEND_API_KEY) {
    const result = await enqueue({
      url: "/api/queue/send-email",
      body: {
        type: "reset-password",
        to: email,
        userName: user.name,
        resetLink,
      },
    });

    if (!result.ok && result.sync) {
      // Em dev (sync), se falhou, loga e retorna genérico
      console.error("[forgot-password] Falha ao enfileirar email:", result.error);
    } else {
      console.log("[forgot-password] Email enfileirado");
    }
    return genericResponse;
  }

  // Sem Resend configurado: retorna link apenas em desenvolvimento
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json({
      ok: true,
      message: "Link de recuperação gerado (verifique o console do servidor).",
      resetLink, // apenas em desenvolvimento
    });
  }

  return genericResponse;
}
