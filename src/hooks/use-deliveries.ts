"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";
import { db } from "@/lib/db";
import type { AppName, Delivery, PeriodFilter, PeriodStat } from "@/lib/types";
import { startOfMonthISO, startOfWeekISO, todayISO } from "@/lib/apps";

// Hook central de acesso aos dados locais (IndexedDB via Dexie).
// useLiveQuery mantém a UI reativa automaticamente quando o banco muda.

export function useDeliveries() {
  // Lista todas as corridas, ordenadas pela mais recente primeiro.
  const allDeliveries = useLiveQuery(
    () => db.deliveries.orderBy("timestamp").reverse().toArray(),
    [],
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
    await db.deliveries.clear();
  }, []);

  return {
    allDeliveries,
    addDelivery,
    updateDelivery,
    deleteDelivery,
    clearAll,
  };
}

// Filtra corridas pelo período selecionado.
export function filterByPeriod(
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

// Calcula estatísticas agregadas do período.
export function computeStats(deliveries: Delivery[]): PeriodStat {
  const total = deliveries.reduce((acc, d) => acc + d.value, 0);
  const count = deliveries.length;
  const km = deliveries.reduce((acc, d) => acc + (d.km || 0), 0);

  const byAppMap = new Map<AppName, { total: number; count: number; km: number }>();
  for (const d of deliveries) {
    const prev = byAppMap.get(d.app) ?? { total: 0, count: 0, km: 0 };
    prev.total += d.value;
    prev.count += 1;
    prev.km += d.km || 0;
    byAppMap.set(d.app, prev);
  }

  const byApp = Array.from(byAppMap.entries())
    .map(([app, v]) => ({ app, ...v }))
    .sort((a, b) => b.total - a.total);

  return { total, count, km, byApp };
}

// Exporta os dados do entregador em JSON (backup local).
export function exportJSON(deliveries: Delivery[]): string {
  return JSON.stringify(
    {
      app: "MeuCorre",
      exportedAt: new Date().toISOString(),
      count: deliveries.length,
      deliveries,
    },
    null,
    2,
  );
}

// Exporta em CSV (abre no Excel/Google Sheets).
export function exportCSV(deliveries: Delivery[]): string {
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

// Dispara download no navegador.
export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
