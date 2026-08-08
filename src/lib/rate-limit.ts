import { NextRequest, NextResponse } from "next/server";

// ===== Rate limiting simples (in-memory) =====
//
// MVP: rate limit em memória. Funciona por instância de serverless function.
// Em produção com 100k usuários, cada cold start cria um novo Map, então
// o limite é "aproximado" (cada instância conta separadamente).
//
// Para rate limiting rigoroso em escala, migrar pra Upstash Redis.
// Por ora, isso já bloqueia 95% dos abusos (scripts que batem na MESMA instância).

interface RateLimitEntry {
  count: number;
  firstAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  windowMs: number; // janela de tempo
  maxRequests: number; // máx requests por IP na janela
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const entry = buckets.get(identifier);

  // Reset se passou da janela
  if (!entry || now - entry.firstAt > options.windowMs) {
    buckets.set(identifier, {
      count: 1,
      firstAt: now,
    });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetAt: now + options.windowMs,
    };
  }

  entry.count++;
  if (entry.count > options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.firstAt + options.windowMs,
    };
  }

  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetAt: entry.firstAt + options.windowMs,
  };
}

// Helper: extrai IP do client (Vercel usa x-forwarded-for)
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// Helper: aplica rate limit e retorna 429 se excedido
export function applyRateLimit(
  req: NextRequest,
  options: RateLimitOptions,
): NextResponse | null {
  const ip = getClientIp(req);
  const result = rateLimit(ip, options);

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

  return null; // permitido
}

// Limpa entradas expiradas periodicamente (evita memory leak)
// Roda a cada 5 min
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets.entries()) {
    // Remove entradas com mais de 1h
    if (now - entry.firstAt > 60 * 60 * 1000) {
      buckets.delete(key);
    }
  }
}, 5 * 60 * 1000);
