import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { z } from "zod";

// GET  /api/admin/revenue → lista entradas de receita
// POST /api/admin/revenue → cria nova entrada

const VALID_SOURCES = [
  "adsense", "affiliates", "sponsorships", "products",
  "subscription", "live", "toolkit", "course", "ebook", "other",
];

const schema = z.object({
  date: z.string().optional(), // ISO date string
  source: z.enum(VALID_SOURCES as [string, ...string[]]),
  description: z.string().max(500).optional().nullable(),
  amount: z.number().min(0, "Valor deve ser positivo"),
  cost: z.number().min(0).default(0),
  productId: z.string().optional().nullable(),
  metadata: z.any().optional().nullable(),
});

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = new URL(req.url);
  const source = url.searchParams.get("source");
  const days = parseInt(url.searchParams.get("days") ?? "30");

  try {
    const where: { source?: string; date?: { gte: Date } } = {};
    if (source) where.source = source;
    if (days > 0) {
      where.date = { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }

    const entries = await prisma.revenueEntry.findMany({
      where,
      orderBy: { date: "desc" },
      take: 500,
    });

    // Calcula totais por fonte
    const bySource: Record<string, { total: number; count: number; cost: number; profit: number }> = {};
    let totalAmount = 0;
    let totalCost = 0;

    for (const entry of entries) {
      if (!bySource[entry.source]) {
        bySource[entry.source] = { total: 0, count: 0, cost: 0, profit: 0 };
      }
      bySource[entry.source].total += entry.amount;
      bySource[entry.source].cost += entry.cost;
      bySource[entry.source].profit += entry.amount - entry.cost;
      bySource[entry.source].count += 1;
      totalAmount += entry.amount;
      totalCost += entry.cost;
    }

    return NextResponse.json({
      entries,
      stats: {
        total: entries.length,
        totalAmount,
        totalCost,
        totalProfit: totalAmount - totalCost,
        bySource,
      },
    });
  } catch (err) {
    const error = err as { message?: string };
    console.error("[admin/revenue] GET falhou:", err);
    return NextResponse.json({
      error: "Erro ao carregar receita",
      details: error.message,
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  try {
    const entry = await prisma.revenueEntry.create({
      data: {
        ...parsed.data,
        date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      },
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    const error = err as { message?: string };
    console.error("[admin/revenue] POST falhou:", err);
    return NextResponse.json({ error: "Erro ao criar entrada", details: error.message }, { status: 500 });
  }
}
