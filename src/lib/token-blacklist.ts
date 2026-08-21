// ===== Token blacklist (Redis) =====
//
// P2-4: Refresh token rotation com blacklist
//
// Permite invalidar tokens JWT antes da expiração natural (30 dias).
// Sem isso, se um token JWT vazar, atacante tem 30 dias de acesso.
// Com blacklist, admin/user pode revogar imediatamente.
//
// Estratégia:
// - Cada token tem jti (JWT ID) único
// - Blacklist armazena jtis revogados (com TTL = tempo até expiração natural)
// - getUserSession() verifica se jti está na blacklist
// - Logout adiciona jti à blacklist
//
// Storage:
// - Redis distribuído (produção) — todas as instâncias veem a mesma blacklist
// - Set in-memory (dev) — fallback se Redis não configurado
//
// Limitações:
// - Set in-memory em serverless é por instância (fraco)
// - Em produção SEM Redis, blacklist é ineficaz entre instâncias

const inMemoryBlacklist = new Set<string>();
const MAX_IN_MEMORY = 10000; // limite de segurança

// Adiciona jti à blacklist.
// TTL = tempo até o token expirar naturalmente (depois disso, blacklist
// não precisa mais manter — o token já é inválido por expiração).
export async function blacklistToken(jti: string, expiresAt: number): Promise<void> {
  const ttlSeconds = Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000));

  // Redis (produção)
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    try {
      await fetch(`${redisUrl}/set/${encodeURIComponent(`blacklist:${jti}`)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          value: "1",
          ex: ttlSeconds,
        }),
        signal: AbortSignal.timeout(500),
      });
      return;
    } catch {
      // Fallback in-memory
    }
  }

  // In-memory fallback (dev)
  inMemoryBlacklist.add(jti);
  // Limite de segurança
  if (inMemoryBlacklist.size > MAX_IN_MEMORY) {
    const first = inMemoryBlacklist.values().next().value;
    if (first) inMemoryBlacklist.delete(first);
  }
  // Auto-remove após TTL (best-effort)
  setTimeout(() => inMemoryBlacklist.delete(jti), ttlSeconds * 1000).unref?.();
}

// Verifica se jti está na blacklist.
export async function isBlacklisted(jti: string): Promise<boolean> {
  // Redis (produção)
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    try {
      const res = await fetch(
        `${redisUrl}/get/${encodeURIComponent(`blacklist:${jti}`)}`,
        {
          headers: { Authorization: `Bearer ${redisToken}` },
          signal: AbortSignal.timeout(500),
        },
      );
      if (res.ok) {
        const data = await res.json();
        return data?.result === "1";
      }
      return false;
    } catch {
      // Fallback in-memory
    }
  }

  // In-memory fallback
  return inMemoryBlacklist.has(jti);
}

// Gera jti único (JWT ID).
// Formato: <timestamp>_<random_12_chars>
export function generateJti(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
}
