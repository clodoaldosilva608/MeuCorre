import { PrismaClient } from "@prisma/client";

// Cliente Prisma singleton para o backend do MeuCorre.
// Usa Transaction Pooler (porta 6543) com pgbouncer — suporta muitas conexões.

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ?? (global.__prisma = new PrismaClient({ log: ["error"] }));
