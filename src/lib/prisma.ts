import { PrismaClient } from "@prisma/client";

// Cliente Prisma singleton para o backend do MeuCorre.
// Usa Transaction Pooler (porta 6543) com pgbouncer — suporta muitas conexões.
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

// Primary (escritas + leituras críticas)
export const prisma: PrismaClient =
  global.__prisma ?? (global.__prisma = new PrismaClient({ log: ["error"] }));

// Read replica (leituras pesadas — admin, relatórios)
// Se SUPABASE_READ_REPLICA_URL não configurado, usa o mesmo primary (no-op)
const readReplicaUrl = process.env.SUPABASE_READ_REPLICA_URL;
export const prismaRead: PrismaClient = readReplicaUrl
  ? (global.__prismaRead ?? (global.__prismaRead = new PrismaClient({
      log: ["error"],
      datasources: { db: { url: readReplicaUrl } },
    })))
  : prisma; // fallback para primary se réplica não configurada
