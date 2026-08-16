import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/user-auth";
import { jwtVerify } from "jose";
import crypto from "crypto";
import { applyRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

// POST /api/auth/reset-password
// Reseta a senha usando token recebido por email
// Rate limited: 5 tentativas por IP a cada 15 min (brute force protection)

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
});

// PUBLIC ROUTE — Esta rota é intencionalmente pública (não requer admin auth)
export async function POST(req: NextRequest) {
  // Rate limit: 5 tentativas por IP a cada 15 min
  const limited = await applyRateLimit(
    req,
    { windowMs: 15 * 60 * 1000, maxRequests: 5 },
    "reset-password",
  );
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Validação Zod
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const { token, password } = parsed.data;

  // Validação de senha com política forte
  const { validatePassword } = await import("@/lib/password-policy");
  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) {
    return NextResponse.json(
      { error: pwCheck.errors[0] },
      { status: 400 },
    );
  }

  // Verifica JWT do token
  const secret = new TextEncoder().encode(
    process.env.USER_JWT_SECRET ?? process.env.ADMIN_JWT_SECRET ?? "fallback",
  );
  try {
    await jwtVerify(token, secret, { algorithms: ["HS256"] });
  } catch {
    return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 401 });
  }

  // Busca token no DB (hash sha256)
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: tokenHash },
  });

  if (!resetToken) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
  if (resetToken.usedAt) {
    return NextResponse.json({ error: "Token já foi usado" }, { status: 401 });
  }
  if (resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token expirado" }, { status: 401 });
  }

  // Atualiza senha
  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash },
  });

  // Marca token como usado
  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { usedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
