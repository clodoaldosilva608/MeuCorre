import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";
import { applyRateLimit } from "@/lib/rate-limit";

// POST /api/app/radar/scan — analisa dados do usuário e gera alertas
//
// SEGURANÇA (P1-1):
// Rate limit 10/user/15min — queries pesadas (4 findMany sem take),
// sem isso usuário pode chamar 100x/min e causar DoS no banco.
export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Rate limit por userId (usuário logado)
  const limited = await applyRateLimit(req, {
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
  }, session.sub);
  if (limited) return limited;

  const userId = session.sub;
  const now = new Date();
  const sevenDaysAgoMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const threeDaysAgoMs = now.getTime() - 3 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgoMs = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  // Busca dados dos últimos 7 e 30 dias
  // SyncedDelivery: ganhos (value), SyncedExpense: despesas (value)
  const sevenDaysAgoStr = new Date(sevenDaysAgoMs).toISOString().slice(0, 10);
  const thirtyDaysAgoStr = new Date(thirtyDaysAgoMs).toISOString().slice(0, 10);

  const [recentDeliveries, recentExpenses, allExpenses30d, activeGoals] = await Promise.all([
    prisma.syncedDelivery.findMany({
      where: {
        userId,
        deleted: false,
        date: { gte: sevenDaysAgoStr },
      },
      select: { id: true, date: true, value: true, app: true },
    }).catch(() => []),
    prisma.syncedExpense.findMany({
      where: {
        userId,
        deleted: false,
        date: { gte: sevenDaysAgoStr },
      },
      select: { id: true, date: true, value: true, category: true, description: true },
    }).catch(() => []),
    prisma.syncedExpense.findMany({
      where: {
        userId,
        deleted: false,
        date: { gte: thirtyDaysAgoStr },
      },
      select: { id: true, date: true, value: true, category: true, description: true },
    }).catch(() => []),
    prisma.syncedGoal.findMany({
      where: { userId, active: true, deleted: false },
    }).catch(() => []),
  ]);

  // Busca alertas ativos existentes (idempotência)
  const existingActive = await prisma.radarAlert.findMany({
    where: { userId, status: "active" },
    select: { type: true },
  });
  const existingTypes = new Set(existingActive.map((a) => a.type));

  const alertsToCreate: Array<{
    type: string;
    title: string;
    message: string;
    triggerData: string;
    suggestedAction: string;
    severity: string;
  }> = [];

  // 1. Sem corrida há 3+ dias
  const lastDelivery = recentDeliveries[recentDeliveries.length - 1];
  const lastDeliveryDate = lastDelivery ? new Date(lastDelivery.date) : null;
  if (!lastDeliveryDate || lastDeliveryDate.getTime() < threeDaysAgoMs) {
    if (!existingTypes.has("sem_corrida_dias")) {
      const days = lastDeliveryDate
        ? Math.floor((now.getTime() - lastDeliveryDate.getTime()) / (24 * 60 * 60 * 1000))
        : 999;
      alertsToCreate.push({
        type: "sem_corrida_dias",
        title: days > 999 ? "Bora começar?" : `${days} dias sem correr`,
        message: days > 999
          ? "Você ainda não lançou nenhuma corrida no MeuCorre. Que tal registrar sua primeira corre hoje?"
          : `Faz ${days} dias desde sua última corrida lançada. Manter o registro diário ajuda a ver padrões e tomar melhores decisões.`,
        triggerData: JSON.stringify({ lastDeliveryDate: lastDelivery?.date, daysWithoutRunning: days }),
        suggestedAction: "Lance sua próxima corrida agora — leva menos de 30 segundos.",
        severity: days > 7 ? "high" : "medium",
      });
    }
  }

  // 2. Lucro baixo nos últimos 7 dias
  const totalEarnings7d = recentDeliveries.reduce((sum, d) => sum + Number(d.value ?? 0), 0);
  const totalExpenses7d = recentExpenses.reduce((sum, e) => sum + Number(e.value ?? 0), 0);
  const netProfit7d = totalEarnings7d - totalExpenses7d;

  if (recentDeliveries.length > 0 && netProfit7d < 50 && !existingTypes.has("lucro_baixo")) {
    alertsToCreate.push({
      type: "lucro_baixo",
      title: "Lucro baixo nesta semana",
      message: `Nos últimos 7 dias você ganhou R$ ${totalEarnings7d.toFixed(2)} e gastou R$ ${totalExpenses7d.toFixed(2)}. Seu lucro líquido foi R$ ${netProfit7d.toFixed(2)} — abaixo do ideal. Revise suas despesas para entender para onde o dinheiro está indo.`,
      triggerData: JSON.stringify({
        period: "7d",
        totalEarnings: totalEarnings7d,
        totalExpenses: totalExpenses7d,
        netProfit: netProfit7d,
        deliveriesCount: recentDeliveries.length,
      }),
      suggestedAction: "Veja suas despesas da semana e identifique onde dá para economizar.",
      severity: netProfit7d < 0 ? "high" : "medium",
    });
  }

  // 3. Despesa recorrente (mesma categoria+descrição 3+ vezes no mês)
  if (!existingTypes.has("despesa_recorrente")) {
    const expenseMap = new Map<string, { count: number; total: number; description: string }>();
    for (const e of allExpenses30d) {
      const key = `${e.category}|${(e.description ?? "").toLowerCase().slice(0, 30)}`;
      const existing = expenseMap.get(key) ?? { count: 0, total: 0, description: e.description ?? "" };
      existing.count++;
      existing.total += Number(e.value ?? 0);
      expenseMap.set(key, existing);
    }
    for (const [, data] of expenseMap) {
      if (data.count >= 3) {
        alertsToCreate.push({
          type: "despesa_recorrente",
          title: `Despesa recorrente: ${data.description}`,
          message: `Você lançou "${data.description}" ${data.count} vezes nos últimos 30 dias, totalizando R$ ${data.total.toFixed(2)}. Despesas recorrentes merecem atenção — vale revisar se todas são necessárias.`,
          triggerData: JSON.stringify({ count: data.count, total: data.total, description: data.description }),
          suggestedAction: "Considere negociar um plano mensal ou buscar alternativas mais baratas.",
          severity: "low",
        });
        break;
      }
    }
  }

  // 4. Gastos > ganhos nos últimos 7 dias
  if (!existingTypes.has("gastos_vs_ganhos")) {
    if (totalExpenses7d > totalEarnings7d && totalEarnings7d > 0) {
      alertsToCreate.push({
        type: "gastos_vs_ganhos",
        title: "Gastos superando ganhos",
        message: `Nos últimos 7 dias, suas despesas (R$ ${totalExpenses7d.toFixed(2)}) foram maiores que seus ganhos (R$ ${totalEarnings7d.toFixed(2)}). Isso significa prejuízo — o corre está custando dinheiro.`,
        triggerData: JSON.stringify({
          earnings: totalEarnings7d,
          expenses: totalExpenses7d,
          deficit: totalExpenses7d - totalEarnings7d,
        }),
        suggestedAction: "Revise suas despesas urgentemente. Considere reduzir custos ou aumentar horas de corrida.",
        severity: "high",
      });
    }
  }

  // 5. Meta ativa sem nome de acompanhamento (sem entries recentes)
  // SyncedGoal não tem currentValue — apenas targetValue. Alertamos se há metas ativas há 5+ dias.
  if (!existingTypes.has("meta_atrasada") && activeGoals.length > 0) {
    const oldGoal = activeGoals.find((g) => {
      const daysSinceCreated = Math.floor((now.getTime() - g.createdAt.getTime()) / (24 * 60 * 60 * 1000));
      return daysSinceCreated >= 5;
    });
    if (oldGoal) {
      const daysSinceCreated = Math.floor((now.getTime() - oldGoal.createdAt.getTime()) / (24 * 60 * 60 * 1000));
      alertsToCreate.push({
        type: "meta_atrasada",
        title: `Meta "${oldGoal.label ?? "Sem nome"}" precisa de atenção`,
        message: `Sua meta "${oldGoal.label ?? "Sem nome"}" foi criada há ${daysSinceCreated} dias. Metas sem acompanhamento regular tendem a não ser atingidas. Verifique seu progresso.`,
        triggerData: JSON.stringify({
          goalId: oldGoal.id,
          goalLabel: oldGoal.label,
          targetValue: Number(oldGoal.targetValue),
          type: oldGoal.type,
          daysSinceCreated,
        }),
        suggestedAction: "Revise a meta: ela está realista? Acompanhe seu progresso diariamente.",
        severity: "medium",
      });
    }
  }

  // Cria alertas
  if (alertsToCreate.length > 0) {
    await prisma.radarAlert.createMany({
      data: alertsToCreate.map((a) => ({ userId, ...a })),
    });
  }

  const activeAlerts = await prisma.radarAlert.findMany({
    where: { userId, status: "active" },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    scanned: true,
    generated: alertsToCreate.length,
    activeCount: activeAlerts.length,
    alerts: activeAlerts,
  });
}
