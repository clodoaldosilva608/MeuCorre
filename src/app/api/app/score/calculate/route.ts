import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";

// POST /api/app/score/calculate — calcula e salva novo snapshot do score
//
// Score NÃO JULGA — mostra evolução. Não compara com outros usuários.
// Fatores (cada um 0-100, ponderados):
//   1. Regularity (40%): regularidade de lançamentos (corridas + despesas)
//   2. Consistency (35%): consistência de lucro positivo
//   3. GoalAdherence (25%): acompanhamento de metas ativas
export async function POST() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const userId = session.sub;
  const now = new Date();
  const sevenDaysAgoMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const sevenDaysAgoStr = new Date(sevenDaysAgoMs).toISOString().slice(0, 10);

  // Busca dados dos últimos 7 dias
  const [deliveries, expenses, goals] = await Promise.all([
    prisma.syncedDelivery.findMany({
      where: {
        userId,
        deleted: false,
        date: { gte: sevenDaysAgoStr },
      },
      select: { id: true, date: true, value: true },
    }).catch(() => []),
    prisma.syncedExpense.findMany({
      where: {
        userId,
        deleted: false,
        date: { gte: sevenDaysAgoStr },
      },
      select: { id: true, date: true, value: true },
    }).catch(() => []),
    prisma.syncedGoal.findMany({
      where: { userId, active: true, deleted: false },
    }).catch(() => []),
  ]);

  // === 1. Regularity Score (40%) ===
  const daysWithActivity = new Set<string>();
  for (const d of deliveries) daysWithActivity.add(d.date);
  for (const e of expenses) daysWithActivity.add(e.date);
  const regularityScore = Math.round((daysWithActivity.size / 7) * 100);

  // === 2. Consistency Score (35%) ===
  // % dos dias com atividade que tiveram lucro líquido positivo
  const dailyPnl = new Map<string, number>();
  for (const d of deliveries) {
    dailyPnl.set(d.date, (dailyPnl.get(d.date) ?? 0) + Number(d.value ?? 0));
  }
  for (const e of expenses) {
    dailyPnl.set(e.date, (dailyPnl.get(e.date) ?? 0) - Number(e.value ?? 0));
  }
  let positiveDays = 0;
  for (const [, pnl] of dailyPnl) {
    if (pnl > 0) positiveDays++;
  }
  const consistencyScore = dailyPnl.size > 0
    ? Math.round((positiveDays / dailyPnl.size) * 100)
    : 0;

  // === 3. Goal Adherence Score (25%) ===
  // % de metas ativas (presença de metas mostra engajamento)
  // SyncedGoal não tem currentValue — presença de metas ativas já é sinal positivo
  const goalAdherenceScore = goals.length > 0
    ? Math.min(100, 50 + goals.length * 25) // 1 meta = 75, 2+ = 100
    : 30; // sem metas = baixo engajamento

  // === Score total (ponderado) ===
  const score = Math.round(
    regularityScore * 0.40 +
    consistencyScore * 0.35 +
    goalAdherenceScore * 0.25,
  );

  const details = JSON.stringify({
    factors: [
      {
        name: "regularity",
        label: "Regularidade de lançamentos",
        value: regularityScore,
        weight: 0.40,
        contribution: Math.round(regularityScore * 0.40),
        explanation: `${daysWithActivity.size} de 7 dias com atividade registrada`,
      },
      {
        name: "consistency",
        label: "Consistência de lucro",
        value: consistencyScore,
        weight: 0.35,
        contribution: Math.round(consistencyScore * 0.35),
        explanation: `${positiveDays} de ${dailyPnl.size} dias com lucro positivo`,
      },
      {
        name: "goalAdherence",
        label: "Acompanhamento de metas",
        value: goalAdherenceScore,
        weight: 0.25,
        contribution: Math.round(goalAdherenceScore * 0.25),
        explanation: goals.length > 0
          ? `${goals.length} meta(s) ativa(s)`
          : "Sem metas ativas",
      },
    ],
  });

  const snapshot = await prisma.scoreSnapshot.create({
    data: {
      userId,
      score,
      regularityScore,
      consistencyScore,
      goalAdherenceScore,
      details,
      periodStart: new Date(sevenDaysAgoMs),
      periodEnd: now,
    },
  });

  return NextResponse.json({
    snapshot,
    interpretation: interpretScore(score, { regularityScore, consistencyScore, goalAdherenceScore }),
  }, { status: 201 });
}

function interpretScore(
  score: number,
  factors: { regularityScore: number; consistencyScore: number; goalAdherenceScore: number },
): string {
  const parts: string[] = [];

  if (score >= 70) {
    parts.push("Excelente consistência!");
  } else if (score >= 50) {
    parts.push("Boa consistência.");
  } else if (score >= 30) {
    parts.push("Consistência moderada.");
  } else {
    parts.push("Vamos construir consistência aos poucos.");
  }

  const weakest = Math.min(factors.regularityScore, factors.consistencyScore, factors.goalAdherenceScore);
  if (factors.regularityScore === weakest && factors.regularityScore < 50) {
    parts.push("Tente lançar suas corridas e despesas com mais frequência — mesmo que sejam pequenas.");
  } else if (factors.consistencyScore === weakest && factors.consistencyScore < 50) {
    parts.push("Revise suas despesas: alguns dias estão com lucro baixo.");
  } else if (factors.goalAdherenceScore === weakest && factors.goalAdherenceScore < 50) {
    parts.push("Defina metas realistas e acompanhe o progresso regularmente.");
  }

  parts.push("Lembre-se: o score mostra sua evolução, não compara com outros.");

  return parts.join(" ");
}
