// ===== Desativar feature flag admin_marketing_hub_enabled =====
//
// Script idempotente: desativa a flag (rollback rápido da Release C).
// A UI continua existindo mas o item de menu some e a página mostra aviso.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error", "warn"] });

async function main() {
  const key = "admin_marketing_hub_enabled";
  const value = "false";

  const result = await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });

  console.log("⛔ Feature flag desativada:");
  console.log(`   ${result.key} = ${result.value}`);
  console.log("\n💡 A Central de Divulgação foi ocultada do menu admin.");
}

main()
  .catch((e) => {
    console.error("💥 Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
