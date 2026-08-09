import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/admin/dashboard — estatísticas gerais pra home do admin
//
// PERFORMANCE: Usa aggregate() do Prisma (_sum, _avg, _count) para que
// o cálculo aconteça no banco de dados (SQL nativo), não na memória do Node.
// Antes, findMany() carregava TODOS os ads e subscriptions na RAM e fazia
// reduce() em JavaScript — causava OOM com 50k+ registros.
// Agora, cada métrica é uma query SQL agregada (5ms, 0 RAM).
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const [
    totalAds,
    activeAds,
    totalSubscriptions,
    pendingSubscriptions,
    approvedSubscriptions,
    rejectedSubscriptions,
    totalFeedbacks,
    avgFeedbackRating,
    adStats,
    subRevenue,
  ] = await Promise.all([
    prisma.ad.count(),
    prisma.ad.count({ where: { active: true } }),
    prisma.subscription.count(),
    prisma.subscription.count({ where: { status: "pending" } }),
    prisma.subscription.count({ where: { status: "approved" } }),
    prisma.subscription.count({ where: { status: "rejected" } }),
    prisma.feedback.count(),
    prisma.feedback.aggregate({ _avg: { rating: true } }),
    // Agregação SQL: _sum de views e clicks (1 query, 0 registros na RAM)
    prisma.ad.aggregate({
      _sum: { views: true, clicks: true },
    }),
    // Agregação SQL: _sum de amount apenas das aprovadas (1 query, 0 registros na RAM)
    prisma.subscription.aggregate({
      where: { status: "approved" },
      _sum: { amount: true },
    }),
  ]);

  // _sum retorna null se a tabela estiver vazia — usamos ?? 0 para segurança
  const totalViews = adStats._sum.views ?? 0;
  const totalClicks = adStats._sum.clicks ?? 0;
  const totalRevenue = Number(subRevenue._sum.amount ?? 0);
  const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

  return NextResponse.json({
    ads: {
      total: totalAds,
      active: activeAds,
      views: totalViews,
      clicks: totalClicks,
      ctr: Number(ctr.toFixed(2)),
    },
    subscriptions: {
      total: totalSubscriptions,
      pending: pendingSubscriptions,
      approved: approvedSubscriptions,
      rejected: rejectedSubscriptions,
      revenue: Number(totalRevenue.toFixed(2)),
    },
    feedbacks: {
      total: totalFeedbacks,
      avgRating: avgFeedbackRating._avg.rating
        ? Number(avgFeedbackRating._avg.rating.toFixed(2))
        : 0,
    },
  });
}
