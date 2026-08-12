import { NextRequest, NextResponse } from "next/server";
import { prisma, prismaRead } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/admin/metrics/dashboard — Dashboard executivo com KPIs de negócio
//
// Retorna métricas agregadas de todas as áreas:
//   - Receita (assinaturas aprovadas, pendentes, rejeitadas, total)
//   - Usuários (total, trial, pro, novos 30d)
//   - Parceiros (total, por estágio, ativos, novos 30d)
//   - Indicações (total, convertidas, pendentes)
//   - App (ads views, clicks, ctr, feedbacks)
//   - Campanhas (publicadas, pausadas, expiradas, métricas views/clicks/leads)
//   - Outbound (preparadas, enviadas, respondidas, opt-outs)
//   - Propostas (rascunho, enviadas, aprovadas, rejeitadas)
//
// Query: periodDays (default 30 — para filtros temporais)
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const periodDays = Math.min(Math.max(Number(searchParams.get("periodDays") ?? 30), 1), 365);
  const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

  // Executa todas as queries em paralelo para performance
  const [
    // Receita
    subsApproved,
    subsPending,
    subsRejected,
    subsRevenue,
    subsRevenuePeriod,
    // Usuários
    totalUsers,
    proUsers,
    trialUsers,
    newUsersPeriod,
    // Parceiros
    totalPartners,
    partnersByStage,
    activePartners,
    newPartnersPeriod,
    // Indicações
    totalReferrals,
    completedReferrals,
    pendingReferrals,
    referralCampaign,
    // App
    adStats,
    totalFeedbacks,
    avgFeedbackRating,
    newFeedbacksPeriod,
    // Campanhas de parceiros (se feature flag ativa)
    totalCampaigns,
    publishedCampaigns,
    pausedCampaigns,
    expiredCampaigns,
    campaignMetrics,
    // Outbound (se feature flag ativa)
    outboundStats,
    // Propostas
    proposalStats,
    // Divulgação (se feature flag ativa)
    promotionStats,
  ] = await Promise.all([
    prismaRead.subscription.count({ where: { status: "approved" } }),
    prismaRead.subscription.count({ where: { status: "pending" } }),
    prismaRead.subscription.count({ where: { status: "rejected" } }),
    prismaRead.subscription.aggregate({
      where: { status: "approved" },
      _sum: { amount: true },
    }),
    prismaRead.subscription.aggregate({
      where: { status: "approved", createdAt: { gte: periodStart } },
      _sum: { amount: true },
    }),
    prismaRead.user.count(),
    prismaRead.user.count({ where: { isPro: true } }),
    prismaRead.user.count({ where: { subscriptionStatus: "trialing" } }),
    prismaRead.user.count({ where: { createdAt: { gte: periodStart } } }),
    prismaRead.partner.count(),
    prismaRead.partner.groupBy({ by: ["stage"], _count: true }),
    prismaRead.partner.count({ where: { status: "active" } }),
    prismaRead.partner.count({ where: { createdAt: { gte: periodStart } } }),
    prismaRead.referral.count(),
    prismaRead.referral.count({ where: { status: "completed" } }),
    prismaRead.referral.count({ where: { status: "pending" } }),
    prismaRead.referralCampaign.findFirst({ orderBy: { createdAt: "desc" } }),
    prismaRead.ad.aggregate({ _sum: { views: true, clicks: true } }),
    prismaRead.feedback.count(),
    prismaRead.feedback.aggregate({ _avg: { rating: true } }),
    prismaRead.feedback.count({ where: { createdAt: { gte: periodStart } } }),
    // Campanhas
    prismaRead.partnerCampaign.count().catch(() => 0),
    prismaRead.partnerCampaign.count({ where: { status: "published" } }).catch(() => 0),
    prismaRead.partnerCampaign.count({ where: { status: "paused" } }).catch(() => 0),
    prismaRead.partnerCampaign.count({ where: { status: "expired" } }).catch(() => 0),
    prismaRead.partnerCampaign.aggregate({
      _sum: { views: true, clicks: true, leads: true, redemptions: true },
    }).catch(() => ({ _sum: { views: 0, clicks: 0, leads: 0, redemptions: 0 } })),
    // Outbound
    prismaRead.outboundLog.groupBy({ by: ["status"], _count: true }).catch(() => []),
    // Propostas
    prismaRead.proposal.groupBy({ by: ["status"], _count: true }).catch(() => []),
    // Divulgação
    prismaRead.promotionPost.groupBy({ by: ["status"], _count: true }).catch(() => []),
  ]);

  // Normaliza parceiros por estágio
  const stagesArray = [
    "novo_lead", "qualificando", "contato_iniciado", "descoberta",
    "proposta_enviada", "negociacao", "aguardando_aprovacao",
    "ativacao", "ativo", "renovacao", "perdido", "desqualificado",
  ];
  const partnersByStageMap: Record<string, number> = {};
  for (const s of stagesArray) partnersByStageMap[s] = 0;
  for (const { stage, _count } of partnersByStage) {
    if (stage) partnersByStageMap[stage] = _count;
  }

  // Normaliza outbound
  const outboundMap: Record<string, number> = {};
  for (const { status, _count } of outboundStats as Array<{ status: string; _count: number }>) {
    outboundMap[status] = _count;
  }

  // Normaliza propostas
  const proposalMap: Record<string, number> = {};
  for (const { status, _count } of proposalStats as Array<{ status: string; _count: number }>) {
    proposalMap[status] = _count;
  }

  // Normaliza divulgação
  const promotionMap: Record<string, number> = {};
  for (const { status, _count } of promotionStats as Array<{ status: string; _count: number }>) {
    promotionMap[status] = _count;
  }

  // Métricas calculadas
  const totalRevenue = Number(subsRevenue._sum.amount ?? 0);
  const periodRevenue = Number(subsRevenuePeriod._sum.amount ?? 0);
  const totalViews = adStats._sum.views ?? 0;
  const totalClicks = adStats._sum.clicks ?? 0;
  const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
  const conversionRate = totalUsers > 0 ? (proUsers / totalUsers) * 100 : 0;
  const referralConversion = totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0;

  // Métricas de campanhas
  const campaignViews = campaignMetrics._sum.views ?? 0;
  const campaignClicks = campaignMetrics._sum.clicks ?? 0;
  const campaignLeads = campaignMetrics._sum.leads ?? 0;
  const campaignCTR = campaignViews > 0 ? (campaignClicks / campaignViews) * 100 : 0;

  return NextResponse.json({
    period: { days: periodDays, start: periodStart.toISOString() },
    revenue: {
      total: totalRevenue,
      period: periodRevenue,
      subscriptionsApproved: subsApproved,
      subscriptionsPending: subsPending,
      subscriptionsRejected: subsRejected,
      avgTicket: subsApproved > 0 ? Number((totalRevenue / subsApproved).toFixed(2)) : 0,
    },
    users: {
      total: totalUsers,
      pro: proUsers,
      trial: trialUsers,
      newPeriod: newUsersPeriod,
      conversionRate: Number(conversionRate.toFixed(2)),
    },
    partners: {
      total: totalPartners,
      active: activePartners,
      newPeriod: newPartnersPeriod,
      byStage: partnersByStageMap,
    },
    referrals: {
      total: totalReferrals,
      completed: completedReferrals,
      pending: pendingReferrals,
      conversionRate: Number(referralConversion.toFixed(2)),
      campaignActive: referralCampaign?.active ?? false,
      rewardAmount: Number(referralCampaign?.rewardAmount ?? 5),
    },
    app: {
      totalViews,
      totalClicks,
      ctr: Number(ctr.toFixed(2)),
      totalFeedbacks,
      avgRating: avgFeedbackRating._avg.rating
        ? Number(avgFeedbackRating._avg.rating.toFixed(2))
        : 0,
      newFeedbacksPeriod,
    },
    campaigns: {
      total: totalCampaigns,
      published: publishedCampaigns,
      paused: pausedCampaigns,
      expired: expiredCampaigns,
      views: campaignViews,
      clicks: campaignClicks,
      leads: campaignLeads,
      ctr: Number(campaignCTR.toFixed(2)),
    },
    outbound: outboundMap,
    proposals: proposalMap,
    promotion: promotionMap,
  });
}
