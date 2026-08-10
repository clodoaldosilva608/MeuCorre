import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";
import { hashPassword } from "@/lib/user-auth";

// PATCH /api/auth/update-profile
// Atualiza nome, telefone, cidade e/ou senha do usuário logado
export async function PATCH(req: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: { name?: string; phone?: string; city?: string; password?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: "Nome inválido (2-100 caracteres)" }, { status: 400 });
    }
    data.name = name;
  }

  if (body.phone !== undefined) {
    data.phone = body.phone.trim().slice(0, 30) || null;
  }

  if (body.city !== undefined) {
    data.city = body.city.trim().slice(0, 100) || null;
  }

  if (body.password !== undefined) {
    if (body.password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter no mínimo 6 caracteres" }, { status: 400 });
    }
    data.passwordHash = await hashPassword(body.password);
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
