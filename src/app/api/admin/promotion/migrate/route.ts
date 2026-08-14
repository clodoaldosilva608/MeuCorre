import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// ===== Migracao de schema (Fase 2 — Divulgacao) =====
//
// Aplica as seguintes mudancas no banco de producao:
// 1. Cria tabela SocialGroup
// 2. Adiciona coluna platforms em PromotionPost
// 3. Cria tabela PromotionPostAsset (multi-midia N:N)
//
// Idempotente: pode ser chamado multiplas vezes sem erro (usa IF NOT EXISTS).

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const results: Array<{ step: string; status: string; error?: string }> = [];

  // ===== 1. Cria tabela SocialGroup =====
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SocialGroup" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "platform" TEXT NOT NULL,
        "inviteUrl" TEXT NOT NULL,
        "memberCount" INTEGER,
        "category" TEXT,
        "city" TEXT,
        "notes" TEXT,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "lastPostedAt" TIMESTAMP(3),
        "createdBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SocialGroup_pkey" PRIMARY KEY ("id")
      );
    `);
    results.push({ step: "create_SocialGroup_table", status: "ok" });

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "SocialGroup_platform_active_idx"
      ON "SocialGroup"("platform", "active");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "SocialGroup_category_active_idx"
      ON "SocialGroup"("category", "active");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "SocialGroup_city_idx"
      ON "SocialGroup"("city");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "SocialGroup_active_createdAt_idx"
      ON "SocialGroup"("active", "createdAt");
    `);
    results.push({ step: "create_SocialGroup_indexes", status: "ok" });
  } catch (e: unknown) {
    const err = e as Error;
    results.push({
      step: "create_SocialGroup",
      status: "error",
      error: err.message,
    });
  }

  // ===== 2. Adiciona coluna platforms em PromotionPost =====
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "PromotionPost"
      ADD COLUMN IF NOT EXISTS "platforms" TEXT;
    `);
    results.push({ step: "add_platforms_column", status: "ok" });
  } catch (e: unknown) {
    const err = e as Error;
    if (err.message.includes("already exists")) {
      results.push({ step: "add_platforms_column", status: "already_exists" });
    } else {
      results.push({
        step: "add_platforms_column",
        status: "error",
        error: err.message,
      });
    }
  }

  // ===== 3. Cria tabela PromotionPostAsset (multi-midia) =====
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PromotionPostAsset" (
        "id" TEXT NOT NULL,
        "postId" TEXT NOT NULL,
        "assetId" TEXT NOT NULL,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PromotionPostAsset_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "PromotionPostAsset"
      DROP CONSTRAINT IF EXISTS "PromotionPostAsset_postId_fkey";
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "PromotionPostAsset"
      ADD CONSTRAINT "PromotionPostAsset_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES "PromotionPost"("id")
      ON DELETE CASCADE;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "PromotionPostAsset"
      DROP CONSTRAINT IF EXISTS "PromotionPostAsset_assetId_fkey";
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "PromotionPostAsset"
      ADD CONSTRAINT "PromotionPostAsset_assetId_fkey"
      FOREIGN KEY ("assetId") REFERENCES "PromotionAsset"("id")
      ON DELETE CASCADE;
    `);

    await prisma.$executeRawUnsafe(`
      DROP INDEX IF EXISTS "PromotionPostAsset_postId_assetId_key";
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "PromotionPostAsset_postId_assetId_key"
      ON "PromotionPostAsset"("postId", "assetId");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "PromotionPostAsset_postId_sortOrder_idx"
      ON "PromotionPostAsset"("postId", "sortOrder");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "PromotionPostAsset_assetId_idx"
      ON "PromotionPostAsset"("assetId");
    `);

    results.push({ step: "create_PromotionPostAsset_table", status: "ok" });
  } catch (e: unknown) {
    const err = e as Error;
    results.push({
      step: "create_PromotionPostAsset",
      status: "error",
      error: err.message,
    });
  }

  const summary = {
    totalSteps: results.length,
    success: results.filter(
      (r) => r.status === "ok" || r.status === "already_exists",
    ).length,
    errors: results.filter((r) => r.status === "error"),
    results,
  };

  return NextResponse.json(summary);
}

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const checks: Array<{ name: string; exists: boolean }> = [];

  try {
    const r1 = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'SocialGroup'
      ) as exists;
    `;
    checks.push({ name: "SocialGroup_table", exists: r1[0]?.exists ?? false });
  } catch {
    checks.push({ name: "SocialGroup_table", exists: false });
  }

  try {
    const r2 = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'PromotionPost' AND column_name = 'platforms'
      ) as exists;
    `;
    checks.push({
      name: "PromotionPost_platforms_column",
      exists: r2[0]?.exists ?? false,
    });
  } catch {
    checks.push({ name: "PromotionPost_platforms_column", exists: false });
  }

  try {
    const r3 = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'PromotionPostAsset'
      ) as exists;
    `;
    checks.push({
      name: "PromotionPostAsset_table",
      exists: r3[0]?.exists ?? false,
    });
  } catch {
    checks.push({ name: "PromotionPostAsset_table", exists: false });
  }

  return NextResponse.json({ checks });
}
