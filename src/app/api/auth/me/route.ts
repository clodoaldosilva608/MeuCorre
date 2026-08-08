import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";

// GET /api/auth/me
// Retorna dados do usuário logado (ou null se não logado)
export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  // Busca dados atualizados no DB (status PRO pode ter mudado)
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
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

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user });
}
