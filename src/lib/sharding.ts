// ===== Database sharding por userId (P4-3) =====
//
// P4-3: Sharding horizontal por userId.
//
// CONTEXTO:
// Em 100k+ usuários ativos com 5+ anos de histórico, a tabela
// SyncedDelivery pode atingir 500M+ registros. Mesmo com particionamento
// mensal (P3-1), uma query pode precisar varrer múltiplas partições.
//
// Sharding horizontal divide usuários entre múltiplos bancos (shards):
// - Shard 0 (BR): userId % 4 === 0
// - Shard 1 (BR): userId % 4 === 1
// - Shard 2 (US): userId % 4 === 2
// - Shard 3 (EU): userId % 4 === 3
//
// Vantagens:
// - Cada shard tem 1/4 dos dados — queries mais rápidas
// - Pode ser deployado em regiões diferentes (latência menor)
// - Escala horizontal ilimitada (adicionar mais shards)
//
// Desvantagens:
// - Cross-shard queries são complexas (ex: admin ver todos os users)
// - Joins entre shards não funcionam
// - Migração: mover dados existentes para shards
//
// ESTRATÉGIA IMPLEMENTADA:
// Helper `getShardForUser(userId)` retorna o cliente Prisma correto.
// Rotas que sabem o userId (sync, dashboard) usam sharded Prisma.
// Rotas admin usam primary (todos os shards consultados em paralelo).
//
// IMPORTANTE: sharding NÃO está ativo por padrão. Para ativar:
// 1. Configurar SHARD_0_URL, SHARD_1_URL, ..., SHARD_N_URL
// 2. Rodar script de migração para distribuir dados existentes
// 3. Setar SHARDING_ENABLED=true

import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SHARD_COUNT = Number(process.env.SHARD_COUNT ?? 4);
const SHARDING_ENABLED = process.env.SHARDING_ENABLED === "true";

// Cache de clientes Prisma por shard (lazy init)
const shardClients = new Map<number, PrismaClient>();

// Hash do userId → número do shard (0 a SHARD_COUNT-1)
// Usa hash simples (não criptográfico) — distribui bem.
export function getShardNumber(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0; // 32-bit overflow
  }
  return Math.abs(hash) % SHARD_COUNT;
}

// Cliente Prisma para o shard correto do usuário.
// Se sharding desativado, retorna primary (prisma).
export async function getShardForUser(userId: string): Promise<PrismaClient> {
  if (!SHARDING_ENABLED) {
    return prisma; // fallback para primary
  }

  const shardNumber = getShardNumber(userId);

  if (shardClients.has(shardNumber)) {
    return shardClients.get(shardNumber)!;
  }

  const shardUrl = process.env[`SHARD_${shardNumber}_URL`];
  if (!shardUrl) {
    console.warn(
      `[sharding] SHARD_${shardNumber}_URL não configurado, usando primary`,
    );
    return prisma; // fallback
  }

  const client = new PrismaClient({
    datasources: { db: { url: shardUrl } },
    log: ["error"],
  });
  shardClients.set(shardNumber, client);
  return client;
}

// Helper para admin queries que precisam consultar TODOS os shards.
// Executa em paralelo e combina resultados.
// ATENÇÃO: só para leitura. Para escritas, use getShardForUser.
export async function queryAllShards<T>(
  queryFn: (client: PrismaClient) => Promise<T[]>,
): Promise<T[]> {
  if (!SHARDING_ENABLED) {
    return queryFn(prisma);
  }

  const shards: PrismaClient[] = [];
  for (let i = 0; i < SHARD_COUNT; i++) {
    const url = process.env[`SHARD_${i}_URL`];
    if (url) {
      if (shardClients.has(i)) {
        shards.push(shardClients.get(i)!);
      } else {
        const client = new PrismaClient({
          datasources: { db: { url } },
          log: ["error"],
        });
        shardClients.set(i, client);
        shards.push(client);
      }
    }
  }

  // Se nenhum shard configurado, usa primary
  if (shards.length === 0) {
    return queryFn(prisma);
  }

  // Executa em paralelo
  const results = await Promise.all(shards.map((s) => queryFn(s)));

  // Combina e ordena por createdAt (desc) — assumindo que T tem createdAt
  const combined = results.flat();
  // Sort por createdAt (se existir) — admin vê mais recentes primeiro
  combined.sort((a, b) => {
    const aDate = (a as { createdAt?: Date | string })?.createdAt;
    const bDate = (b as { createdAt?: Date | string })?.createdAt;
    if (!aDate || !bDate) return 0;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  return combined;
}

// Helper para admin queries paginadas que precisam consultar todos os shards.
// Implementa paginação cross-shard com merge sort.
// Útil para /api/admin/users (precisa ver todos os shards).
export async function paginatedQueryAllShards<T>(
  queryFn: (client: PrismaClient, take: number) => Promise<T[]>,
  limit: number,
): Promise<{ items: T[]; hasMore: boolean }> {
  if (!SHARDING_ENABLED) {
    const items = await queryFn(prisma, limit + 1);
    return {
      items: items.slice(0, limit),
      hasMore: items.length > limit,
    };
  }

  // Busca limit+1 de cada shard (para ter paginação cross-shard)
  const perShard = Math.ceil(limit / SHARD_COUNT) + 1;
  const results = await queryAllShards((c) => queryFn(c, perShard));

  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;

  return { items, hasMore };
}

// Status do sharding (para /api/health)
export function getShardingStatus(): {
  enabled: boolean;
  shardCount: number;
  configuredShards: number;
} {
  let configuredShards = 0;
  for (let i = 0; i < SHARD_COUNT; i++) {
    if (process.env[`SHARD_${i}_URL`]) configuredShards++;
  }
  return {
    enabled: SHARDING_ENABLED,
    shardCount: SHARD_COUNT,
    configuredShards,
  };
}
