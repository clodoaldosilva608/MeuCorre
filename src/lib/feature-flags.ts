// ===== Feature flags platform (P4-5) =====
//
// P4-5: Sistema de feature flags para deployments incrementais,
// A/B testing e rollbacks seguros.
//
// Estratégia:
// 1. Se VERCEL_EDGE_CONFIG_* configurado → usa Edge Config (rápido, edge)
// 2. Senão, se LAUNCHDARKLY_SDK_KEY configurado → usa LaunchDarkly
// 3. Senão → fallback para flags locais (env vars + DB Settings table)
//
// Uso:
//   import { isFeatureEnabled, getFeatureFlag } from "@/lib/feature-flags";
//
//   if (await isFeatureEnabled("new-dashboard-v2")) {
//     // mostrar nova UI
//   } else {
//     // mostrar UI atual
//   }
//
//   const limit = await getFeatureFlag<number>("sync.batch-size", 500);
//
// Flags suportadas (atualmente):
// - "new-dashboard-v2" — redesign completo (default: false)
// - "sync.batch-size" — tamanho do batch no sync (default: 150)
// - "ads.cache-ttl" — TTL do cache de ads em ms (default: 300000)
// - "rate-limit.admin-login" — max tentativas admin (default: 5)
// - "trial.days" — duração do trial grátis (default: 14)
// - "lifetime.max-sales" — limite vitalícios (default: 500)
// - "lifetime.cutoff-days" — dias até cutoff (default: 90)

// Cache in-memory (por instância) para reduzir latência
interface FlagCache {
  value: unknown;
  expiresAt: number;
}
const flagCache = new Map<string, FlagCache>();
const CACHE_TTL_MS = 60 * 1000; // 1 min — flags mudam raramente

// ===== Edge Config (Vercel) =====
// Edge Config é um KV store em edge (latência <5ms, cache global)
// Configurar:
// 1. Vercel Dashboard → Storage → Edge Config → Create
// 2. Pegar EDGE_CONFIG ID e token
// 3. Setar env vars:
//    EDGE_CONFIG=<id>
//    EDGE_CONFIG_ACCESS_TOKEN=<token>

async function getFromEdgeConfig<T>(key: string): Promise<T | null> {
  const edgeConfigId = process.env.EDGE_CONFIG;
  const token = process.env.EDGE_CONFIG_ACCESS_TOKEN;

  if (!edgeConfigId || !token) return null;

  try {
    const res = await fetch(
      `https://edge-config.vercel.com/${edgeConfigId}/item/${encodeURIComponent(key)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(500),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.value as T) ?? null;
  } catch {
    return null;
  }
}

async function setInEdgeConfig(key: string, value: unknown): Promise<boolean> {
  const edgeConfigId = process.env.EDGE_CONFIG;
  const token = process.env.EDGE_CONFIG_ACCESS_TOKEN;

  if (!edgeConfigId || !token) return false;

  try {
    const res = await fetch(
      `https://edge-config.vercel.com/${edgeConfigId}/items`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ operation: "upsert", key, value }]),
        signal: AbortSignal.timeout(1000),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

// ===== LaunchDarkly (opcional) =====
// Para usar LaunchDarkly em vez de Edge Config:
// 1. npm install @launchdarkly/node-server-sdk
// 2. Setar LAUNCHDARKLY_SDK_KEY
// 3. Implementar initLDClient() e usar client.variation(flagKey, user, default)

// ===== DB Settings table (fallback) =====
// Para flags que mudam com frequência (ex: desabilitar feature em produção)
// admin pode mudar via /admin/settings.
import { prisma } from "@/lib/prisma";

async function getFromDb<T>(key: string): Promise<T | null> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: `flag:${key}` },
      select: { value: true },
    });
    if (!setting) return null;
    try {
      return JSON.parse(setting.value) as T;
    } catch {
      return setting.value as unknown as T;
    }
  } catch {
    return null;
  }
}

// ===== Defaults (env vars) =====
// Se flag não estiver em Edge Config nem DB, usa default.
const DEFAULT_FLAGS: Record<string, unknown> = {
  "new-dashboard-v2": process.env.FEATURE_NEW_DASHBOARD === "true",
  "sync.batch-size": Number(process.env.FEATURE_SYNC_BATCH_SIZE ?? 150),
  "ads.cache-ttl": Number(process.env.FEATURE_ADS_CACHE_TTL ?? 300000),
  "rate-limit.admin-login": Number(process.env.FEATURE_RATELIMIT_ADMIN ?? 5),
  "trial.days": Number(process.env.TRIAL_DAYS ?? 14),
  "lifetime.max-sales": Number(process.env.LIFETIME_MAX_SALES ?? 500),
  "lifetime.cutoff-days": Number(process.env.LIFETIME_CUTOFF_DAYS ?? 90),
};

