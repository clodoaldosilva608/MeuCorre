"use client";

import { useMemo } from "react";
import { latLngToCell, cellToLatLng, getResolution } from "h3-js";
import type { Delivery, HeatmapPoint } from "@/lib/types";

// ===== Hook useHeatmap — UPGRADE com Uber H3 =====
//
// Agrega deliveries com coordenadas GPS em hexágonos H3 (indexação espacial).
// Substitui o grid retangular antigo por hexágonos precisos.
//
// Resolução H3:
// - Res 8: ~0.74 km² (bairros) — padrão
// - Res 9: ~0.10 km² (quadras) — mais detalhado
// - Res 7: ~5.16 km² (zonas) — visão ampla
//
// Camadas disponíveis:
// - "count": número de corridas por hexágono
// - "revenue": faturamento total por hexágono
// - "profit": lucro líquido (receita - despesa) por hexágono
//
// Filtros de período mantidos do original.

export type HeatmapFilter =
  | { type: "all" }
  | { type: "today" }
  | { type: "week" }
  | { type: "month" }
  | { type: "weekday"; weekday: number }
  | { type: "custom"; startDate: string; endDate: string };

export type HeatmapLayer = "count" | "revenue" | "profit";

export interface HeatmapCell {
  h3Index: string;
  lat: number;
  lng: number;
  count: number;
  totalValue: number;
  totalExpenses: number;
  netProfit: number;
  intensity: number; // 0-1 normalizado pela camada ativa
  // Borda do hexágono para desenhar no Leaflet
  boundary: [number, number][];
}

export interface UseHeatmapReturn {
  cells: HeatmapCell[];
  points: HeatmapPoint[]; // compatibilidade com UI antiga
  totalDeliveries: number;
  totalValue: number;
  topAreas: { lat: number; lng: number; count: number; value: number }[];
  hasData: boolean;
  resolution: number;
}

// Resolução H3 padrão (8 = ~0.74 km² por hexágono)
const H3_RESOLUTION = 8;

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeek(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return isoDate(d);
}

