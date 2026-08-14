// Cria o bucket promotion-assets no Supabase via SQL direto no banco
// Usa a DATABASE_URL (que é a senha do banco) pra conectar e rodar SQL
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Criando bucket promotion-assets no Supabase ===\n");

  // 1. Verifica se o bucket já existe
  console.log("1. Verificando se bucket existe...");
  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM storage.buckets WHERE id = 'promotion-assets'
  `;
  if (existing.length > 0) {
    console.log("✅ Bucket já existe!");
    return;
  }

  // 2. Cria o bucket (public, com MIME types permitidos)
  console.log("2. Criando bucket...");
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
  console.log("✅ Bucket criado!");

  // 3. Cria políticas RLS (Row Level Security) — permite leitura pública e escrita só pra service_role
  console.log("3. Criando políticas RLS...");

  // Política de leitura pública (anônimo pode SELECT)
  await prisma.$executeRawUnsafe(`
    DROP POLICY IF EXISTS "Public read access" ON storage.objects;
    CREATE POLICY "Public read access" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'promotion-assets');
  `);
  console.log("✅ Política de leitura pública criada");

  // Política de escrita (só service_role e authenticated podem INSERT/UPDATE/DELETE)
  await prisma.$executeRawUnsafe(`
    DROP POLICY IF EXISTS "Authenticated write access" ON storage.objects;
    CREATE POLICY "Authenticated write access" ON storage.objects
    FOR ALL TO authenticated, service_role
    USING (bucket_id = 'promotion-assets')
    WITH CHECK (bucket_id = 'promotion-assets');
  `);
  console.log("✅ Política de escrita criada");

  // 4. Verificação final
  console.log("\n4. Verificação final...");
  const bucket = await prisma.$queryRaw<
    Array<{ id: string; public: boolean; file_size_limit: bigint }>
  >`
    SELECT id, public, file_size_limit FROM storage.buckets WHERE id = 'promotion-assets'
  `;
  console.log("Bucket:", bucket[0]);

  console.log("\n✅ Tudo pronto!");
  console.log("Bucket 'promotion-assets' criado e configurado.");
  console.log("\nAgora configure as env vars na Vercel:");
  console.log("  NEXT_PUBLIC_SUPABASE_URL=https://pjetmhsevohaqtqfbxrr.supabase.co");
  console.log("  SUPABASE_SERVICE_ROLE_KEY=<pegar em supabase.com/dashboard/project/pjetmhsevohaqtqfbxrr/settings/api>");
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
