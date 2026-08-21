// ===== Cache Redis (Upstash) reutilizável =====
//
// Usado para cache de leitura em endpoints públicos/sessões:
//   - /api/ads (anúncios ativos)
//   - /api/lifetime-status (status da oferta vitalício)
//   - /api/blog (posts publicados)
//
// Em serverless (Vercel), cada instância tem seu próprio Map in-memory —
// cache in-memory é ineficaz entre instâncias. Redis distribuído garante
// que todas as instâncias compartilhem o mesmo cache.
//
// Estratégia: cache-aside com TTL. Se cache miss, busca no DB e popula cache.
// Se Redis falhar, degrada para sem cache (continua funcionando, só mais lento).

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// Cache in-memory de fallback (por instância, fraco em serverless)
const inMemoryCache = new Map<string, CacheEntry<unknown>>();
const MAX_CACHE_ENTRIES = 1000;

// Limpa entradas expiradas periodicamente
function cleanExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of inMemoryCache.entries()) {
    if (entry.expiresAt < now) {
      inMemoryCache.delete(key);
    }
  }
  // Limite de segurança contra memory leak
  if (inMemoryCache.size > MAX_CACHE_ENTRIES) {
    const entries = Array.from(inMemoryCache.entries()).sort(
      ([, a], [, b]) => a.expiresAt - b.expiresAt,
    );
    const toRemove = Math.floor(entries.length / 2);
    for (let i = 0; i < toRemove; i++) {
      inMemoryCache.delete(entries[i][0]);
    }
  }
}

// Busca valor do cache (Redis primeiro, in-memory como fallback).
// Retorna null se cache miss.
async function getFromCache<T>(key: string): Promise<T | null> {
  // 1. Tenta Redis (distribuído)
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    try {
      const res = await fetch(`${redisUrl}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
        // Cache Redis é rápido — timeout curto
        signal: AbortSignal.timeout(500),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.result) {
          const entry: CacheEntry<T> = JSON.parse(data.result);
          if (entry.expiresAt > Date.now()) {
            return entry.data;
          }
        }
      }
    } catch {
      // Redis falhou — cai para in-memory
    }
  }

  // 2. Fallback in-memory (por instância)
  const entry = inMemoryCache.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data;
  }

  return null;
}

// Salva valor no cache (Redis + in-memory).
async function setInCache<T>(key: string, data: T, ttlMs: number): Promise<void> {
  const entry: CacheEntry<T> = {
    data,
    expiresAt: Date.now() + ttlMs,
  };

  // 1. Redis
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    try {
      const ttlSeconds = Math.ceil(ttlMs / 1000);
      await fetch(`${redisUrl}/set/${encodeURIComponent(key)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          value: JSON.stringify(entry),
          ex: ttlSeconds,
        }),
        signal: AbortSignal.timeout(500),
      });
    } catch {
      // Redis falhou — só in-memory
    }
  }

  // 2. In-memory (sempre, como fallback)
  cleanExpiredEntries();
  inMemoryCache.set(key, entry);
}

// Invalida entrada de cache (Redis + in-memory).
export async function invalidateCache(key: string): Promise<void> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    try {
      await fetch(`${redisUrl}/del/${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${redisToken}` },
        signal: AbortSignal.timeout(500),
      });
    } catch {
      // ignore
    }
  }
  inMemoryCache.delete(key);
}

// ===== Helper principal: cache-aside =====
//
// Busca do cache. Se miss, chama fetcher, salva no cache, retorna.
// Se fetcher falhar, propaga erro (caller decide como tratar).
//
// Uso:
//   const data = await cachedFetch("lifetime-status", async () => {
//     return await prisma.subscription.count({ where: ... });
//   }, 5 * 60 * 1000); // cache 5 min
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000, // default 5 min
): Promise<T> {
  // 1. Tenta cache
  const cached = await getFromCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // 2. Cache miss — busca no DB
  const fresh = await fetcher();

  // 3. Salva no cache (fire-and-forget, não bloqueia response)
  void setInCache(key, fresh, ttlMs);

  return fresh;
}
