import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// ===== Cria o bucket promotion-assets no Supabase via SQL =====
//
// Como não temos acesso direto ao dashboard do Supabase, esta rota
// cria o bucket e as políticas RLS via SQL executado no banco.
//
// POST /api/admin/supabase-bucket — cria bucket
// GET /api/admin/supabase-bucket — verifica status

export async function POST() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const results: Array<{ step: string; status: string; error?: string }> = [];

  // 1. Verifica se o bucket já existe
  try {
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM storage.buckets WHERE id = 'promotion-assets'
    `;
    if (existing.length > 0) {
      results.push({ step: "check_bucket", status: "already_exists" });
      return NextResponse.json({
        ok: true,
        message: "Bucket já existe",
        results,
      });
    }
    results.push({ step: "check_bucket", status: "not_found" });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json(
      {
        error: `Erro ao verificar bucket: ${err.message}`,
        hint: "Pode ser que o usuário do banco não tenha permissão no schema storage.",
      },
      { status: 500 },
    );
  }

  // 2. Cria o bucket
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit, created_at, updated_at)
      VALUES (
        'promotion-assets',
        'promotion-assets',
        true,
        ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
        10485760,
        NOW(),
        NOW()
      )
    `);
    results.push({ step: "create_bucket", status: "ok" });
  } catch (e: unknown) {
    const err = e as Error;
    results.push({
      step: "create_bucket",
      status: "error",
      error: err.message,
    });
    return NextResponse.json({ error: err.message, results }, { status: 500 });
  }

  // 3. Cria políticas RLS (uma query por vez — Prisma não suporta múltiplos statements)
  try {
    await prisma.$executeRawUnsafe(
      `DROP POLICY IF EXISTS "Public read access promotion" ON storage.objects`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE POLICY "Public read access promotion" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'promotion-assets')`,
    );
    results.push({ step: "create_read_policy", status: "ok" });
  } catch (e: unknown) {
    const err = e as Error;
    results.push({
      step: "create_read_policy",
      status: "error",
      error: err.message,
    });
  }

  try {
    await prisma.$executeRawUnsafe(
      `DROP POLICY IF EXISTS "Authenticated write access promotion" ON storage.objects`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE POLICY "Authenticated write access promotion" ON storage.objects FOR ALL TO authenticated, service_role USING (bucket_id = 'promotion-assets') WITH CHECK (bucket_id = 'promotion-assets')`,
    );
    results.push({ step: "create_write_policy", status: "ok" });
  } catch (e: unknown) {
    const err = e as Error;
    results.push({
      step: "create_write_policy",
      status: "error",
      error: err.message,
    });
  }

  return NextResponse.json({
    ok: true,
    message: "Bucket criado com sucesso",
    results,
  });
}

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const bucket = await prisma.$queryRaw<
      Array<{ id: string; public: boolean; file_size_limit: bigint | null }>
    >`
      SELECT id, public, file_size_limit FROM storage.buckets WHERE id = 'promotion-assets'
    `;

    if (bucket.length === 0) {
      return NextResponse.json({
        exists: false,
        message: "Bucket não existe. Rode POST para criar.",
      });
    }

    return NextResponse.json({
      exists: true,
      bucket: {
        id: bucket[0].id,
        public: bucket[0].public,
        fileSizeLimit: bucket[0].file_size_limit?.toString(),
      },
    });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json(
      {
        exists: false,
        error: err.message,
      },
      { status: 500 },
    );
  }
}