// ===== API pública =====

// Verifica se feature flag boolean está habilitada.
// Ordem de resolução: Edge Config → DB → env var default → false
export async function isFeatureEnabled(flagKey: string): Promise<boolean> {
  const cached = flagCache.get(flagKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value === true;
  }

  // 1. Edge Config
  const edgeValue = await getFromEdgeConfig<boolean>(flagKey);
  if (edgeValue !== null) {
    flagCache.set(flagKey, { value: edgeValue, expiresAt: Date.now() + CACHE_TTL_MS });
    return edgeValue;
  }

  // 2. DB Settings (admin pode mudar em runtime)
  const dbValue = await getFromDb<boolean>(flagKey);
  if (dbValue !== null) {
    flagCache.set(flagKey, { value: dbValue, expiresAt: Date.now() + CACHE_TTL_MS });
    return dbValue;
  }

  // 3. Default (env var ou hardcoded)
  const defaultValue = DEFAULT_FLAGS[flagKey] ?? false;
  flagCache.set(flagKey, {
    value: defaultValue,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return defaultValue === true;
}

// Pega feature flag com valor tipado (string, number, boolean).
// Útil para flags não-boolean (ex: batch-size, TTL).
export async function getFeatureFlag<T>(
  flagKey: string,
  fallback: T,
): Promise<T> {
  const cached = flagCache.get(flagKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  // 1. Edge Config
  const edgeValue = await getFromEdgeConfig<T>(flagKey);
  if (edgeValue !== null) {
    flagCache.set(flagKey, { value: edgeValue, expiresAt: Date.now() + CACHE_TTL_MS });
    return edgeValue;
  }

  // 2. DB Settings
  const dbValue = await getFromDb<T>(flagKey);
  if (dbValue !== null) {
    flagCache.set(flagKey, { value: dbValue, expiresAt: Date.now() + CACHE_TTL_MS });
    return dbValue;
  }

  // 3. Default
  const defaultValue = (DEFAULT_FLAGS[flagKey] as T) ?? fallback;
  flagCache.set(flagKey, {
    value: defaultValue,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return defaultValue;
}

// Seta feature flag (admin only — chamar de /api/admin/feature-flags).
// Atualiza Edge Config + DB + invalida cache.
export async function setFeatureFlag(
  flagKey: string,
  value: unknown,
): Promise<boolean> {
  // Invalida cache
  flagCache.delete(flagKey);

  // 1. Edge Config
  await setInEdgeConfig(flagKey, value);

  // 2. DB Settings (upsert)
  try {
    await prisma.setting.upsert({
      where: { key: `flag:${flagKey}` },
      create: {
        key: `flag:${flagKey}`,
        value: typeof value === "string" ? value : JSON.stringify(value),
      },
      update: {
        value: typeof value === "string" ? value : JSON.stringify(value),
      },
    });
  } catch {
    // DB pode falhar — Edge Config é suficiente
  }

  return true;
}

// Invalida cache de uma flag (para testes ou mudanças manuais no DB)
export function invalidateFlag(flagKey: string): void {
  flagCache.delete(flagKey);
}

// Lista todas as flags conhecidas e seus valores atuais.
// Útil para /api/admin/feature-flags GET.
export async function listFeatureFlags(): Promise<
  Array<{ key: string; value: unknown; source: "edge" | "db" | "default" }>
> {
  const flags = await Promise.all(
    Object.keys(DEFAULT_FLAGS).map(async (key) => {
      // Try Edge Config first
      const edgeValue = await getFromEdgeConfig(key);
      if (edgeValue !== null) {
        return { key, value: edgeValue, source: "edge" as const };
      }

      // Then DB
      const dbValue = await getFromDb(key);
      if (dbValue !== null) {
        return { key, value: dbValue, source: "db" as const };
      }

      // Fallback default
      return { key, value: DEFAULT_FLAGS[key], source: "default" as const };
    }),
  );
  return flags;
}
