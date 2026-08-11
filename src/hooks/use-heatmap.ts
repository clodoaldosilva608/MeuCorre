"use client";

import { useMemo } from "react";
import type { Delivery, HeatmapPoint } from "@/lib/types";

// ===== Hook useHeatmap =====
//
// Agrega deliveries com coordenadas GPS em um grid de células para gerar
// pontos de calor do mapa de calor de áreas quentes.
//
// O grid divide a área em células de ~500m (0.005 graus). Cada delivery
// cai em uma célula e incrementa o contador + faturamento daquela célula.
// A intensidade é normalizada 0-1 para o mapa de calor visualizar.
//
// Filtros suportados:
// - "all": todas as deliveries com GPS
// - "today": apenas hoje
// - "week": esta semana (domingo a sábado)
// - "month": este mês
// - "weekday":dia da semana específico (0=domingo, 6=sábado) — identifica
//   áreas quentes por dia da semana (ex: segundas à noite no centro)
// - "custom": intervalo personalizado (startDate a endDate)
//
// Retorna também estatísticas agregadas (total de pontos, áreas top, etc.)

export type HeatmapFilter =
  | { type: "all" }
  | { type: "today" }
  | { type: "week" }
  | { type: "month" }
  | { type: "weekday"; weekday: number } // 0=domingo, 6=sábado
  | { type: "custom"; startDate: string; endDate: string };

export interface UseHeatmapReturn {
  points: HeatmapPoint[];
  totalDeliveries: number;
  totalValue: number;
  topAreas: { lat: number; lng: number; count: number; value: number }[];
  hasData: boolean;
}

// Tamanho da célula do grid em graus (~500m)
const GRID_SIZE = 0.005;

// Arredonda para a célula do grid mais próxima
function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

// Calcula o início da semana (domingo) em ISO
function startOfWeek(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return isoDate(d);
}

// Calcula o início do mês em ISO
function startOfMonth(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useHeatmap(
  deliveries: Delivery[],
  filter: HeatmapFilter,
): UseHeatmapReturn {
  return useMemo(() => {
    // Filtra apenas deliveries com coordenadas GPS
    const withCoords = deliveries.filter(
      (d) => typeof d.lat === "number" && typeof d.lng === "number",
    );

    if (withCoords.length === 0) {
      return {
        points: [],
        totalDeliveries: 0,
        totalValue: 0,
        topAreas: [],
        hasData: false,
      };
    }

    // Aplica filtro de período
    const today = isoDate(new Date());
    const filtered = withCoords.filter((d) => {
      switch (filter.type) {
        case "all":
          return true;
        case "today":
          return d.date === today;
        case "week":
          return d.date >= startOfWeek() && d.date <= today;
        case "month":
          return d.date >= startOfMonth() && d.date <= today;
        case "weekday": {
          const weekday = new Date(d.date + "T00:00:00").getDay();
          return weekday === filter.weekday;
        }
        case "custom":
          return d.date >= filter.startDate && d.date <= filter.endDate;
        default:
          return true;
      }
    });

    if (filtered.length === 0) {
      return {
        points: [],
        totalDeliveries: 0,
        totalValue: 0,
        topAreas: [],
        hasData: false,
      };
    }

    // Agrega em células do grid
    const grid = new Map<
      string,
      { lat: number; lng: number; count: number; totalValue: number }
    >();

    for (const d of filtered) {
      const cellLat = snapToGrid(d.lat!);
      const cellLng = snapToGrid(d.lng!);
      const key = `${cellLat.toFixed(5)},${cellLng.toFixed(5)}`;
      const prev = grid.get(key) ?? {
        lat: cellLat,
        lng: cellLng,
        count: 0,
        totalValue: 0,
      };
      prev.count += 1;
      prev.totalValue += d.value;
      grid.set(key, prev);
    }

    // Converte para array e normaliza intensidade
    const cells = Array.from(grid.values());
    const maxCount = Math.max(...cells.map((c) => c.count), 1);

    const points: HeatmapPoint[] = cells.map((c) => ({
      lat: c.lat,
      lng: c.lng,
      count: c.count,
      totalValue: c.totalValue,
      intensity: c.count / maxCount,
    }));

    // Ordena por contagem para identificar top áreas
    const sorted = [...points].sort((a, b) => b.count - a.count);
    const topAreas = sorted.slice(0, 5).map((p) => ({
      lat: p.lat,
      lng: p.lng,
      count: p.count,
      value: p.totalValue,
    }));

    const totalValue = filtered.reduce((sum, d) => sum + d.value, 0);

    return {
      points,
      totalDeliveries: filtered.length,
      totalValue,
      topAreas,
      hasData: true,
    };
  }, [deliveries, filter]);
}

// Labels para os filtros de período (usado na UI)
export const HEATMAP_FILTER_LABELS: Record<string, string> = {
  all: "Tudo",
  today: "Hoje",
  week: "Esta semana",
  month: "Este mês",
  weekday: "Por dia da semana",
  custom: "Período personalizado",
};

// Labels para os dias da semana
export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
