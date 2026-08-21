import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { cachedFetch, invalidateCache } from "@/lib/redis-cache";

// ===== Cache Redis para /api/ads =====
//
// Anúncios mudam raramente (admin cadastra/edita). Buscar no Postgres
// a cada request é desperdício. Cache distribuído de 5 min reduz
// carga no DB em ~99% — todas as instâncias serverless compartilham.
//
// SEGURANÇA/PERFORMANCE (P1-1, P1-3):
// - Rate limit 60/IP/15min (cada render do app chama esta rota)
// - Cache Redis distribuído (5 min TTL)
// - Mantém in-memory como fallback se Redis indisponível

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

// Invalida cache quando admin cria/edita/exclui anúncio
export function invalidateAdsCache(): void {
  // Invalida todas as variantes (banner_top, card_list, splash, all)
  void invalidateCache("ads:all");
  void invalidateCache("ads:banner_top");
  void invalidateCache("ads:card_list");
  void invalidateCache("ads:splash");
}

// GET /api/ads?placement=banner_top
// Lista anúncios ativos e vigentes para exibir no app do entregador.
// Pública — não requer auth (mas o app pode ocultar anúncios se for PRO).
//
// GRACEFUL DEGRADATION: se o banco estiver indisponível (ex: DATABASE_URL
// não configurada em dev), retorna { ads: [] } em vez de 500. O app
// funciona normalmente, apenas sem anúncios.
export async function GET(req: NextRequest) {
  // Rate limit por IP
  const limited = await applyRateLimit(req, {
    windowMs: 15 * 60 * 1000,
    maxRequests: 60,
  });
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const placement = searchParams.get("placement") ?? "all";
  const cacheKey = `ads:${placement}`;

  try {
    const response = await cachedFetch(cacheKey, async () => {
      const now = new Date();
      const where = {
        active: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        ...(placement !== "all" && { placement }),
      };

      const ads = await prisma.ad.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      return { ads };
    }, CACHE_TTL_MS);

    // Incrementa views em background (fire-and-forget)
    // Não bloqueia resposta. Em escala, migrar pra Redis incr (batch).
    if (response.ads && response.ads.length > 0) {
      prisma.ad
        .updateMany({
          where: { id: { in: response.ads.map((a) => a.id) } },
          data: { views: { increment: 1 } },
        })
        .catch(() => {});
    }

    return NextResponse.json(response);
  } catch (err) {
    // DB indisponível — retorna vazio para o app continuar funcionando
    console.warn("[/api/ads] DB indisponível, retornando ads vazias:", err instanceof Error ? err.message : err);
    return NextResponse.json({ ads: [] });
  }
}
