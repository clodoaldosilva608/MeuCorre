import { PrismaClient } from "@prisma/client";
import { ensureDatabase } from "./db-init";

// Cliente Prisma singleton para o backend do MeuCorre (admin, anúncios, planos).
// O app do entregador continua 100% Local-First (Dexie.js / IndexedDB).

declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const client = new PrismaClient();

  if (typeof window === "undefined") {
    // No servidor, garante que o banco SQLite existe e tem o schema.
    // $extends com query interceptor chama ensureDatabase antes de cada query
    // (idempotente — só aplica o schema 1x por cold start).
    return client.$extends({
      query: {
        async $allOperations({ args, query }) {
          await ensureDatabase(client);
          return query(args);
        },
      },
    }) as unknown as PrismaClient;
  }

  return client;
}

export const prisma: PrismaClient =
  global.__prisma ?? (global.__prisma = createPrismaClient());
