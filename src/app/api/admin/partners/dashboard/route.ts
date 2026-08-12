import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/admin/partners/dashboard — KPIs do CRM
// Retorna:
//   - totalPartners, byStage, byCategory, byCity, byAssignedTo
//   - totalOpportunities, potentialValueSum
//   - pendingActivities (count + próximas 10)
//   - recentLogs (últimas 20 ações)
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const STAGES = [
    "novo_lead", "qualificando", "contato_iniciado", "descoberta",
    "proposta_enviada", "negociacao", "aguardando_aprovacao",
    "ativacao", "ativo", "renovacao", "perdido", "desqualificado",
  ];

  const [
    totalPartners,
    partnersByStage,
    partnersByCategory,
    partnersByCity,
    partnersByAssignedTo,
    partnersByPriority,
    totalOpportunities,
    potentialValueAgg,
    pendingActivitiesCount,
    pendingActivities,
    recentLogs,
    partnersCreatedLast30Days,
  ] = await Promise.all([
    prisma.partner.count(),
    prisma.partner.groupBy({ by: ["stage"], _count: true }),
    prisma.partner.groupBy({ by: ["category"], _count: true }),
    prisma.partner.groupBy({ by: ["city"], _count: true, orderBy: { _count: { city: "desc" } }, take: 10 }),
    prisma.partner.groupBy({ by: ["assignedTo"], _count: true, orderBy: { _count: { assignedTo: "desc" } }, take: 10 }),
    prisma.partner.groupBy({ by: ["priority"], _count: true }),
    prisma.opportunity.count(),
    prisma.opportunity.aggregate({ _sum: { potentialValue: true } }),
    prisma.partnerActivity.count({ where: { status: "pending" } }),
    prisma.partnerActivity.findMany({
      where: { status: "pending" },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
      take: 10,
      include: {
        partner: { select: { id: true, companyName: true, city: true, category: true } },
        opportunity: { select: { title: true } },
      },
    }),
    prisma.partnerLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { partner: { select: { companyName: true } } },
    }),
    prisma.partner.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  // Normaliza estágios (preenche zeros)
  const byStage: Record<string, number> = {};
  for (const s of STAGES) byStage[s] = 0;
  for (const { stage, _count } of partnersByStage) {
    if (stage) byStage[stage] = _count;
  }

  const byCategory: Record<string, number> = {};
  for (const { category, _count } of partnersByCategory) {
    byCategory[category ?? "sem_categoria"] = _count;
  }

  const byCity: Array<{ city: string | null; count: number }> = partnersByCity.map((c) => ({
    city: c.city,
    count: c._count,
  }));

  const byAssignedTo: Array<{ assignedTo: string | null; count: number }> = partnersByAssignedTo.map((a) => ({
    assignedTo: a.assignedTo,
    count: a._count,
  }));

  const byPriority: Record<string, number> = {};
  for (const { priority, _count } of partnersByPriority) {
    byPriority[priority ?? "media"] = _count;
  }

  return NextResponse.json({
    totalPartners,
    partnersCreatedLast30Days,
    totalOpportunities,
    potentialValueSum: potentialValueAgg._sum.potentialValue ?? 0,
    pendingActivitiesCount,
    byStage,
    byCategory,
    byCity,
    byAssignedTo,
    byPriority,
    pendingActivities,
    recentLogs,
  });
}
