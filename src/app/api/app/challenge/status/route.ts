import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";

// GET /api/app/challenge/status — retorna status do desafio atual do usuário
export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Busca desafio ativo ou mais recente
  const challenge = await prisma.challengeParticipant.findFirst({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
  });

  if (!challenge) {
    return NextResponse.json({
      challenge: null,
      message: "Nenhum desafio iniciado. Use POST /api/app/challenge/start para começar.",
    });
  }

  // Verifica expiração
  if (challenge.status === "active" && challenge.expiresAt.getTime() < Date.now()) {
    const updated = await prisma.challengeParticipant.update({
      where: { id: challenge.id },
      data: { status: "expired" },
    });
    return NextResponse.json({
      challenge: updated,
      message: "Desafio expirado. Que tal tentar novamente?",
    });
  }

  // Calcula progresso
  const tasks = JSON.parse(challenge.tasksJson || "[]") as Array<{
    day: number;
    completed: boolean;
    completedAt?: string;
  }>;

  const completedDays = tasks.filter((t) => t.completed).length;
  const progressPct = Math.round((completedDays / 7) * 100);

  return NextResponse.json({
    challenge: {
      ...challenge,
      tasks,
      completedDays,
      progressPct,
    },
  });
}
