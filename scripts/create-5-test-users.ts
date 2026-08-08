/**
 * Cria 5 usuários de teste diferentes, cada um com dados PRÓPRIOS e ÚNICOS.
 * Corrigido: cada usuário tem app, cidade e valores diferentes.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const USERS = [
  {
    name: "Pedro Santos",
    email: "pedro.santos@teste.com",
    password: "123456",
    city: "São Paulo - SP",
    app: "iFood",
    baseValue: 15,
  },
  {
    name: "Maria Oliveira",
    email: "maria.oliveira@teste.com",
    password: "123456",
    city: "Rio de Janeiro - RJ",
    app: "99Food",
    baseValue: 20,
  },
  {
    name: "José Pereira",
    email: "jose.pereira@teste.com",
    password: "123456",
    city: "Belo Horizonte - MG",
    app: "Lalamove",
    baseValue: 30,
  },
  {
    name: "Ana Costa",
    email: "ana.costa@teste.com",
    password: "123456",
    city: "Curitiba - PR",
    app: "Rappi",
    baseValue: 12,
  },
  {
    name: "Carlos Lima",
    email: "carlos.lima@teste.com",
    password: "123456",
    city: "Porto Alegre - RS",
    app: "iFood",
    baseValue: 18,
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
  console.log("👥 Criando 5 usuários de teste com dados únicos...\n");

  for (const u of USERS) {
    // Cria usuário
    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        passwordHash,
        isPro: false,
        city: u.city,
      },
    });

    // Gera 10 corridas (7 dias)
    const deliveries = [];
    for (let i = 0; i < 10; i++) {
      const daysAgo = Math.floor(i / 2);
      const hour = 8 + (i % 10);
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      d.setHours(hour, (i * 7) % 60, 0, 0);
      const ts = BigInt(d.getTime());

      deliveries.push({
        userId: user.id,
        localId: i + 1,
        app: u.app,
        value: Number((u.baseValue + (i % 5)).toFixed(2)),
        km: Number((2 + (i % 6)).toFixed(1)),
        date: dateStr(daysAgo),
        timestamp: ts,
        notes: `${u.city.split(" - ")[0]} - corrida ${i + 1}`,
        updatedAt: ts,
        deleted: false,
      });
    }

    // Gera 3 despesas
    const expenses = [];
    const expCats = ["combustivel", "alimentacao", "manutencao"];
    for (let i = 0; i < 3; i++) {
      const daysAgo = i * 2;
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      d.setHours(12, 0, 0, 0);
      const ts = BigInt(d.getTime());

      expenses.push({
        userId: user.id,
        localId: i + 1,
        category: expCats[i],
        value: Number((10 + i * 5).toFixed(2)),
        description: `${u.city.split(" - ")[0]} - despesa ${i + 1}`,
        date: dateStr(daysAgo),
        timestamp: ts,
        updatedAt: ts,
        deleted: false,
      });
    }

    await prisma.syncedDelivery.createMany({ data: deliveries });
    await prisma.syncedExpense.createMany({ data: expenses });

    const totalGanhos = deliveries.reduce((s, d) => s + d.value, 0);
    const totalDespesas = expenses.reduce((s, e) => s + e.value, 0);

    console.log(`✅ ${u.name} (${u.email})`);
    console.log(`   ${u.city} | App: ${u.app}`);
    console.log(`   10 corridas | 3 despesas`);
    console.log(`   Ganhos: R$ ${totalGanhos.toFixed(2)} | Despesas: R$ ${totalDespesas.toFixed(2)}`);
    console.log(`   Senha: ${u.password}\n`);
  }

  console.log("🎉 5 usuários criados com dados únicos!");
}

main()
  .catch((e) => { console.error("Erro:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
