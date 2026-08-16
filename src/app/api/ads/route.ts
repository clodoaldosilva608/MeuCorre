import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ===== Cache in-memory para /api/ads =====
//
// Anúncios mudam raramente (admin cadastra/edita). Buscar no Postgres
// a cada request é desperdício. Cache de 5 min reduz carga no DB em ~99%.
//
// Em serverless, cada instância tem seu próprio cache. Isso é OK pra MVP
// (reduz carga mesmo com cache fragmentado). Em escala, migrar pra Redis.

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key: string, data: unknown): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// Invalida cache quando admin cria/edita/exclui anúncio
// PUBLIC ROUTE — Esta rota é intencionalmente pública (não requer admin auth)
export function invalidateAdsCache(): void {
  cache.clear();
}

// GET /api/ads?placement=banner_top
// Lista anúncios ativos e vigentes para exibir no app do entregador.
// Pública — não requer auth (mas o app pode ocultar anúncios se for PRO).
//
// GRACEFUL DEGRADATION: se o banco estiver indisponível (ex: DATABASE_URL
// não configurada em dev), retorna { ads: [] } em vez de 500. O app
// funciona normalmente, apenas sem anúncios.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const placement = searchParams.get("placement") ?? "all";
  const cacheKey = `ads:${placement}`;

  // 1. Tenta cache
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // 2. Busca no Postgres (com try/catch para graceful degradation)
  try {
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

    const response = { ads };

    // 3. Salva no cache
    setCached(cacheKey, response);

    // 4. Incrementa views em background (fire-and-forget)
    //    Não bloqueia resposta. Em escala, migrar pra Redis incr.
    if (ads.length > 0) {
      prisma.ad
        .updateMany({
          where: { id: { in: ads.map((a) => a.id) } },
          data: { views: { increment: 1 } },
        })
        .catch(() => {});
    }

    return NextResponse.json(response);
  } catch (err) {
    // DB indisponível — retorna vazio para o app continuar funcionando
    console.warn("[/api/ads] DB indisponível, retornando ads vazias:", err instanceof Error ? err.message : err);
    const fallback = { ads: [] };
    setCached(cacheKey, fallback);
    return NextResponse.json(fallback);
  }
}
