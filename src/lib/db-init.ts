// Garante que o banco SQLite existe com o schema completo.
// Na Vercel serverless, o filesystem é efêmero — o DB é recriado a cada cold start
// (em /tmp). Em vez de rodar `prisma db push` em runtime (que precisa de npx/cli),
// aplicamos o schema SQL direto via Prisma's executeRaw.
//
// IMPORTANTE: este módulo só deve ser importado por código server-side.

import "server-only";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import type { PrismaClient } from "@prisma/client";

let initialized = false;
let initPromise: Promise<void> | null = null;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "Ad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cta" TEXT NOT NULL DEFAULT 'Saiba mais',
    "url" TEXT,
    "imageUrl" TEXT,
    "bgColor" TEXT NOT NULL DEFAULT '#10b981',
    "textColor" TEXT NOT NULL DEFAULT '#09090b',
    "placement" TEXT NOT NULL DEFAULT 'banner_top',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" DATETIME,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE INDEX IF NOT EXISTS "Ad_placement_active_idx" ON "Ad"("placement", "active");

CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerPhone" TEXT,
    "buyerCity" TEXT,
    "pixKey" TEXT NOT NULL DEFAULT 'meucorre@pix.com',
    "amount" REAL NOT NULL DEFAULT 97.0,
    "paymentMethod" TEXT NOT NULL DEFAULT 'pix_manual',
    "receiptUrl" TEXT,
    "receiptNotes" TEXT,
    "kiwifyOrderId" TEXT,
    "kiwifyChargeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" DATETIME,
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "licenseKey" TEXT,
    "deviceId" TEXT,
    "activatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_licenseKey_key" ON "Subscription"("licenseKey");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_kiwifyOrderId_key" ON "Subscription"("kiwifyOrderId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_buyerEmail_idx" ON "Subscription"("buyerEmail");
CREATE INDEX IF NOT EXISTS "Subscription_kiwifyOrderId_idx" ON "Subscription"("kiwifyOrderId");

CREATE TABLE IF NOT EXISTS "AdEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AdEvent_adId_eventType_idx" ON "AdEvent"("adId", "eventType");
`;

// Cria o arquivo SQLite vazio se não existir (Prisma precisa do arquivo)
function ensureDbFile() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return;
  const match = dbUrl.match(/^file:(.+)$/);
  if (!match) return;
  const dbPath = match[1];
  const absPath = resolve(process.cwd(), dbPath);

  const dir = dirname(absPath);
  if (!existsSync(dir)) {
    try {
      mkdirSync(dir, { recursive: true });
    } catch {
      // ignore
    }
  }
  // Cria arquivo vazio se não existir (SQLite cria o DB ao conectar,
  // mas garantimos pelo menos o path)
  if (!existsSync(absPath)) {
    try {
      writeFileSync(absPath, "");
    } catch {
      // ignore — pode já ter sido criado por outra invocation
    }
  }
}

// Aplica o schema SQL via Prisma executeRaw (não precisa de CLI)
async function applySchema(prisma: PrismaClient) {
  // SQLite não suporta múltiplas statements em $executeRawUnsafe,
  // então dividimos por statement
  const statements = SCHEMA_SQL.split(";").map((s) => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
    } catch (err) {
      // Ignora erros de "table already exists" — são esperados em warm starts
      const msg = err instanceof Error ? err.message : String(err);
      if (
        !msg.includes("already exists") &&
        !msg.includes("duplicate column") &&
        !msg.includes("UNIQUE constraint")
      ) {
        console.error("[db-init] SQL erro:", msg, "| stmt:", stmt.slice(0, 80));
      }
    }
  }
}

export function ensureDatabase(prisma: PrismaClient): Promise<void> {
  if (initialized) return Promise.resolve();
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (typeof window !== "undefined") return;
    try {
      ensureDbFile();
      await applySchema(prisma);
      initialized = true;
      console.log("[db-init] Schema aplicado com sucesso");
    } catch (err) {
      console.error("[db-init] Erro:", err);
      // Não marca como initialized — próxima chamada tenta de novo
      initPromise = null;
    }
  })();
  return initPromise;
}
