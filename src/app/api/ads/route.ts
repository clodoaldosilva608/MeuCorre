import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/ads?placement=banner_top
// Lista anúncios ativos e vigentes para exibir no app do entregador.
// Pública — não requer auth (mas o app pode ocultar anúncios se for PRO).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const placement = searchParams.get("placement");

  const now = new Date();
  const where: {
    active: boolean;
    placement?: string;
    startsAt: { lte: Date };
    OR?: { endsAt: null }[] | { endsAt: { gte: Date } }[];
  } = {
    active: true,
    startsAt: { lte: now },
    OR: [{ endsAt: null }, { endsAt: { gte: now } }],
  };
  if (placement) where.placement = placement;

  const ads = await prisma.ad.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Incrementa views em background (fire-and-forget)
  prisma.ad
    .updateMany({
      where: { id: { in: ads.map((a) => a.id) } },
      data: { views: { increment: 1 } },
    })
    .catch(() => {});

  return NextResponse.json({ ads });
}
