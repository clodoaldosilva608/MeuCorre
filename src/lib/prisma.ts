import { PrismaClient } from "@prisma/client";

// Cliente Prisma singleton para o backend do MeuCorre (admin, anúncios, planos).
// O app do entregador continua 100% Local-First (Dexie.js / IndexedDB).
//
// Agora usando Supabase (Postgres) — schema é persistente, não precisa
// de ensureDatabase em runtime como era com SQLite em /tmp.

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ?? (global.__prisma = new PrismaClient());
