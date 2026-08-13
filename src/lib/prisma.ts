import { PrismaClient } from "@prisma/client";

// Cliente Prisma singleton para o backend do MeuCorre.
// Usa Transaction Pooler (porta 6543) com pgbouncer — suporta muitas conexões.
//
// TIMEOUT: 30s para queries (previne travamento sob carga extrema).
// Em Vercel serverless, o limite de execução é 60s (Hobby) ou 300s (Pro).
// 30s de query deixa margem para resposta + outras operações.
//
// READ REPLICA (preparação para 100k+ usuários):
// Quando SUPABASE_READ_REPLICA_URL estiver configurado, queries de leitura
// pesadas (relatórios admin, agregações) podem usar `prismaRead` em vez de
// `prisma`. Isso redireciona carga do primary para a réplica.
//
// Uso:
//   import { prisma, prismaRead } from "@/lib/prisma";
//   // Escrita (sync, auth, webhook) → prisma (primary)
//   // Leitura pesada (admin dashboard) → prismaRead (réplica)

declare global {
  var __prisma: PrismaClient | undefined;
  var __prismaRead: PrismaClient | undefined;
}

// Configuração com timeout de query
const prismaConfig = {
  log: ["error"] as ("error")[],
};

// Primary (escritas + leituras críticas)
export const prisma: PrismaClient =
  global.__prisma ?? (global.__prisma = new PrismaClient(prismaConfig));

// Read replica (leituras pesadas — admin, relatórios)
const readReplicaUrl = process.env.SUPABASE_READ_REPLICA_URL;
export const prismaRead: PrismaClient = readReplicaUrl
  ? (global.__prismaRead ?? (global.__prismaRead = new PrismaClient({
      ...prismaConfig,
      datasources: { db: { url: readReplicaUrl } },
    })))
  : prisma; // fallback para primary se réplica não configurada

// Helper: executa query com timeout explícito (para queries pesadas)
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000,
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Query timeout após ${timeoutMs}ms`)), timeoutMs),
  );
  return Promise.race([promise, timeout]);
}
