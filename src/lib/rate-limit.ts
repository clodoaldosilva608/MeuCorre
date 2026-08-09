import { NextRequest, NextResponse } from "next/server";

// ===== Rate limiting para serverless =====
//
// Estratégia híbrida:
// 1. Se UPSTASH_REDIS_REST_URL estiver configurado, usa Redis (distribuído)
// 2. Caso contrário, usa in-memory (funciona por instância, não é perfeito)
//
// Em produção com 100k usuários, DEVE configurar Upstash Redis.
// Sem Redis, o rate limit é "aproximado" (cada instância conta separadamente).
//
// ===== Bypass para testes E2E =====
//
// Para permitir que testes E2E (Playwright) criem múltiplos usuários sem
// serem bloqueados pelo rate limit de cadastro (3/IP/hora), bypassamos o
// rate limit quando:
//   1. A request tem header `X-E2E-Test-Mode: <token>`
//   2. O token bate com a env var `E2E_TEST_BYPASS_TOKEN`
//
// Segurança: o token NUNCA é exposto ao client (não é NEXT_PUBLIC_*).
// Apenas CI/scripts com acesso ao token podem bypassar. Em produção normal,
// usuários não têm como descobrir o token.

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
// LIMITES DE SEGURANÇA: Em serverless, o Map é recriado a cada cold start,
// mas dentro de uma invocação longa pode crescer indefinidamente. Limitamos
// a MAX_BUCKETS entradas com LRU simples para evitar memory leak.
interface RateLimitEntry {
  count: number;
  firstAt: number;
}
const MAX_BUCKETS = 10000; // limite de segurança contra memory leak
const buckets = new Map<string, RateLimitEntry>();

// Limpa entradas mais antigas quando o Map excede o limite (LRU simples)
function enforceBucketLimit() {
  if (buckets.size <= MAX_BUCKETS) return;
  // Remove as 50% entradas mais antigas (ordenadas por firstAt)
  const entries = Array.from(buckets.entries()).sort(
    ([, a], [, b]) => a.firstAt - b.firstAt,
  );
  const toRemove = Math.floor(entries.length / 2);
  for (let i = 0; i < toRemove; i++) {
    buckets.delete(entries[i][0]);
  }
}

function inMemoryRateLimit(
  identifier: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const entry = buckets.get(identifier);

  if (!entry || now - entry.firstAt > options.windowMs) {
    enforceBucketLimit(); // previne memory leak
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

// Helper: verifica se a request tem o header de bypass de teste E2E.
// Retorna true apenas se o header `X-E2E-Test-Mode` bater com a env var
// `E2E_TEST_BYPASS_TOKEN`. Usado por testes Playwright/CI para criar
// múltiplos usuários sem rate limiting.
export function isE2ETestBypass(req: NextRequest): boolean {
  const expectedToken = process.env.E2E_TEST_BYPASS_TOKEN;
  if (!expectedToken) return false; // sem token configurado, sem bypass
  const receivedToken = req.headers.get("x-e2e-test-mode");
  if (!receivedToken) return false;
  // Comparação constante-tempo para evitar timing attacks
  if (receivedToken.length !== expectedToken.length) return false;
  let diff = 0;
  for (let i = 0; i < receivedToken.length; i++) {
    diff |= receivedToken.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }
  return diff === 0;
}

// Helper: aplica rate limit e retorna 429 se excedido.
// Faz bypass automático se a request tiver o header X-E2E-Test-Mode válido.
//
// PARÂMETRO userId (opcional): Se o usuário estiver logado, o rate limit é
// aplicado por userId (não por IP). Isso resolve o problema de CGNAT no Brasil
// onde centenas de usuários legítimos compartilham o mesmo IP público (4G).
// Em endpoints de auth (login/register), NÃO passar userId (usuário ainda
// não está logado) — rate limit por IP é mais apropriado para prevenir brute force.
export async function applyRateLimit(
  req: NextRequest,
  options: RateLimitOptions,
  userId?: string,
): Promise<NextResponse | null> {
  // Bypass para testes E2E — não conta no rate limit
  if (isE2ETestBypass(req)) {
    return null;
  }

  // Se userId fornecido, usa userId como identificador (prioridade sobre IP).
  // Caso contrário, usa IP (para endpoints de auth onde usuário não está logado).
  const ip = getClientIp(req);
  const identifier = userId ?? ip;
  const result = await redisRateLimit(identifier, options);

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
