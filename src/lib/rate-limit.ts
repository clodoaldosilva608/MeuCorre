import { NextRequest, NextResponse } from "next/server";

// ===== Rate limiting para serverless =====
//
// Estratégia híbrida:
// 1. Se UPSTASH_REDIS_REST_URL estiver configurado, usa Redis (distribuído)
// 2. Caso contrário, usa in-memory (funciona por instância, não é perfeito)
//
// Em produção com 100k usuários, DEVE configurar Upstash Redis.
// Sem Redis, o rate limit é "aproximado" (cada instância conta separadamente).

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// ===== In-memory fallback =====
interface RateLimitEntry {
  count: number;
  firstAt: number;
}
const buckets = new Map<string, RateLimitEntry>();

function inMemoryRateLimit(
  identifier: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const entry = buckets.get(identifier);

  if (!entry || now - entry.firstAt > options.windowMs) {
    buckets.set(identifier, { count: 1, firstAt: now });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetAt: now + options.windowMs,
    };
  }

  entry.count++;
  if (entry.count > options.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.firstAt + options.windowMs };
  }

  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetAt: entry.firstAt + options.windowMs,
  };
}

// ===== Redis (Upstash) =====
async function redisRateLimit(
  identifier: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    // Fallback pra in-memory se Redis não configurado
    return inMemoryRateLimit(identifier, options);
  }

  const key = `ratelimit:${identifier}`;
  const windowSeconds = Math.ceil(options.windowMs / 1000);

  try {
    // Pipeline: INCR + EXPIRE
    const res = await fetch(`${redisUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, windowSeconds],
      ]),
    });

    if (!res.ok) {
      // Se Redis falhar, usa in-memory
      return inMemoryRateLimit(identifier, options);
    }

    const data = await res.json();
    const count = data[0]?.result ?? 0;
    const allowed = count <= options.maxRequests;
    const remaining = Math.max(0, options.maxRequests - count);

    return {
      allowed,
      remaining,
      resetAt: Date.now() + options.windowMs,
    };
  } catch {
    // Se Redis falhar, usa in-memory
    return inMemoryRateLimit(identifier, options);
  }
}

// Helper: extrai IP do client
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// Helper: aplica rate limit e retorna 429 se excedido
export async function applyRateLimit(
  req: NextRequest,
  options: RateLimitOptions,
): Promise<NextResponse | null> {
  const ip = getClientIp(req);
  const result = await redisRateLimit(ip, options);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: "Muitas requisições. Tente novamente em alguns instantes.",
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(options.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetAt),
        },
      },
    );
  }

  return null;
}

// Limpa entradas expiradas periodicamente (evita memory leak)
if (typeof window === "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of buckets.entries()) {
      if (now - entry.firstAt > 60 * 60 * 1000) {
        buckets.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
