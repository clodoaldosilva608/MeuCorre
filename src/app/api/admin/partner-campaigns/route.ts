import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { z } from "zod";

// GET /api/admin/partner-campaigns — lista campanhas
// Query: partnerId, status, category, city, state, search, limit, offset
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const partnerId = searchParams.get("partnerId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const city = searchParams.get("city") ?? undefined;
  const state = searchParams.get("state") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);
  const offset = Number(searchParams.get("offset") ?? 0);

  const where: Record<string, unknown> = {};
  if (partnerId) where.partnerId = partnerId;
  if (status) where.status = status;
  if (category) where.category = category;
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (state) where.state = state.toUpperCase();
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { offerTitle: { contains: search, mode: "insensitive" } },
      { offerDescription: { contains: search, mode: "insensitive" } },
      { couponCode: { contains: search, mode: "insensitive" } },
    ];
  }

  const [campaigns, total, stats] = await Promise.all([
    prisma.partnerCampaign.findMany({
      where,
      include: {
        partner: { select: { id: true, companyName: true, city: true, state: true, category: true } },
        proposal: { select: { id: true, number: true, title: true } },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.partnerCampaign.count({ where }),
    // Estatísticas agregadas (todas as campanhas, ignorando filtros)
    prisma.partnerCampaign.aggregate({
      _sum: {
        views: true,
        clicks: true,
        leads: true,
        redemptions: true,
        reportsCount: true,
      },
      _count: true,
    }),
  ]);

  return NextResponse.json({
    campaigns,
    total,
    stats: {
      totalCampaigns: stats._count,
      totalViews: stats._sum.views ?? 0,
      totalClicks: stats._sum.clicks ?? 0,
      totalLeads: stats._sum.leads ?? 0,
      totalRedemptions: stats._sum.redemptions ?? 0,
      totalReports: stats._sum.reportsCount ?? 0,
    },
    limit,
    offset,
  });
}

// POST /api/admin/partner-campaigns — cria campanha
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const adminEmail = await getAdminEmail();
  const body = (await req.json()) as {
    partnerId?: string;
    proposalId?: string;
    name?: string;
    description?: string;
    offerTitle?: string;
    offerDescription?: string;
    offerCta?: string;
    offerUrl?: string;
    couponCode?: string;
    discountText?: string;
    imageUrl?: string;
    videoUrl?: string;
    category?: string;
    city?: string;
    state?: string;
    proOnly?: boolean;
    startsAt?: string;
    endsAt?: string;
    billingModel?: string;
    campaignPrice?: number;
    leadPrice?: number;
    notes?: string;
  };

  if (!body.partnerId?.trim() || !body.name?.trim() || !body.offerTitle?.trim() || !body.offerDescription?.trim() || !body.offerUrl?.trim()) {
    return NextResponse.json(
      { error: "partnerId, name, offerTitle, offerDescription e offerUrl são obrigatórios" },
      { status: 400 },
    );
  }

  // Valida parceiro existe
  const partner = await prisma.partner.findUnique({ where: { id: body.partnerId } });
  if (!partner) {
    return NextResponse.json({ error: "Parceiro não encontrado" }, { status: 404 });
  }

  // Valida proposal se informada
  if (body.proposalId) {
    const proposal = await prisma.proposal.findFirst({
      where: { id: body.proposalId, partnerId: body.partnerId },
    });
    if (!proposal) {
      return NextResponse.json(
        { error: "Proposta não pertence a este parceiro" },
        { status: 400 },
      );
    }
  }

  // Valida billingModel
  const validBilling = new Set(["campaign", "lead", "both"]);
  const billingModel = validBilling.has(body.billingModel ?? "")
    ? body.billingModel!
    : "campaign";

  // Gera utmCampaign slug
  const utmCampaign = body.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

  try {
    const campaign = await prisma.partnerCampaign.create({
      data: {
        partnerId: body.partnerId,
        proposalId: body.proposalId || null,
        name: sanitizeString(body.name, 150),
        description: sanitizeString(body.description, 500) || null,
        offerTitle: sanitizeString(body.offerTitle, 100),
        offerDescription: sanitizeString(body.offerDescription, 500),
        offerCta: sanitizeString(body.offerCta ?? "Aproveitar", 30),
        offerUrl: sanitizeString(body.offerUrl, 500) || "",
        couponCode: sanitizeString(body.couponCode, 50) || null,
        discountText: sanitizeString(body.discountText, 50) || null,
        imageUrl: sanitizeString(body.imageUrl, 500) || null,
        videoUrl: sanitizeString(body.videoUrl, 500) || null,
        category: sanitizeString(body.category ?? "servicos", 50),
        city: sanitizeString(body.city ?? "", 100) || null,
        state: sanitizeString(body.state ?? "", 2)?.toUpperCase() || null,
        proOnly: body.proOnly ?? false,
        startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        billingModel,
        campaignPrice: typeof body.campaignPrice === "number" ? body.campaignPrice : null,
        leadPrice: typeof body.leadPrice === "number" ? body.leadPrice : null,
        status: "draft",
        utmSource: "parceiro",
        utmMedium: "app",
        utmCampaign,
        notes: sanitizeString(body.notes, 2000) || null,
        createdBy: adminEmail ?? "admin",
        createdByEmail: adminEmail,
      },
      include: {
        partner: { select: { id: true, companyName: true } },
      },
    });

    await prisma.partnerLog.create({
      data: {
        partnerId: body.partnerId,
        action: "campaign_created",
        details: JSON.stringify({
          campaignId: campaign.id,
          name: campaign.name,
          billingModel: campaign.billingModel,
        }),
        adminEmail,
        ipAddress: req.headers.get("x-forwarded-for") ?? null,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Erro ao criar campanha", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
