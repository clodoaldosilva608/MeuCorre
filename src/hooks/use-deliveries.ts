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
      await ensureDefaultApps();
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

  const deleteDelivery = useCallback(async (id: number) => {
    await db.deliveries.delete(id);
  }, []);

  const clearAll = useCallback(async () => {
    // Apaga TODAS as corridas e despesas do DB local.
    // Não apaga a tabela `apps` (apps cadastrados devem persistir).
    // O sync posterior enviará os registros como "deleted" para o servidor.
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

  const deleteExpense = useCallback(async (id: number) => {
    await db.expenses.delete(id);
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
