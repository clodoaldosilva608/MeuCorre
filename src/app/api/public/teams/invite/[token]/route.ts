import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/teams/invite/:token — retorna detalhes do convite (sem auth)
// Usado para mostrar a tela de aceite antes de o usuário confirmar
// PUBLIC ROUTE — Esta rota é intencionalmente pública (não requer admin auth)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 });
  }

  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: {
      team: {
        select: { id: true, name: true, companyName: true, description: true },
      },
    },
  });

  if (!invite) {
    return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
  }

  // Verifica expiração
  if (invite.status === "pending" && invite.expiresAt.getTime() < Date.now()) {
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: "expired" },
    });
    return NextResponse.json(
      { error: "Convite expirado", expiredAt: invite.expiresAt },
      { status: 410 },
    );
  }

  if (invite.status !== "pending") {
    return NextResponse.json(
      { error: `Convite já foi ${invite.status}`, status: invite.status },
      { status: 410 },
    );
  }

  // Retorna apenas campos seguros (não retorna o token novamente)
  return NextResponse.json({
    invite: {
      id: invite.id,
      email: invite.email,
      name: invite.name,
      role: invite.role,
      invitedAt: invite.invitedAt,
      expiresAt: invite.expiresAt,
      team: invite.team,
    },
  });
}
