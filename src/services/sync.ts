// ===== Service: Sync =====
//
// P2-10: Service layer para sincronização client→server.
//
// Centraliza:
// - LWW check (last-write-wins) — P0-10
// - Bulk upsert com verificação
// - Idempotência
//
// Benefícios:
// - route.ts fica fino (só HTTP + chama service)
// - Service é testável sem HTTP
// - Regras de sync em um lugar só

import { prisma } from "@/lib/prisma";

interface SyncDeliveryInput {
  localId: number;
  app: string;
  value: number;
  km: number;
  date: string;
  timestamp: number;
  notes?: string | null;
  updatedAt: number;
  deleted?: boolean;
}

interface SyncExpenseInput {
  localId: number;
  category: string;
  value: number;
  description?: string | null;
  date: string;
  timestamp: number;
  updatedAt: number;
  deleted?: boolean;
}

// Aplica LWW para deliveries.
// Retorna: { saved, skipped } — quantos foram salvos vs pulados.
export async function syncDeliveries(
  userId: string,
  deliveries: SyncDeliveryInput[],
): Promise<{ saved: number; skipped: number }> {
  let saved = 0;
  let skipped = 0;

  await prisma.$transaction(async (tx) => {
    await Promise.all(
      deliveries.map(async (d) => {
        const clientUpdatedAt = BigInt(d.updatedAt);

        // Busca registro existente para comparar updatedAt (LWW)
        const existing = await tx.syncedDelivery.findUnique({
          where: {
            userId_localId: {
              userId,
              localId: d.localId,
            },
          },
          select: { updatedAt: true },
        });

        // LWW: se cliente é mais antigo que servidor, PULA
        if (existing && existing.updatedAt > clientUpdatedAt) {
          skipped++;
          return;
        }

        await tx.syncedDelivery.upsert({
          where: {
            userId_localId: {
              userId,
              localId: d.localId,
            },
          },
          create: {
            userId,
            localId: d.localId,
            app: d.app,
            value: d.value,
            km: d.km,
            date: d.date,
            timestamp: BigInt(d.timestamp),
            notes: d.notes ?? null,
            updatedAt: clientUpdatedAt,
            deleted: d.deleted ?? false,
          },
          update: {
            app: d.app,
            value: d.value,
            km: d.km,
            date: d.date,
            timestamp: BigInt(d.timestamp),
            notes: d.notes ?? null,
            updatedAt: clientUpdatedAt,
            deleted: d.deleted ?? false,
          },
        });
        saved++;
      }),
    );
  });

  return { saved, skipped };
}

// Aplica LWW para expenses.
// Mesmo padrão que syncDeliveries.
export async function syncExpenses(
  userId: string,
  expenses: SyncExpenseInput[],
): Promise<{ saved: number; skipped: number }> {
  let saved = 0;
  let skipped = 0;

  await prisma.$transaction(async (tx) => {
    await Promise.all(
      expenses.map(async (e) => {
        const clientUpdatedAt = BigInt(e.updatedAt);

        const existing = await tx.syncedExpense.findUnique({
          where: {
            userId_localId: {
              userId,
              localId: e.localId,
            },
          },
          select: { updatedAt: true },
        });

        if (existing && existing.updatedAt > clientUpdatedAt) {
          skipped++;
          return;
        }

        await tx.syncedExpense.upsert({
          where: {
            userId_localId: {
              userId,
              localId: e.localId,
            },
          },
          create: {
            userId,
            localId: e.localId,
            category: e.category,
            value: e.value,
            description: e.description ?? null,
            date: e.date,
            timestamp: BigInt(e.timestamp),
            updatedAt: clientUpdatedAt,
            deleted: e.deleted ?? false,
          },
          update: {
            category: e.category,
            value: e.value,
            description: e.description ?? null,
            date: e.date,
            timestamp: BigInt(e.timestamp),
            updatedAt: clientUpdatedAt,
            deleted: e.deleted ?? false,
          },
        });
        saved++;
      }),
    );
  });

  return { saved, skipped };
}

// Busca mudanças do servidor desde timestamp.
// Retorna deliveries + expenses + latestUpdatedAt.
export async function getServerChanges(
  userId: string,
  since: number,
  cursor?: string | null,
  pageSize = 2000,
): Promise<{
  deliveries: Array<{
    localId: number;
    app: string;
    value: number;
    km: number;
    date: string;
    timestamp: number;
    notes: string | null;
    updatedAt: number;
    deleted: boolean;
  }>;
  expenses: Array<{
    localId: number;
    category: string;
    value: number;
    description: string | null;
    date: string;
    timestamp: number;
    updatedAt: number;
    deleted: boolean;
  }>;
  latestUpdatedAt: number;
  lastId: string | null;
  hasMore: boolean;
}> {
  const [deliveries, expenses] = await Promise.all([
    prisma.syncedDelivery.findMany({
      where: {
        userId,
        ...(cursor
          ? { OR: [{ updatedAt: { gt: BigInt(since) } }, { id: { gt: cursor } }] }
          : { updatedAt: { gt: BigInt(since) } }),
      },
      orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
      take: pageSize,
      select: {
        localId: true,
        app: true,
        value: true,
        km: true,
        date: true,
        timestamp: true,
        notes: true,
        updatedAt: true,
        deleted: true,
        id: true,
      },
    }),
    prisma.syncedExpense.findMany({
      where: {
        userId,
        updatedAt: { gt: BigInt(since) },
      },
      orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
      take: pageSize,
      select: {
        localId: true,
        category: true,
        value: true,
        description: true,
        date: true,
        timestamp: true,
        updatedAt: true,
        deleted: true,
      },
    }),
  ]);

  const deliveriesOut = deliveries.map((d) => ({
    localId: d.localId,
    app: d.app,
    value: Number(d.value),
    km: Number(d.km),
    date: d.date,
    timestamp: Number(d.timestamp),
    notes: d.notes,
    updatedAt: Number(d.updatedAt),
    deleted: d.deleted,
  }));

  const expensesOut = expenses.map((e) => ({
    localId: e.localId,
    category: e.category,
    value: Number(e.value),
    description: e.description,
    date: e.date,
    timestamp: Number(e.timestamp),
    updatedAt: Number(e.updatedAt),
    deleted: e.deleted,
  }));

  const allTimestamps = [
    ...deliveries.map((d) => Number(d.updatedAt)),
    ...expenses.map((e) => Number(e.updatedAt)),
  ];
  const latestUpdatedAt = allTimestamps.length > 0 ? Math.max(...allTimestamps) : since;
  const lastId = deliveries.length > 0 ? deliveries[deliveries.length - 1].id : null;
  const hasMore = deliveries.length === pageSize || expenses.length === pageSize;

  return {
    deliveries: deliveriesOut,
    expenses: expensesOut,
    latestUpdatedAt,
    lastId,
    hasMore,
  };
}
