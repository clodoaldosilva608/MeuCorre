/**
 * Script pra limpar dados de teste do Postgres (Supabase).
 * Deleta: Ad, Subscription, AdEvent, Feedback
 * Mantém: estrutura das tabelas, env vars, etc.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Limpando dados de teste do MeuCorre...\n");

  const ads = await prisma.ad.count();
  const subs = await prisma.subscription.count();
  const events = await prisma.adEvent.count();
  const feedbacks = await prisma.feedback.count();

  console.log(`Antes:`);
  console.log(`  Ads:          ${ads}`);
  console.log(`  Subscriptions: ${subs}`);
  console.log(`  AdEvents:     ${events}`);
  console.log(`  Feedbacks:    ${feedbacks}`);

  // Deleta tudo (ordem pra evitar FK constraints, embora não tenha FK explícita)
  await prisma.adEvent.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.ad.deleteMany();

  console.log("\n✅ Todos os dados foram excluídos!");

  const after = {
    ads: await prisma.ad.count(),
    subs: await prisma.subscription.count(),
    events: await prisma.adEvent.count(),
    feedbacks: await prisma.feedback.count(),
  };
  console.log(`\nDepois:`);
  console.log(`  Ads:          ${after.ads}`);
  console.log(`  Subscriptions: ${after.subs}`);
  console.log(`  AdEvents:     ${after.events}`);
  console.log(`  Feedbacks:    ${after.feedbacks}`);
}

main()
  .catch((e) => {
    console.error("Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
