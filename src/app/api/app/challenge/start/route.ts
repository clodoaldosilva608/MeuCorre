import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";

// POST /api/app/challenge/start — inicia novo desafio de 7 dias
// Verifica se já existe desafio ativo; se sim, retorna o existente.
export async function POST() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Verifica se já tem desafio ativo
  const existing = await prisma.challengeParticipant.findFirst({
    where: { userId: session.sub, status: "active" },
  });

  if (existing) {
    return NextResponse.json({
      challenge: existing,
      message: "Você já tem um desafio ativo.",
    });
  }

  // Cria novo desafio
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000); // 7 dias + 2 dias tolerância

  // 7 tarefas padrão (uma por dia)
  const defaultTasks = [
    { day: 1, completed: false, title: "Lance todas suas corridas de hoje" },
    { day: 2, completed: false, title: "Registre todas as despesas do dia" },
    { day: 3, completed: false, title: "Defina uma meta para a semana" },
    { day: 4, completed: false, title: "Revise seu lucro líquido dos 3 primeiros dias" },
    { day: 5, completed: false, title: "Identifique 1 despesa que pode ser reduzida" },
    { day: 6, completed: false, title: "Compare seus ganhos vs despesas da semana" },
    { day: 7, completed: false, title: "Fechamento: analise seu lucro da semana inteira" },
  ];

  const challenge = await prisma.challengeParticipant.create({
    data: {
      userId: session.sub,
      status: "active",
      currentDay: 1,
      tasksJson: JSON.stringify(defaultTasks),
      startedAt: now,
      expiresAt,
    },
  });

  return NextResponse.json({
    challenge: {
      ...challenge,
      tasks: defaultTasks,
    },
    message: "Desafio de 7 dias iniciado! Complete uma tarefa por dia.",
  }, { status: 201 });
}
