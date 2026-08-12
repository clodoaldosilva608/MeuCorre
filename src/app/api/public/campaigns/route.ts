import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/campaigns — lista campanhas publicadas (para o app do entregador)
// Query: category, city, state, proOnly (boolean), limit, offset
//
// NÃO requer admin auth — é o endpoint público que o app consome.
// Retorna apenas campanhas published e dentro da vigência.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const city = searchParams.get("city") ?? undefined;
  const state = searchParams.get("state") ?? undefined;
  const proOnly = searchParams.get("proOnly");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
  const offset = Number(searchParams.get("offset") ?? 0);

  const now = new Date();

  const where: Record<string, unknown> = {
    status: "published",
    startsAt: { lte: now },
    OR: [
      { endsAt: null },
      { endsAt: { gte: now } },
    ],
  };
  if (category) where.category = category;
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (state) where.state = state.toUpperCase();
  if (proOnly === "true") where.proOnly = true;
  if (proOnly === "false") where.proOnly = false;

  const campaigns = await prisma.partnerCampaign.findMany({
    where,
    select: {
      id: true,
      offerTitle: true,
      offerDescription: true,
      offerCta: true,
      offerUrl: true,
      couponCode: true,
      discountText: true,
      imageUrl: true,
      videoUrl: true,
      category: true,
      city: true,
      state: true,
      proOnly: true,
      startsAt: true,
      endsAt: true,
      partner: { select: { companyName: true } },
    },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    skip: offset,
  });

  // Marca campanhas expiradas (background job)
  // Nota: em produção, usar cron job para marcar expiradas em massa
  const expired = await prisma.partnerCampaign.findMany({
    where: {
      status: "published",
      endsAt: { lt: now },
    },
    select: { id: true },
  });
  if (expired.length > 0) {
    await prisma.partnerCampaign.updateMany({
      where: { id: { in: expired.map((e) => e.id) } },
      data: { status: "expired" },
    });
  }

  return NextResponse.json({ campaigns, total: campaigns.length, limit, offset });
}
