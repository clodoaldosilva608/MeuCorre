import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";
import { z } from "zod";

// POST /api/app/challenge/:id/complete-day
// Marca o dia atual do desafio como completo e avança para o próximo.
// Body: { day: 1-7 }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { day?: number };

  if (!body.day || body.day < 1 || body.day > 7) {
    return NextResponse.json(
      { error: "day deve ser entre 1 e 7" },
      { status: 400 },
    );
  }

  const challenge = await prisma.challengeParticipant.findUnique({ where: { id } });
  if (!challenge) {
    return NextResponse.json({ error: "Desafio não encontrado" }, { status: 404 });
  }

  if (challenge.userId !== session.sub) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  if (challenge.status !== "active") {
    return NextResponse.json(
      { error: `Desafio com status "${challenge.status}" não pode ser modificado` },
      { status: 400 },
    );
  }

  // Verifica expiração
  if (challenge.expiresAt.getTime() < Date.now()) {
    const expired = await prisma.challengeParticipant.update({
      where: { id },
      data: { status: "expired" },
    });
    return NextResponse.json({ error: "Desafio expirado", challenge: expired }, { status: 410 });
  }

  // Atualiza tasks
  const tasks = JSON.parse(challenge.tasksJson || "[]") as Array<{
    day: number;
    completed: boolean;
    completedAt?: string;
    title?: string;
  }>;

  const taskIndex = tasks.findIndex((t) => t.day === body.day);
  if (taskIndex === -1) {
    return NextResponse.json({ error: `Dia ${body.day} não encontrado no desafio` }, { status: 404 });
  }

  if (tasks[taskIndex].completed) {
    return NextResponse.json({ error: `Dia ${body.day} já foi completado` }, { status: 400 });
  }

  tasks[taskIndex].completed = true;
  tasks[taskIndex].completedAt = new Date().toISOString();

  const completedDays = tasks.filter((t) => t.completed).length;
  const nextDay = completedDays < 7 ? completedDays + 1 : 7;

  // Se completou todos os 7 dias, marca como completed
  const isCompleted = completedDays === 7;

  const updated = await prisma.challengeParticipant.update({
    where: { id },
    data: {
      tasksJson: JSON.stringify(tasks),
      currentDay: nextDay,
      status: isCompleted ? "completed" : "active",
      completedAt: isCompleted ? new Date() : null,
    },
  });

  return NextResponse.json({
    challenge: {
      ...updated,
      tasks,
      completedDays,
      progressPct: Math.round((completedDays / 7) * 100),
    },
    isCompleted,
    message: isCompleted
      ? "🎉 Parabéns! Você completou o Desafio de 7 Dias!"
      : `Dia ${body.day} completado! ${7 - completedDays} dia(s) restante(s).`,
  });
}
