/**
 * Insere o Clodoaldo Silva como usuário PRO manualmente.
 * Ele adquiriu o plano antes das correções (quando ainda não tinha Supabase).
 *
 * Credenciais:
 * - Email: clodoaldo608@gmail.com
 * - Senha: 88677488
 * - Status: PRO vitalício
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("👤 Inserindo Clodoaldo Silva como usuário PRO...\n");

  const email = "clodoaldo608@gmail.com";
  const password = "88677488";
  const name = "Clodoaldo Silva";

  // Verifica se já existe
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("⚠️  Usuário já existe. Atualizando para PRO...");
    const licenseKey = existing.licenseKey ?? crypto.randomBytes(16).toString("hex");
    await prisma.user.update({
      where: { id: existing.id },
      data: { isPro: true, licenseKey },
    });
    console.log("✅ Usuário atualizado para PRO");
    console.log(`   Licença: ${licenseKey}`);
    return;
  }

  // Cria usuário
  const passwordHash = await bcrypt.hash(password, 10);
  const licenseKey = crypto.randomBytes(16).toString("hex");

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      isPro: true,
      licenseKey,
    },
  });

  console.log("✅ Usuário criado:");
  console.log(`   ID: ${user.id}`);
  console.log(`   Nome: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   PRO: ${user.isPro}`);
  console.log(`   Licença: ${user.licenseKey}`);

  // Cria Subscription aprovada pra auditoria
  const sub = await prisma.subscription.create({
    data: {
      buyerName: name,
      buyerEmail: email,
      amount: 97,
      paymentMethod: "manual_grant",
      status: "approved",
      reviewedAt: new Date(),
      reviewedBy: "admin",
      reviewNotes: "PRO vitalício concedido manualmente — cliente pagou antes da migração Supabase",
      licenseKey,
    },
  });

  console.log("\n✅ Subscription criada pra auditoria:");
  console.log(`   ID: ${sub.id}`);
  console.log(`   Status: ${sub.status}`);
  console.log(`   Licença: ${sub.licenseKey}`);

  console.log("\n🎉 Clodoaldo Silva agora é PRO!");
  console.log(`   Login: ${email}`);
  console.log(`   Senha: ${password}`);
  console.log(`   Faça login em: https://meucorre.vercel.app/login`);
}

main()
  .catch((e) => {
    console.error("Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
