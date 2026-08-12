import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/portal/:token — retorna dados do portal do parceiro
// Sem admin auth — usa token único. Valida permissões e expiração.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 });
  }

  const portalToken = await prisma.partnerPortalToken.findUnique({
    where: { token },
    include: {
      partner: {
        select: {
          id: true,
          companyName: true,
          city: true,
          state: true,
          category: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!portalToken) {
    return NextResponse.json({ error: "Token não encontrado" }, { status: 404 });
  }

  if (!portalToken.active) {
    return NextResponse.json({ error: "Token revogado" }, { status: 403 });
  }

  // Verifica expiração
  if (portalToken.expiresAt && portalToken.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Token expirado" }, { status: 410 });
  }

  // Atualiza lastUsedAt (não aguarda)
  prisma.partnerPortalToken.update({
    where: { id: portalToken.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {
    // ignore
  });

  // Busca campanhas do parceiro (se permitido)
  let campaigns: unknown[] = [];
  if (portalToken.canViewCampaigns) {
    campaigns = await prisma.partnerCampaign.findMany({
      where: { partnerId: portalToken.partnerId },
      select: {
        id: true,
        name: true,
        offerTitle: true,
        offerDescription: true,
        offerCta: true,
        offerUrl: true,
        couponCode: true,
        discountText: true,
        category: true,
        status: true,
        startsAt: true,
        endsAt: true,
        publishedAt: true,
        views: true,
        clicks: true,
        leads: true,
        redemptions: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }).catch(() => []);
  }

  // Busca métricas agregadas (se permitido)
  let metrics: {
    totalCampaigns: number;
    publishedCampaigns: number;
    totalViews: number;
    totalClicks: number;
    totalLeads: number;
    totalRedemptions: number;
    ctr: number;
  } | null = null;
  if (portalToken.canViewMetrics) {
    const campaignMetrics = await prisma.partnerCampaign.aggregate({
      where: { partnerId: portalToken.partnerId },
      _sum: { views: true, clicks: true, leads: true, redemptions: true },
      _count: true,
    }).catch(() => ({ _sum: { views: 0, clicks: 0, leads: 0, redemptions: 0 }, _count: 0 }));

    const publishedCount = await prisma.partnerCampaign.count({
      where: { partnerId: portalToken.partnerId, status: "published" },
    }).catch(() => 0);

    metrics = {
      totalCampaigns: campaignMetrics._count,
      publishedCampaigns: publishedCount,
      totalViews: campaignMetrics._sum.views ?? 0,
      totalClicks: campaignMetrics._sum.clicks ?? 0,
      totalLeads: campaignMetrics._sum.leads ?? 0,
      totalRedemptions: campaignMetrics._sum.redemptions ?? 0,
      ctr: campaignMetrics._sum.views
        ? Number(((campaignMetrics._sum.clicks ?? 0) / campaignMetrics._sum.views * 100).toFixed(2))
        : 0,
    };
  }

  // Busca propostas (se permitido)
  let proposals: unknown[] = [];
  if (portalToken.canViewProposals) {
    proposals = await prisma.proposal.findMany({
      where: { partnerId: portalToken.partnerId },
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        billingModel: true,
        campaignPrice: true,
        leadPrice: true,
        validUntil: true,
        sentAt: true,
        approvedAt: true,
        version: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }).catch(() => []);
  }

  // Retorna apenas campos seguros
  return NextResponse.json({
    partner: {
      id: portalToken.partner.id,
      companyName: portalToken.partner.companyName,
      city: portalToken.partner.city,
      state: portalToken.partner.state,
      category: portalToken.partner.category,
    },
    permissions: {
      canViewCampaigns: portalToken.canViewCampaigns,
      canViewMetrics: portalToken.canViewMetrics,
      canViewProposals: portalToken.canViewProposals,
    },
    campaigns,
    metrics,
    proposals,
    tokenInfo: {
      expiresAt: portalToken.expiresAt,
      lastUsedAt: portalToken.lastUsedAt,
    },
  });
}
