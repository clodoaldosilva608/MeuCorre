import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";
import { hashPassword } from "@/lib/user-auth";
import { z } from "zod";

// PATCH /api/auth/update-profile
// Atualiza nome, telefone, cidade e/ou senha do usuário logado

const updateProfileSchema = z.object({
  name: z.string().min(2, "Nome muito curto").max(100, "Nome muito longo").optional(),
  phone: z.string().max(30).optional(),
  city: z.string().max(100).optional(),
  password: z.string().min(1).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Validação Zod
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = {};

  if (parsed.data.name !== undefined) {
    const name = parsed.data.name.trim();
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: "Nome inválido (2-100 caracteres)" }, { status: 400 });
    }
    data.name = name;
  }

  if (parsed.data.phone !== undefined) {
    data.phone = parsed.data.phone.trim().slice(0, 30) || null;
  }

  if (parsed.data.city !== undefined) {
    data.city = parsed.data.city.trim().slice(0, 100) || null;
  }

  if (parsed.data.password !== undefined) {
    const { validatePassword } = await import("@/lib/password-policy");
    const pwCheck = validatePassword(parsed.data.password);
    if (!pwCheck.valid) {
      return NextResponse.json({ error: pwCheck.errors[0] }, { status: 400 });
    }
    data.passwordHash = await hashPassword(parsed.data.password);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.sub },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        isPro: true,
        licenseKey: true,
        phone: true,
        city: true,
        active: true,
        trialExtendedUntil: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });
  }
}
