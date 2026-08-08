/**
 * Cria 4 usuários de teste NOVOS com dados completamente diferentes.
 * Cada um tem app, cidade, valores e padrão de uso distintos.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const USERS = [
  {
    name: "Rafael Souza",
    email: "rafael.souza@meucorre.com",
    password: "123456",
    city: "Campinas - SP",
    app: "iFood",
    baseValue: 12,
    notes: "Centro Histórico",
  },
  {
    name: "Juliana Ferreira",
    email: "juliana.ferreira@meucorre.com",
    password: "123456",
    city: "Salvador - BA",
    app: "99Food",
    baseValue: 18,
    notes: "Pelourinho",
  },
  {
    name: "Bruno Almeida",
    email: "bruno.almeida@meucorre.com",
    password: "123456",
    city: "Recife - PE",
    app: "Lalamove",
    baseValue: 35,
    notes: "Boa Viagem",
  },
  {
    name: "Fernanda Rocha",
    email: "fernanda.rocha@meucorre.com",
    password: "123456",
    city: "Fortaleza - CE",
    app: "Rappi",
    baseValue: 14,
    notes: "Beira Mar",
  },
];

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function main() {
  console.log("👥 Criando 4 usuários de teste NOVOS...\n");

  for (const u of USERS) {
    // Remove se já existe
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      await prisma.syncedDelivery.deleteMany({ where: { userId: existing.id } });
      await prisma.syncedExpense.deleteMany({ where: { userId: existing.id } });
      await prisma.user.delete({ where: { id: existing.id } });
    }

    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.create({
      data: { name: u.name, email: u.email, passwordHash, isPro: false, city: u.city },
    });

    // 15 corridas em 10 dias
    const deliveries = [];
    for (let i = 0; i < 15; i++) {
      const daysAgo = Math.floor(i / 2);
      const hour = 7 + (i % 13);
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      d.setHours(hour, (i * 11) % 60, 0, 0);
      const ts = BigInt(d.getTime());

      deliveries.push({
        userId: user.id,
        localId: i + 1,
        app: u.app,
        value: Number((u.baseValue + (i % 7)).toFixed(2)),
        km: Number((1.5 + (i % 9)).toFixed(1)),
        date: dateStr(daysAgo),
        timestamp: ts,
        notes: `${u.notes} - corrida ${i + 1}`,
        updatedAt: ts,
        deleted: false,
      });
    }

    // 4 despesas
    const expenses = [];
    const cats = [
      { cat: "combustivel", val: 35, desc: "Gasolina" },
      { cat: "alimentacao", val: 18, desc: "Marmita" },
      { cat: "manutencao", val: 55, desc: "Troca de óleo" },
      { cat: "pedagio", val: 8, desc: "Pedágio" },
    ];
    for (let i = 0; i < 4; i++) {
      const daysAgo = i * 3;
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      d.setHours(10, 0, 0, 0);
      const ts = BigInt(d.getTime());

      expenses.push({
        userId: user.id,
        localId: i + 1,
        category: cats[i].cat,
        value: Number(cats[i].val.toFixed(2)),
        description: `${u.city.split(" - ")[0]} - ${cats[i].desc}`,
        date: dateStr(daysAgo),
        timestamp: ts,
        updatedAt: ts,
        deleted: false,
      });
    }

    await prisma.syncedDelivery.createMany({ data: deliveries });
    await prisma.syncedExpense.createMany({ data: expenses });

    const ganhos = deliveries.reduce((s, d) => s + d.value, 0);
    const despesas = expenses.reduce((s, e) => s + e.value, 0);
    console.log(`✅ ${u.name} (${u.email})`);
    console.log(`   ${u.city} | ${u.app} | Notas: ${u.notes}`);
    console.log(`   15 corridas | 4 despesas`);
    console.log(`   Ganhos: R$ ${ganhos.toFixed(2)} | Despesas: R$ ${despesas.toFixed(2)} | Lucro: R$ ${(ganhos - despesas).toFixed(2)}\n`);
  }

  console.log("🎉 4 usuários criados!");
  console.log("\n📋 Resumo:");
  USERS.forEach(u => console.log(`  ${u.name} | ${u.email} | ${u.app} | ${u.city} | 123456`));
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
