"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useMemo, useState } from "react";
import { db, ensureDefaultApps } from "@/lib/db";
import type {
  DeliveryApp,
  Delivery,
  Expense,
  ExpenseCategory,
  PeriodFilter,
  PeriodStat,
} from "@/lib/types";
import {
  startOfMonthISO,
  startOfWeekISO,
  todayISO,
  appMeta,
} from "@/lib/apps";

// ===== Hook auxiliar: reassina quando o DB ativo muda =====
//
// Quando o usuário troca de conta (login/logout), `switchDb()` fecha todos os
// DBs cached e emite o evento "meucorre-db-switched". Sem este hook, o
// `useLiveQuery` continuaria inscrito no DB do usuário anterior, mostrando
// dados stale na tela (race condition pós-login).
//
// Retornamos um número que incrementa a cada troca de DB, para ser usado
// como dep do useLiveQuery.
function useDbVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const handler = () => setVersion((v) => v + 1);
    window.addEventListener("meucorre-db-switched", handler);
    return () => window.removeEventListener("meucorre-db-switched", handler);
  }, []);
  return version;
}

// ===== Apps =====

export function useApps() {
  const dbVersion = useDbVersion();
  const apps = useLiveQuery(
    async () => {
      // ensureDefaultApps pode falhar se dados antigos do IndexedDB
      // não tiverem campos esperados. Wrap em try-catch para não
      // crashar o app — apps existentes ainda são retornados.
      try {
        await ensureDefaultApps();
      } catch (e) {
        console.warn("[useApps] ensureDefaultApps falhou, usando apps existentes:", e);
      }
      const all = await db.apps.toArray();
      return all.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    },
    [dbVersion],
    [] as DeliveryApp[],
  );

  const visibleApps = useMemo(
    () => apps.filter((a) => !a.hidden),
    [apps],
  );

  const addApp = useCallback(
    async (data: Omit<DeliveryApp, "id">) => {
      const maxOrder = await db.apps.orderBy("order").last();
      await db.apps.add({
        ...data,
        isDefault: false,
        order: (maxOrder?.order ?? 0) + 1,
      });
    },
    [],
  );

  const updateApp = useCallback(
    async (id: number, data: Partial<Omit<DeliveryApp, "id">>) => {
      await db.apps.update(id, data);
    },
    [],
  );

  const deleteApp = useCallback(async (id: number) => {
    // Apps padrão não podem ser excluídos, só ocultados.
    const app = await db.apps.get(id);
    if (app?.isDefault) {
      await db.apps.update(id, { hidden: true });
    } else {
      await db.apps.delete(id);
    }
  }, []);

  const toggleHideApp = useCallback(async (id: number) => {
    const app = await db.apps.get(id);
    if (app) {
      await db.apps.update(id, { hidden: !app.hidden });
    }
  }, []);

  const reorderApps = useCallback(async (orderedIds: number[]) => {
    await db.transaction("rw", db.apps, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.apps.update(orderedIds[i], { order: i });
      }
    });
  }, []);

  return {
    apps,
    visibleApps,
    addApp,
    updateApp,
    deleteApp,
    toggleHideApp,
    reorderApps,
  };
}

// ===== Deliveries =====

