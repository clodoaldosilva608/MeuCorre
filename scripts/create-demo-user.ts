/**
 * Cria usuário de simulação "Carlos Entregador" com 3 meses de dados
 * (corridas + despesas) populados no Supabase.
 * 
 * Login: carlos.entregador@meucorre.com
 * Senha: 123456
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

const APPS = ["iFood", "99Food", "Lalamove", "Rappi"];
const EXPENSE_CATS = ["combustivel", "alimentacao", "manutencao", "bateria", "pedagio", "outros"];

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function main() {
  console.log("👤 Criando usuário de simulação Carlos Entregador...\n");

  const email = "carlos.entregador@meucorre.com";
  const password = "123456";
  const name = "Carlos Entregador";

  // Remove se já existe
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("⚠️  Usuário já existe. Removendo...");
    await prisma.syncedDelivery.deleteMany({ where: { userId: existing.id } });
    await prisma.syncedExpense.deleteMany({ where: { userId: existing.id } });
    await prisma.user.delete({ where: { id: existing.id } });
  }

  // Cria usuário
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      isPro: false, // gratuito pra mostrar trial/limites
      phone: "(11) 98765-4321",
      city: "São Paulo - SP",
    },
  });
  console.log("✅ Usuário criado:", user.id);

  // Gera 3 meses de dados (90 dias)
  // ~5-15 corridas por dia, nem todos os dias
  let localIdCounter = 1;
  let expenseLocalId = 1;
  const deliveries: Array<{
    userId: string;
    localId: number;
    app: string;
    value: number;
    km: number;
    date: string;
    timestamp: bigint;
    notes: string | null;
    updatedAt: bigint;
    deleted: boolean;
  }> = [];
  const expenses: Array<{
    userId: string;
    localId: number;
    category: string;
    value: number;
    description: string | null;
    date: string;
    timestamp: bigint;
    updatedAt: bigint;
    deleted: boolean;
  }> = [];

  const notes = [
    "Centro", "Vila Mariana", "Pinheiros", "Sé", "Liberdade",
    "Bela Vista", "Consolação", "Higienópolis", "República", "Santa Cecília",
    null, null, null, null, // às vezes sem nota
  ];

  for (let daysAgo = 89; daysAgo >= 0; daysAgo--) {
    const date = dateStr(daysAgo);
    // 70% de chance de ter corridas no dia
    if (Math.random() < 0.3) continue;

    const numDeliveries = randomInt(3, 15);
    for (let i = 0; i < numDeliveries; i++) {
      const hour = randomInt(8, 22);
      const minute = randomInt(0, 59);
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      d.setHours(hour, minute, 0, 0);
      const ts = BigInt(d.getTime());

      deliveries.push({
        userId: user.id,
        localId: localIdCounter++,
        app: pick(APPS),
        value: Number(randomBetween(8, 45).toFixed(2)),
        km: Number(randomBetween(1, 12).toFixed(1)),
        date,
        timestamp: ts,
        notes: pick(notes),
        updatedAt: ts,
        deleted: false,
      });
    }

    // Despesas: ~1-3 por dia
    const numExpenses = randomInt(0, 3);
    for (let i = 0; i < numExpenses; i++) {
      const hour = randomInt(8, 22);
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      d.setHours(hour, randomInt(0, 59), 0, 0);
      const ts = BigInt(d.getTime());

      const cat = pick(EXPENSE_CATS);
      let value = 0;
      let desc = null;
      switch (cat) {
        case "combustivel":
          value = Number(randomBetween(20, 80).toFixed(2));
          desc = "Gasolina";
          break;
        case "alimentacao":
          value = Number(randomBetween(10, 35).toFixed(2));
          desc = pick(["Almoço", "Marmita", "Lanche", "Janta"]);
          break;
        case "manutencao":
          value = Number(randomBetween(30, 150).toFixed(2));
          desc = pick(["Troca de óleo", "Pneu", "Revisão", "Corrente"]);
          break;
        case "bateria":
          value = Number(randomBetween(5, 20).toFixed(2));
          desc = "Recarga power bank";
          break;
        case "pedagio":
          value = Number(randomBetween(3, 15).toFixed(2));
          break;
        default:
          value = Number(randomBetween(5, 50).toFixed(2));
      }

      expenses.push({
        userId: user.id,
        localId: expenseLocalId++,
        category: cat,
        value,
        description: desc,
        date,
        timestamp: ts,
        updatedAt: ts,
        deleted: false,
      });
    }
  }

  console.log(`📊 Gerados: ${deliveries.length} corridas, ${expenses.length} despesas`);

  // Insere em batches
  const batchSize = 100;
  for (let i = 0; i < deliveries.length; i += batchSize) {
    const batch = deliveries.slice(i, i + batchSize);
    await prisma.syncedDelivery.createMany({ data: batch });
    process.stdout.write(`\r  Corridas: ${Math.min(i + batchSize, deliveries.length)}/${deliveries.length}`);
  }
  console.log("");

  for (let i = 0; i < expenses.length; i += batchSize) {
    const batch = expenses.slice(i, i + batchSize);
    await prisma.syncedExpense.createMany({ data: batch });
    process.stdout.write(`\r  Despesas: ${Math.min(i + batchSize, expenses.length)}/${expenses.length}`);
  }
  console.log("");

  // Calcula totais
  const totalGanhos = deliveries.reduce((s, d) => s + d.value, 0);
  const totalDespesas = expenses.reduce((s, e) => s + e.value, 0);
  const lucro = totalGanhos - totalDespesas;

  console.log("\n💰 Resumo dos 3 meses:");
  console.log(`   Total ganhos: R$ ${totalGanhos.toFixed(2)}`);
  console.log(`   Total despesas: R$ ${totalDespesas.toFixed(2)}`);
  console.log(`   Lucro líquido: R$ ${lucro.toFixed(2)}`);
  console.log(`   Corridas: ${deliveries.length}`);
  console.log(`   Despesas: ${expenses.length}`);

  console.log("\n🎉 Usuário de simulação criado!");
  console.log(`   Login: ${email}`);
  console.log(`   Senha: ${password}`);
  console.log(`   Acesse: https://meucorre.vercel.app/login`);
}

main()
  .catch((e) => {
    console.error("Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
