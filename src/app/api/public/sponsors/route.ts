import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/sponsors
// Retorna patrocinadores ativos para exibição pública (landing page + dashboard)
// Não requer auth — apenas dados públicos (sem notas internas)

export async function GET() {
  try {
    // Buscar sponsors ativos para o carrossel
    const carouselSponsors = await prisma.sponsor.findMany({
      where: { active: true, showInCarousel: true },
      orderBy: [{ sortOrder: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        website: true,
        logoUrl: true,
        instagram: true,
        facebook: true,
        whatsapp: true,
        sortOrder: true,
      },
    });

    // Buscar sponsors ativos para banner (pop-up na dashboard)
    const bannerSponsors = await prisma.sponsor.findMany({
      where: { active: true, showBanner: true },
      orderBy: [{ sortOrder: "asc" }],
      select: {
        id: true,
        name: true,
        bannerUrl: true,
        bannerLink: true,
        website: true,
      },
    });

    return NextResponse.json({
      carousel: carouselSponsors,
      banners: bannerSponsors,
    });
  } catch (err) {
    console.error("[public/sponsors] Erro:", err);
    return NextResponse.json({ carousel: [], banners: [] });
  }
}
