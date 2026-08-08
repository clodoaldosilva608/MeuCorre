import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";

// ===== Sincronização de dados entre dispositivos =====
//
// GET /api/sync?since=0
//   Baixa todas as mudanças (corridas + despesas) desde o timestamp informado.
//   Usado quando o app abre ou quando o usuário loga em novo dispositivo.
//
// POST /api/sync
//   Envia mudanças locais (corridas + despesas criadas/editadas/excluídas).
//   Usa upsert com last-write-wins baseado em updatedAt.

// GET — baixa mudanças desde timestamp
export async function GET(req: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const since = BigInt(searchParams.get("since") ?? "0");

  const [deliveries, expenses] = await Promise.all([
    prisma.syncedDelivery.findMany({
      where: {
        userId: session.sub,
        updatedAt: { gt: since },
      },
      orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
      take: 2000, // sem paginação — retorna tudo de uma vez
    }),
    prisma.syncedExpense.findMany({
      where: {
        userId: session.sub,
        updatedAt: { gt: since },
      },
      orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
      take: 2000,
    }),
  ]);

  // Encontra o maior updatedAt pra cliente saber até onde sincronizou
  const maxDeliveryUpdate = deliveries.length > 0
    ? deliveries[deliveries.length - 1].updatedAt
    : since;
  const maxExpenseUpdate = expenses.length > 0
    ? expenses[expenses.length - 1].updatedAt
    : since;
  const latestUpdatedAt = maxDeliveryUpdate > maxExpenseUpdate
    ? maxDeliveryUpdate
    : maxExpenseUpdate;

  return NextResponse.json({
    deliveries: deliveries.map((d) => ({
      ...d,
      value: Number(d.value),
      km: Number(d.km),
      timestamp: Number(d.timestamp),
      updatedAt: Number(d.updatedAt),
    })),
    expenses: expenses.map((e) => ({
      ...e,
      value: Number(e.value),
      timestamp: Number(e.timestamp),
      updatedAt: Number(e.updatedAt),
    })),
    latestUpdatedAt: Number(latestUpdatedAt),
    hasMore: deliveries.length === 2000 || expenses.length === 2000,
    serverTime: Date.now(),
  });
}

// POST — envia mudanças locais (upsert)
interface SyncPushBody {
  deliveries?: Array<{
    localId: number;
    app: string;
    value: number;
    km: number;
    date: string;
    timestamp: number;
    notes?: string | null;
    updatedAt: number;
    deleted?: boolean;
  }>;
  expenses?: Array<{
    localId: number;
    category: string;
    value: number;
    description?: string | null;
    date: string;
    timestamp: number;
    updatedAt: number;
    deleted?: boolean;
  }>;
}

export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: SyncPushBody;
  try {
    body = (await req.json()) as SyncPushBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const results = { deliveries: 0, expenses: 0 };

  // Upsert de corridas
  if (body.deliveries && body.deliveries.length > 0) {
    for (const d of body.deliveries.slice(0, 500)) {
      const existing = await prisma.syncedDelivery.findUnique({
        where: {
          userId_localId: {
            userId: session.sub,
            localId: d.localId,
          },
        },
      });

      // Last-write-wins: só atualiza se a versão recebida é mais recente
      if (!existing || BigInt(d.updatedAt) >= existing.updatedAt) {
        await prisma.syncedDelivery.upsert({
          where: {
            userId_localId: {
              userId: session.sub,
              localId: d.localId,
            },
          },
          create: {
            userId: session.sub,
            localId: d.localId,
            app: d.app,
            value: d.value,
            km: d.km,
            date: d.date,
            timestamp: BigInt(d.timestamp),
            notes: d.notes ?? null,
            updatedAt: BigInt(d.updatedAt),
            deleted: d.deleted ?? false,
          },
          update: {
            app: d.app,
            value: d.value,
            km: d.km,
            date: d.date,
            timestamp: BigInt(d.timestamp),
            notes: d.notes ?? null,
            updatedAt: BigInt(d.updatedAt),
            deleted: d.deleted ?? false,
          },
        });
        results.deliveries++;
      }
    }
  }

  // Upsert de despesas
  if (body.expenses && body.expenses.length > 0) {
    for (const e of body.expenses.slice(0, 500)) {
      const existing = await prisma.syncedExpense.findUnique({
        where: {
          userId_localId: {
            userId: session.sub,
            localId: e.localId,
          },
        },
      });

      if (!existing || BigInt(e.updatedAt) >= existing.updatedAt) {
        await prisma.syncedExpense.upsert({
          where: {
            userId_localId: {
              userId: session.sub,
              localId: e.localId,
            },
          },
          create: {
            userId: session.sub,
            localId: e.localId,
            category: e.category,
            value: e.value,
            description: e.description ?? null,
            date: e.date,
            timestamp: BigInt(e.timestamp),
            updatedAt: BigInt(e.updatedAt),
            deleted: e.deleted ?? false,
          },
          update: {
            category: e.category,
            value: e.value,
            description: e.description ?? null,
            date: e.date,
            timestamp: BigInt(e.timestamp),
            updatedAt: BigInt(e.updatedAt),
            deleted: e.deleted ?? false,
          },
        });
        results.expenses++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    saved: results,
    serverTime: Date.now(),
  });
}
