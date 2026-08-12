// ===== Ativar feature flag admin_partner_crm_enabled =====
//
// Idempotente: ativa a flag na tabela Setting.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error", "warn"] });

async function main() {
  const key = "admin_partner_crm_enabled";
  const value = "true";

  const result = await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });

  console.log("✅ Feature flag ativada:");
  console.log(`   ${result.key} = ${result.value}`);
  console.log("\n💡 O CRM de Parceiros agora aparece no menu admin.");
}

main()
  .catch((e) => {
    console.error("💥 Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