function startOfMonth(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

// Cor do hexágono baseada na intensidade (0-1)
// Gradiente: azul (frio) → ciano → verde → amarelo → laranja → vermelho (quente)
export function getHeatColor(intensity: number): { fill: string; stroke: string } {
  if (intensity >= 0.8) return { fill: "rgba(239, 68, 68, 0.75)", stroke: "#ef4444" }; // vermelho
  if (intensity >= 0.6) return { fill: "rgba(249, 115, 22, 0.7)", stroke: "#f97316" }; // laranja
  if (intensity >= 0.4) return { fill: "rgba(234, 179, 8, 0.65)", stroke: "#eab308" }; // amarelo
  if (intensity >= 0.2) return { fill: "rgba(34, 197, 94, 0.6)", stroke: "#22c55e" }; // verde
  if (intensity > 0) return { fill: "rgba(59, 130, 246, 0.55)", stroke: "#3b82f6" }; // azul
  return { fill: "rgba(100, 116, 139, 0.3)", stroke: "#64748b" }; // cinza (vazio)
}

export function useHeatmap(
  deliveries: Delivery[],
  filter: HeatmapFilter,
  expenses?: { date: string; value: number; lat?: number; lng?: number }[],
  layer: HeatmapLayer = "count",
): UseHeatmapReturn {
  return useMemo(() => {
    const withCoords = deliveries.filter(
      (d) => typeof d.lat === "number" && typeof d.lng === "number",
    );

    if (withCoords.length === 0) {
      return {
        cells: [],
        points: [],
        totalDeliveries: 0,
        totalValue: 0,
        topAreas: [],
        hasData: false,
        resolution: H3_RESOLUTION,
      };
    }

    // Aplica filtro de período
    const today = isoDate(new Date());
    const filtered = withCoords.filter((d) => {
      switch (filter.type) {
        case "all": return true;
        case "today": return d.date === today;
        case "week": return d.date >= startOfWeek() && d.date <= today;
        case "month": return d.date >= startOfMonth() && d.date <= today;
        case "weekday": {
          const weekday = new Date(d.date + "T00:00:00").getDay();
          return weekday === filter.weekday;
        }
        case "custom":
          return d.date >= filter.startDate && d.date <= filter.endDate;
        default: return true;
      }
    });

    if (filtered.length === 0) {
      return {
        cells: [],
        points: [],
        totalDeliveries: 0,
        totalValue: 0,
        topAreas: [],
        hasData: false,
        resolution: H3_RESOLUTION,
      };
    }

    // Agrega em hexágonos H3
    const hexMap = new Map<
      string,
      { count: number; totalValue: number; totalExpenses: number }
    >();

    for (const d of filtered) {
      const h3Index = latLngToCell(d.lat!, d.lng!, H3_RESOLUTION);
      const prev = hexMap.get(h3Index) ?? { count: 0, totalValue: 0, totalExpenses: 0 };
      prev.count += 1;
      prev.totalValue += d.value;
      hexMap.set(h3Index, prev);
    }

    // Se houver despesas com coordenadas, agrega por hexágono também
    if (expenses && layer === "profit") {
      for (const e of expenses) {
        if (typeof e.lat !== "number" || typeof e.lng !== "number") continue;
        // Aplica mesmo filtro de período
        let inPeriod = false;
        switch (filter.type) {
          case "all": inPeriod = true; break;
          case "today": inPeriod = e.date === today; break;
          case "week": inPeriod = e.date >= startOfWeek() && e.date <= today; break;
          case "month": inPeriod = e.date >= startOfMonth() && e.date <= today; break;
          case "weekday": {
            const wd = new Date(e.date + "T00:00:00").getDay();
            inPeriod = wd === filter.weekday;
            break;
          }
          case "custom": inPeriod = e.date >= filter.startDate && e.date <= filter.endDate; break;
        }
        if (!inPeriod) continue;
        const h3Index = latLngToCell(e.lat, e.lng, H3_RESOLUTION);
        const prev = hexMap.get(h3Index) ?? { count: 0, totalValue: 0, totalExpenses: 0 };
        prev.totalExpenses += e.value;
        hexMap.set(h3Index, prev);
      }
    }

    // Converte para array de células
    const cells: HeatmapCell[] = [];
    for (const [h3Index, data] of hexMap) {
      const [lat, lng] = cellToLatLng(h3Index);
      const netProfit = data.totalValue - data.totalExpenses;

      // Valor da camada ativa para normalização
      let layerValue = data.count;
      if (layer === "revenue") layerValue = data.totalValue;
      else if (layer === "profit") layerValue = netProfit;

      cells.push({
        h3Index,
        lat,
        lng,
        count: data.count,
        totalValue: data.totalValue,
        totalExpenses: data.totalExpenses,
        netProfit,
        intensity: 0, // calculado abaixo
        boundary: [], // preenchido abaixo
      });
    }

    // Normaliza intensidade pela camada ativa
    const maxLayerValue = Math.max(
      ...cells.map((c) => {
        if (layer === "revenue") return c.totalValue;
        if (layer === "profit") return Math.max(0, c.netProfit);
        return c.count;
      }),
      1,
    );

    for (const c of cells) {
      let val = c.count;
      if (layer === "revenue") val = c.totalValue;
      else if (layer === "profit") val = Math.max(0, c.netProfit);
      c.intensity = Math.min(1, val / maxLayerValue);
    }

    // Compatibilidade com UI antiga (points)
    const points: HeatmapPoint[] = cells.map((c) => ({
      lat: c.lat,
      lng: c.lng,
      count: c.count,
      totalValue: c.totalValue,
      intensity: c.intensity,
    }));

    // Top áreas por contagem
    const sorted = [...cells].sort((a, b) => b.count - a.count);
    const topAreas = sorted.slice(0, 5).map((c) => ({
      lat: c.lat,
      lng: c.lng,
      count: c.count,
      value: c.totalValue,
    }));

    const totalValue = filtered.reduce((sum, d) => sum + d.value, 0);

    return {
      cells,
      points,
      totalDeliveries: filtered.length,
      totalValue,
      topAreas,
      hasData: true,
      resolution: H3_RESOLUTION,
    };
  }, [deliveries, filter, expenses, layer]);
}

export const HEATMAP_FILTER_LABELS: Record<string, string> = {
  all: "Tudo",
  today: "Hoje",
  week: "Esta semana",
  month: "Este mês",
  weekday: "Por dia da semana",
  custom: "Período personalizado",
};

export const WEEKDAY_LABELS = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];

export const HEATMAP_LAYER_LABELS: Record<HeatmapLayer, string> = {
  count: "Número de corridas",
  revenue: "Faturamento",
  profit: "Lucro líquido",
};
