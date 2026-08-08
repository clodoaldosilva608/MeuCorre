import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/ads/[id]/click
// Registra clique no anúncio e redireciona para a URL (se houver).
// Usado pelo app quando o entregador toca em um anúncio.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const ad = await prisma.ad.findUnique({ where: { id } });
  if (!ad) {
    return NextResponse.json({ error: "Anúncio não encontrado" }, { status: 404 });
  }

  // Incrementa cliques
  await prisma.ad.update({
    where: { id },
    data: { clicks: { increment: 1 } },
  });

  return NextResponse.json({
    ok: true,
    url: ad.url,
    cta: ad.cta,
  });
}