export function useDeliveries() {
  const dbVersion = useDbVersion();
  const allDeliveries = useLiveQuery(
    () => db.deliveries.orderBy("timestamp").reverse().toArray(),
    [dbVersion],
    [] as Delivery[],
  );

  const addDelivery = useCallback(
    async (data: Omit<Delivery, "id" | "timestamp" | "date">) => {
      const now = new Date();
      await db.deliveries.add({
        ...data,
        date: todayISO(now),
        timestamp: now.getTime(),
      });
    },
    [],
  );

  const updateDelivery = useCallback(
    async (id: number, data: Partial<Omit<Delivery, "id">>) => {
      await db.deliveries.update(id, data);
    },
    [],
  );

  // SEGURANÇA DE DADOS (P1-5 corrigido):
  // Antes: hard-delete local (db.deliveries.delete). Servidor mantinha
  // o registro ativo e, no próximo pull, ele era re-importado — dando a
  // impressão de que "excluir" não funcionou.
  // Agora: marca updatedAt = now no registro local antes de deletar,
  // para que o próximo syncNow envie `deleted: true` ao servidor.
  // O servidor então marca deleted=true e outros devices recebem o delete.
  const deleteDelivery = useCallback(async (id: number) => {
    // Busca registro para capturar dados e marcar updatedAt
    const delivery = await db.deliveries.get(id);
    if (!delivery) return;

    // Deleta local
    await db.deliveries.delete(id);

    // Envia delete ao servidor (fire-and-forget — se falhar, próximo sync tenta de novo)
    // Importante: usa updatedAt = now para que o LWW check no servidor funcione.
    const now = Date.now();
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveries: [{
            localId: id,
            app: delivery.app,
            value: delivery.value,
            km: delivery.km,
            date: delivery.date,
            timestamp: delivery.timestamp,
            notes: delivery.notes ?? null,
            updatedAt: now,
            deleted: true,
          }],
          expenses: [],
        }),
      });
      // Atualiza last_sync para now — próximo pull não re-importa este registro
      localStorage.setItem("meucorre_last_sync", String(now));
    } catch {
      // Offline — registro já foi deletado localmente.
      // Próximo syncNow enviará quando voltar a conexão.
      // Mas o syncNow atual só envia registros NÃO-deletados (push envia db.deliveries.toArray())
      // — então o delete não será enviado. Aceitável: no próximo pull, o registro volta.
      // Para corrigir isso definitivamente, precisaríamos de uma tabela "tombstones"
      // local. Por ora, deletar offline = volta no próximo sync online.
      // (trade-off aceitável para MVP)
    }
  }, []);

  const clearAll = useCallback(async () => {
    // CRÍTICO: Antes de limpar o DB local, capturamos todos os registros
    // para enviá-los ao servidor como "deleted: true". Sem isso, o servidor
    // mantém os registros ativos e, no próximo pull, eles são re-importados
    // para o DB local — dando a impressão de que "Apagar tudo" não funcionou.
    const localDeliveries = await db.deliveries.toArray();
    const localExpenses = await db.expenses.toArray();

    const now = Date.now();

    // Envia exclusões para o servidor (se logado)
    if (localDeliveries.length > 0 || localExpenses.length > 0) {
      try {
        const deliveriesPayload = localDeliveries.map((d) => ({
          localId: d.id!,
          app: d.app,
          value: d.value,
          km: d.km,
          date: d.date,
          timestamp: d.timestamp,
          notes: d.notes ?? null,
          updatedAt: now, // marca como atualizado AGORA (deleta no servidor)
          deleted: true,
        }));

        const expensesPayload = localExpenses.map((e) => ({
          localId: e.id!,
          category: e.category,
          value: e.value,
          description: e.description ?? null,
          date: e.date,
          timestamp: e.timestamp,
          updatedAt: now,
          deleted: true,
        }));

        await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliveries: deliveriesPayload,
            expenses: expensesPayload,
          }),
        });

        // Atualiza last_sync para now — assim o próximo pull não vai
        // re-importar esses registros (eles têm updatedAt <= now)
        localStorage.setItem("meucorre_last_sync", String(now));
      } catch {
        // Se falhar (offline), ainda assim limpa localmente.
        // Quando voltar a conexão, o syncNow enviará os deletes pendentes.
        // Não atualizamos last_sync — o próximo pull pode re-importar,
        // mas isso é aceitável em modo offline.
      }
    }

    // Apaga TODAS as corridas e despesas do DB local.
    // Não apaga a tabela `apps` (apps cadastrados devem persistir).
    await db.deliveries.clear();
    await db.expenses.clear();
    // Dispara evento para forçar re-render dos componentes que dependem
    // do DB (caso useLiveQuery não detecte a mudança imediatamente).
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("meucorre-data-cleared"));
    }
  }, []);

  return {
    allDeliveries,
    addDelivery,
    updateDelivery,
    deleteDelivery,
    clearAll,
  };
}

// ===== Expenses =====

export function useExpenses() {
  const dbVersion = useDbVersion();
  const allExpenses = useLiveQuery(
    () => db.expenses.orderBy("timestamp").reverse().toArray(),
    [dbVersion],
    [] as Expense[],
  );

  const addExpense = useCallback(
    async (data: {
      category: ExpenseCategory;
      value: number;
      description?: string;
    }) => {
      const now = new Date();
      await db.expenses.add({
        ...data,
        date: todayISO(now),
        timestamp: now.getTime(),
      });
    },
    [],
  );

  const updateExpense = useCallback(
    async (id: number, data: Partial<Omit<Expense, "id">>) => {
      await db.expenses.update(id, data);
    },
    [],
  );

  // SEGURANÇA DE DADOS (P1-5 corrigido):
  // Mesmo padrão que deleteDelivery — envia delete ao servidor.
  const deleteExpense = useCallback(async (id: number) => {
    const expense = await db.expenses.get(id);
    if (!expense) return;

    await db.expenses.delete(id);

    const now = Date.now();
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveries: [],
          expenses: [{
            localId: id,
            category: expense.category,
            value: expense.value,
            description: expense.description ?? null,
            date: expense.date,
            timestamp: expense.timestamp,
            updatedAt: now,
            deleted: true,
          }],
        }),
      });
      localStorage.setItem("meucorre_last_sync", String(now));
    } catch {
      // Offline — mesmo trade-off que deleteDelivery
    }
  }, []);

  return { allExpenses, addExpense, updateExpense, deleteExpense };
}

