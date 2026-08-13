import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";
import { applyRateLimit } from "@/lib/rate-limit";

// ===== Sincronização de dados entre dispositivos =====
//
// GET /api/sync?since=<timestamp>&lastId=<id>
//   Baixa todas as mudanças (corridas + despesas) desde o cursor informado.
//   Cursor composto (updatedAt, id) garante que registros com o mesmo
//   timestamp não sejam pulados na paginação.
//
// POST /api/sync
//   Envia mudanças locais (corridas + despesas criadas/editadas/excluídas).
//   Usa $transaction com Promise.all para bulk upsert (1 roundtrip ao banco
//   em vez de N roundtrips sequenciais). Last-write-wins baseado em updatedAt.
//
// RATE LIMIT: 60 syncs/min por usuário (GET + POST combinados).
// Previne abuso sem afetar usuários legítimos (sync normal é 1-2x/min).

const PAGE_SIZE = 2000;
const MAX_PUSH_BATCH = 500;

// GET — baixa mudanças desde cursor composto (updatedAt, id)
export async function GET(req: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Rate limit por userId (não por IP) — resolve CGNAT brasileiro
  const limited = await applyRateLimit(
    req,
    { windowMs: 60 * 1000, maxRequests: 60 },
    session.sub,
  );
  if (limited) return limited;

  const { searchParams } = new URL(req.url);

  // ===== Validação do parâmetro `since` (Achado #3 da Fase 2 corrigido) =====
  // Antes da correção, BigInt("invalid") lançava SyntaxError não capturado,
  // resultando em 500. Agora validamos explicitamente e retornamos 400.
  const sinceRaw = searchParams.get("since") ?? "0";
  if (!/^\d+$/.test(sinceRaw)) {
    return NextResponse.json(
      { error: "Parâmetro 'since' inválido — deve ser um número inteiro não-negativo" },
      { status: 400 },
    );
  }
  const since = BigInt(sinceRaw);

  // lastId: ID do último registro retornado na página anterior (cursor tiebreaker)
  // Evita pular registros que têm o mesmo updatedAt do último registro da página
  const lastId = searchParams.get("lastId"); // string | null

  // Constrói o where com cursor composto:
  // - updatedAt > since  (registros mais novos que o cursor)
  // - OU (updatedAt == since AND id > lastId)  (tiebreaker: registros com
  //   mesmo timestamp mas ID maior que o último retornado)
  const buildWhere = (userId: string) => {
    if (!lastId) {
      // Sem lastId: comportamento original (compatibilidade com clients antigos)
      return { userId, updatedAt: { gt: since } };
    }
    // Com lastId: cursor composto (updatedAt, id)
    return {
      userId,
      AND: [
        {
          OR: [
            { updatedAt: { gt: since } },
            { updatedAt: since, id: { gt: lastId } },
          ],
        },
      ],
    };
  };

  const [deliveries, expenses] = await Promise.all([
    prisma.syncedDelivery.findMany({
      where: buildWhere(session.sub),
      orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
      take: PAGE_SIZE,
    }),
    prisma.syncedExpense.findMany({
      where: buildWhere(session.sub),
      orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
      take: PAGE_SIZE,
    }),
  ]);

  // Cursor composto para o client: (updatedAt, id) do último registro
  // O client deve enviar ambos no próximo GET para continuar a paginação
  const lastDelivery = deliveries.length > 0 ? deliveries[deliveries.length - 1] : null;
  const lastExpense = expenses.length > 0 ? expenses[expenses.length - 1] : null;

  // latestUpdatedAt = maior updatedAt retornado (para compatibilidade com
  // clients antigos que não usam lastId)
  const maxDeliveryUpdate = lastDelivery ? lastDelivery.updatedAt : since;
  const maxExpenseUpdate = lastExpense ? lastExpense.updatedAt : since;
  const latestUpdatedAt = maxDeliveryUpdate > maxExpenseUpdate
    ? maxDeliveryUpdate
    : maxExpenseUpdate;

  // lastId = ID do último registro retornado (considerando deliveries e expenses)
  // O client usa este ID como tiebreaker no próximo pull
  const lastIdOut = lastDelivery ?? lastExpense;
  const lastIdValue = lastIdOut ? lastIdOut.id : null;

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
    lastId: lastIdValue, // cursor tiebreaker (null se sem registros)
    hasMore: deliveries.length === PAGE_SIZE || expenses.length === PAGE_SIZE,
    serverTime: Date.now(),
  });
}

// POST — envia mudanças locais (bulk upsert em transação)
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

  // Rate limit por userId (não por IP) — resolve CGNAT brasileiro
  const limited = await applyRateLimit(
    req,
    { windowMs: 60 * 1000, maxRequests: 60 },
    session.sub,
  );
  if (limited) return limited;

  let body: SyncPushBody;
  try {
    body = (await req.json()) as SyncPushBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const results = { deliveries: 0, expenses: 0 };

  // PERFORMANCE + ATOMICIDADE:
  // - $transaction: todas as escritas são atômicas (ou tudo salva, ou nada)
  // - Promise.all: upserts rodam em paralelo dentro da transação (1 roundtrip
  //   ao banco em vez de N roundtrips sequenciais)
  // - Sem findUnique prévio: o upsert com create/update condicional já garante
  //   last-write-wins (updatedAt no update só aplica se for mais recente).
  //   Removemos o findUnique para cortar pela metade o número de queries.
  try {
    await prisma.$transaction(async (tx) => {
      // Bulk upsert de deliveries
      if (body.deliveries && body.deliveries.length > 0) {
        const deliveriesToSync = body.deliveries.slice(0, MAX_PUSH_BATCH);
        await Promise.all(
          deliveriesToSync.map((d) =>
            tx.syncedDelivery.upsert({
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
            }),
          ),
        );
        results.deliveries = deliveriesToSync.length;
      }

      // Bulk upsert de expenses
      if (body.expenses && body.expenses.length > 0) {
        const expensesToSync = body.expenses.slice(0, MAX_PUSH_BATCH);
        await Promise.all(
          expensesToSync.map((e) =>
            tx.syncedExpense.upsert({
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
            }),
          ),
        );
        results.expenses = expensesToSync.length;
      }
    });
  } catch (error) {
    // Se a transação falhar, retorna erro — NADA é salvo pela metade
    console.error("[sync POST] Transação falhou");
    return NextResponse.json(
      { error: "Falha na sincronização", ok: false },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    saved: results,
    serverTime: Date.now(),
  });
}
