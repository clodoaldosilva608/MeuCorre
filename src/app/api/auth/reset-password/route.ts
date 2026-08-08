import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/user-auth";
import { jwtVerify } from "jose";
import crypto from "crypto";

// POST /api/auth/reset-password
// Reseta a senha usando token recebido por email
export async function POST(req: NextRequest) {
  let body: { token?: string; password?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const token = body.token;
  const password = body.password;

  if (!token || !password) {
    return NextResponse.json({ error: "Token e nova senha são obrigatórios" }, { status: 400 });
  }
  if (password.length < 6 || password.length > 100) {
    return NextResponse.json({ error: "Senha deve ter entre 6 e 100 caracteres" }, { status: 400 });
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
