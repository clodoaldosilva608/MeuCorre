import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeString } from "@/lib/validation";

// POST /api/public/teams/invite/:token/accept — aceita convite
// Body: { name, phone?, userId? }
//
// Cria TeamMember com status active e marca convite como accepted.
// Se userId informado, linka TeamMember com User.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 });
  }

  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: { team: true },
  });

  if (!invite) {
    return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
  }

  // Verifica expiração
  if (invite.expiresAt.getTime() < Date.now()) {
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: "expired" },
    });
    return NextResponse.json({ error: "Convite expirado" }, { status: 410 });
  }

  if (invite.status !== "pending") {
    return NextResponse.json(
      { error: `Convite já foi ${invite.status}` },
      { status: 410 },
    );
  }

  if (!invite.team.active) {
    return NextResponse.json({ error: "Time inativo" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    phone?: string;
    userId?: string;
  };

  // Verifica se já é membro (caso já tenha aceito antes)
  const existingMember = await prisma.teamMember.findUnique({
    where: { teamId_email: { teamId: invite.teamId, email: invite.email } },
  });
  if (existingMember && existingMember.status === "active") {
    return NextResponse.json(
      { error: "Você já é membro deste time", member: existingMember },
      { status: 409 },
    );
  }

  // Verifica limite
  const memberCount = await prisma.teamMember.count({
    where: { teamId: invite.teamId, status: "active" },
  });
  if (memberCount >= invite.team.maxMembers) {
    return NextResponse.json(
      { error: "Time atingiu o limite de membros" },
      { status: 400 },
    );
  }

  // Transação: cria/atualiza membro + marca convite como accepted
  const member = await prisma.$transaction(async (tx) => {
    // Cria membro (ou reativa se existia)
    const m = existingMember
      ? await tx.teamMember.update({
          where: { id: existingMember.id },
          data: {
            status: "active",
            role: invite.role,
            userId: body.userId || existingMember.userId,
            name: body.name ? sanitizeString(body.name, 100) : existingMember.name,
            phone: body.phone ? sanitizeString(body.phone, 30) : existingMember.phone,
          },
        })
      : await tx.teamMember.create({
          data: {
            teamId: invite.teamId,
            userId: body.userId || null,
            name: body.name ? sanitizeString(body.name, 100) : (invite.name ?? invite.email.split("@")[0]),
            email: invite.email,
            phone: body.phone ? sanitizeString(body.phone, 30) : (invite.phone ?? null),
            role: invite.role,
            status: "active",
          },
        });

    // Marca convite como accepted
    await tx.teamInvite.update({
      where: { id: invite.id },
      data: {
        status: "accepted",
        acceptedAt: new Date(),
        acceptedUserId: body.userId || null,
      },
    });

    return m;
  });

  return NextResponse.json({
    member,
    team: {
      id: invite.team.id,
      name: invite.team.name,
    },
    accepted: true,
  }, { status: 201 });
}
