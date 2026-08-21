import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

// POST /api/ads/[id]/click
// Registra clique no anúncio e redireciona para a URL (se houver).
// Usado pelo app quando o entregador toca em um anúncio.
//
// SEGURANÇA (P1-1):
// Rate limit 60/IP/15min — previne spam de cliques (bot inflando métricas).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Rate limit por IP
  const limited = await applyRateLimit(req, {
    windowMs: 15 * 60 * 1000,
    maxRequests: 60,
  });
  if (limited) return limited;

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
