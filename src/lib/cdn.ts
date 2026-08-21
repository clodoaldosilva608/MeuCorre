// ===== Cloudflare CDN config (P4-4) =====
//
// P4-4: CDN customizada para cache em edge global.
//
// Vercel Edge já faz CDN, mas Cloudflare oferece:
// - Mais POPs (320+ vs Vercel ~100)
// - Cache rules mais granulares
// - Image optimization (Polish)
// - WAF (Web Application Firewall)
// - DDoS protection
// - Workers (edge compute)
//
// SETUP:
// 1. Criar conta Cloudflare (free para início)
// 2. Add domain meucorre.com.br → Cloudflare DNS
// 3. Mudar nameservers para Cloudflare
// 4. Configurar Page Rules (ver abaixo)
// 5. Setar env var CLOUDFLARE_ZONE_ID e CLOUDFLARE_API_TOKEN
//    (opcional — para invalidação de cache via API)
//
// PAGE RULES (no dashboard Cloudflare):
// - /api/* → Cache Level: Bypass (nunca cacheia API)
// - /_next/static/* → Cache Level: Cache Everything, TTL 1 ano
// - /apps/* (imagens estáticas) → Cache Level: Cache Everything, TTL 1 mês
// - /blog/[slug] → Cache Level: Cache Everything, TTL 5 min
// - / (landing) → Cache Level: Cache Everything, TTL 5 min
//
// CACHE HEADERS (este arquivo):
// Helper para setar headers de cache apropriados em rotas API.

interface CacheHeaders {
  // Cache-Control header value
  cacheControl: string;
  // Surrogate-Control header (para Cloudflare/CDN)
  surrogateControl?: string;
  // Cloudflare-specific cache tag (para invalidação granular)
  cacheTag?: string;
}

// Headers para rotas que NÃO devem ser cacheadas (default).
// Usado em: /api/auth/*, /api/sync, /api/admin/*
export const NO_CACHE: CacheHeaders = {
  cacheControl: "no-store, no-cache, must-revalidate, max-age=0",
  surrogateControl: "no-store",
};

// Headers para rotas públicas com cache curto (5 min).
// Usado em: /api/ads, /api/lifetime-status, /api/blog
export const CACHE_5MIN: CacheHeaders = {
  cacheControl: "public, s-maxage=300, stale-while-revalidate=600",
  surrogateControl: "max-age=300",
};

// Headers para rotas públicas com cache médio (10 min).
// Usado em: /api/blog/[slug]
export const CACHE_10MIN: CacheHeaders = {
  cacheControl: "public, s-maxage=600, stale-while-revalidate=1200",
  surrogateControl: "max-age=600",
};

// Headers para rotas públicas com cache longo (1 hora).
// Usado em: /api/offers (muda raramente)
export const CACHE_1HOUR: CacheHeaders = {
  cacheControl: "public, s-maxage=3600, stale-while-revalidate=7200",
  surrogateControl: "max-age=3600",
};

// Headers para assets estáticos (1 ano).
// Usado em: /apps/* (logos), /icons/*
export const CACHE_1YEAR: CacheHeaders = {
  cacheControl: "public, max-age=31536000, immutable",
};

// Aplica headers de cache a uma resposta Next.js.
// Uso:
//   import { applyCacheHeaders, CACHE_5MIN } from "@/lib/cdn";
//   const res = NextResponse.json(data);
//   applyCacheHeaders(res, CACHE_5MIN, "ads:banner_top");
//   return res;
export function applyCacheHeaders(
  res: Response,
  config: CacheHeaders,
  cacheTag?: string,
): void {
  res.headers.set("Cache-Control", config.cacheControl);
  if (config.surrogateControl) {
    res.headers.set("Surrogate-Control", config.surrogateControl);
  }
  // Cloudflare Cache-Tag: permite invalidação granular
  // Ex: purge by tag "ads" invalida todas as responses com essa tag
  const tag = cacheTag ?? config.cacheTag;
  if (tag) {
    res.headers.set("Cache-Tag", tag);
  }
}

// Invalida cache no Cloudflare por tag (todas as responses com essa tag).
// Requer CLOUDFLARE_ZONE_ID e CLOUDFLARE_API_TOKEN configurados.
// Útil quando admin edita anúncios → invalida cache de /api/ads.
export async function purgeCacheByTag(tag: string): Promise<boolean> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!zoneId || !apiToken) {
    // Cloudflare não configurado — sem cache para invalidar
    return false;
  }

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags: [tag] }),
        signal: AbortSignal.timeout(3000),
      },
    );
    return res.ok;
  } catch {
    // Falha na invalidação — cache expira naturalmente por TTL
    return false;
  }
}

// Invalida cache por URL específica.
// Útil para invalidar /api/blog/[slug] quando post é editado.
export async function purgeCacheByUrl(url: string): Promise<boolean> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!zoneId || !apiToken) return false;

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: [url] }),
        signal: AbortSignal.timeout(3000),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

// Invalida TODO o cache (cuidado — impacta performance).
// Útil após deploy de mudanças críticas.
export async function purgeAllCache(): Promise<boolean> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!zoneId || !apiToken) return false;

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ purge_everything: true }),
        signal: AbortSignal.timeout(5000),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

// Status da CDN (para /api/health)
export function getCdnStatus(): {
  provider: "cloudflare" | "vercel" | "none";
  configured: boolean;
} {
  if (process.env.CLOUDFLARE_ZONE_ID && process.env.CLOUDFLARE_API_TOKEN) {
    return { provider: "cloudflare", configured: true };
  }
  return { provider: "vercel", configured: true }; // Vercel Edge nativo
}
