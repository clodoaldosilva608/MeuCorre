// ===== Ativar feature flag admin_marketing_hub_enabled =====
//
// Script idempotente: ativa a flag na tabela Setting.
// Rodar após `prisma db push` (cria tabelas) e antes de testar a UI.
//
// Uso:
//   DATABASE_URL=<supabase_url> DIRECT_URL=<supabase_url> npx tsx scripts/promotion/enable-flag.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error", "warn"] });

async function main() {
  const key = "admin_marketing_hub_enabled";
  const value = "true";

  const result = await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });

  console.log("✅ Feature flag ativada:");
  console.log(`   ${result.key} = ${result.value}`);
  console.log("\n💡 A Central de Divulgação agora aparece no menu admin.");
  console.log("💡 Para desativar: rode scripts/promotion/disable-flag.ts");
}

main()
  .catch((e) => {
    console.error("💥 Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