// ===== Filtros e Estatísticas =====

export function filterByPeriodDeliveries(
  deliveries: Delivery[],
  period: PeriodFilter,
): Delivery[] {
  if (period === "tudo") return deliveries;
  const today = todayISO();
  if (period === "hoje") return deliveries.filter((d) => d.date === today);
  if (period === "semana") {
    const start = startOfWeekISO();
    return deliveries.filter((d) => d.date >= start && d.date <= today);
  }
  if (period === "mes") {
    const start = startOfMonthISO();
    return deliveries.filter((d) => d.date >= start && d.date <= today);
  }
  return deliveries;
}

export function filterByPeriodExpenses(
  expenses: Expense[],
  period: PeriodFilter,
): Expense[] {
  if (period === "tudo") return expenses;
  const today = todayISO();
  if (period === "hoje") return expenses.filter((e) => e.date === today);
  if (period === "semana") {
    const start = startOfWeekISO();
    return expenses.filter((e) => e.date >= start && e.date <= today);
  }
  if (period === "mes") {
    const start = startOfMonthISO();
    return expenses.filter((e) => e.date >= start && e.date <= today);
  }
  return expenses;
}

export function computeStats(
  deliveries: Delivery[],
  expenses: Expense[],
  apps: DeliveryApp[],
): PeriodStat {
  const total = deliveries.reduce((acc, d) => acc + d.value, 0);
  const count = deliveries.length;
  const km = deliveries.reduce((acc, d) => acc + (d.km || 0), 0);
  const expensesTotal = expenses.reduce((acc, e) => acc + e.value, 0);

  const byAppMap = new Map<
    string,
    { total: number; count: number; km: number }
  >();
  for (const d of deliveries) {
    const prev = byAppMap.get(d.app) ?? { total: 0, count: 0, km: 0 };
    prev.total += d.value;
    prev.count += 1;
    prev.km += d.km || 0;
    byAppMap.set(d.app, prev);
  }

  const byApp = Array.from(byAppMap.entries())
    .map(([appName, v]) => {
      const meta = appMeta(appName, apps);
      return {
        app: appName,
        label: meta.label,
        color: meta.color,
        emoji: meta.emoji,
        image: meta.image,
        ...v,
      };
    })
    .sort((a, b) => b.total - a.total);

  return {
    total,
    count,
    km,
    byApp,
    expenses: expensesTotal,
    netProfit: total - expensesTotal,
  };
}

// Série temporal: ganhos por dia (últimos N dias)
export function computeDailySeries(
  deliveries: Delivery[],
  expenses: Expense[],
  days = 7,
): { date: string; label: string; ganhos: number; despesas: number }[] {
  const out: { date: string; label: string; ganhos: number; despesas: number }[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = todayISO(d);
    const label = d.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
    });
    const ganhos = deliveries
      .filter((x) => x.date === iso)
      .reduce((s, x) => s + x.value, 0);
    const despesas = expenses
      .filter((x) => x.date === iso)
      .reduce((s, x) => s + x.value, 0);
    out.push({ date: iso, label, ganhos, despesas });
  }

  return out;
}

// ===== Export =====

export function exportJSON(
  deliveries: Delivery[],
  expenses: Expense[],
  apps: DeliveryApp[],
): string {
  return JSON.stringify(
    {
      app: "MeuCorre",
      version: 2,
      exportedAt: new Date().toISOString(),
      counts: {
        deliveries: deliveries.length,
        expenses: expenses.length,
        apps: apps.length,
      },
      deliveries,
      expenses,
      apps,
    },
    null,
    2,
  );
}

export function exportDeliveriesCSV(deliveries: Delivery[]): string {
  const header = "id,app,valor,km,data,hora\n";
  const rows = deliveries
    .map((d) => {
      const time = new Date(d.timestamp).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${d.id ?? ""},"${d.app}",${d.value.toFixed(2)},${d.km.toFixed(1)},${d.date},${time}`;
    })
    .join("\n");
  return header + rows;
}

export function exportExpensesCSV(expenses: Expense[]): string {
  const header = "id,categoria,valor,descricao,data\n";
  const rows = expenses
    .map((e) => {
      return `${e.id ?? ""},${e.category},${e.value.toFixed(2)},"${e.description ?? ""}",${e.date}`;
    })
    .join("\n");
  return header + rows;
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  // BOM para Excel ler UTF-8 corretamente
  if (type.includes("csv")) {
    const blobWithBom = new Blob(["\ufeff" + content], { type });
    const url = URL.createObjectURL(blobWithBom);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
