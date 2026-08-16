"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, TrendingUp, Calendar, X, Flame, Info, Layers } from "lucide-react";
import { formatBRL } from "@/lib/apps";
import {
  useHeatmap,
  getHeatColor,
  type HeatmapFilter,
  type HeatmapLayer,
  HEATMAP_FILTER_LABELS,
  HEATMAP_LAYER_LABELS,
  WEEKDAY_LABELS,
  type HeatmapCell,
} from "@/hooks/use-heatmap";
import type { Delivery } from "@/lib/types";
import { cellToBoundary } from "h3-js";

// ===== HeatmapMap — UPGRADE com H3 Hexagonal =====
//
// Substitui a camada leaflet.heat (blobs difusos) por hexágonos H3
// coloridos sobre o mapa. Cada hexágono representa uma zona com:
// - Cor baseada na intensidade (azul → verde → amarelo → vermelho)
// - Tooltip ao clicar com detalhes (corridas, faturamento, lucro)
// - Filtros de camada: contagem, faturamento, lucro líquido
//
// Mantém todos os filtros de período originais.

interface HeatmapMapProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  deliveries: Delivery[];
}

export function HeatmapMap({ open, onOpenChange, deliveries }: HeatmapMapProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [weekday, setWeekday] = useState<number>(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [layer, setLayer] = useState<HeatmapLayer>("count");

  const filter: HeatmapFilter = useMemo(() => {
    switch (filterType) {
      case "today": return { type: "today" as const };
      case "week": return { type: "week" as const };
      case "month": return { type: "month" as const };
      case "weekday": return { type: "weekday" as const, weekday };
      case "custom":
        if (!startDate || !endDate) return { type: "all" as const };
        return { type: "custom" as const, startDate, endDate };
      default: return { type: "all" as const };
    }
  }, [filterType, weekday, startDate, endDate]);

  const { cells, totalDeliveries, totalValue, topAreas, hasData } = useHeatmap(
    deliveries,
    filter,
    undefined,
    layer,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] max-w-2xl gap-0 overflow-y-auto border-border dark:border-zinc-800 bg-background dark:bg-zinc-950 p-0 text-foreground dark:text-zinc-100">
        <DialogHeader className="border-b border-border dark:border-zinc-800 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
            <Flame className="h-4 w-4" />
            Mapa de calor — áreas quentes
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground dark:text-zinc-500">
            Hexágonos H3 mostrando zonas de alta atividade. Clique em um hexágono para ver detalhes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-5">
          {/* Filtro de camada */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1 text-xs text-muted-foreground dark:text-zinc-400">
              <Layers className="h-3 w-3" />
              Camada
            </Label>
            <Select value={layer} onValueChange={(v) => setLayer(v as HeatmapLayer)}>
              <SelectTrigger className="w-full border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="count">Número de corridas</SelectItem>
                <SelectItem value="revenue">Faturamento (R$)</SelectItem>
                <SelectItem value="profit">Lucro líquido (R$)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtros de período */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1 text-xs text-muted-foreground dark:text-zinc-400">
              <Calendar className="h-3 w-3" />
              Período
            </Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tudo (histórico completo)</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="weekday">Por dia da semana</SelectItem>
                <SelectItem value="custom">Período personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filterType === "weekday" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground dark:text-zinc-400">
                Dia da semana
              </Label>
              <Select value={String(weekday)} onValueChange={(v) => setWeekday(Number(v))}>
                <SelectTrigger className="w-full border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAY_LABELS.map((label, idx) => (
                    <SelectItem key={idx} value={String(idx)}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filterType === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground dark:text-zinc-400">Data inicial</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground dark:text-zinc-400">Data final</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900" />
              </div>
            </div>
          )}

          {/* Estatísticas */}
          {hasData && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border dark:border-zinc-800 bg-card dark:bg-zinc-900 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground dark:text-zinc-500">
                  Corridas no período
                </p>
                <p className="mt-1 text-xl font-bold text-foreground dark:text-zinc-100">{totalDeliveries}</p>
              </div>
              <div className="rounded-lg border border-border dark:border-zinc-800 bg-card dark:bg-zinc-900 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground dark:text-zinc-500">
                  Faturamento total
                </p>
                <p className="mt-1 text-xl font-bold text-emerald-400">{formatBRL(totalValue)}</p>
              </div>
            </div>
          )}

          {/* Mapa com hexágonos */}
          <div className="overflow-hidden rounded-xl border border-border dark:border-zinc-800">
            <HexMapContainer cells={cells} hasData={hasData} layer={layer} />
          </div>

          {/* Legenda de cores */}
          {hasData && (
            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground dark:text-zinc-500">
              <span>Frio</span>
              <div className="flex h-3 w-32 rounded-full overflow-hidden">
                <div className="flex-1 bg-blue-500/60" />
                <div className="flex-1 bg-green-500/60" />
                <div className="flex-1 bg-yellow-500/60" />
                <div className="flex-1 bg-orange-500/60" />
                <div className="flex-1 bg-red-500/60" />
              </div>
              <span>Quente</span>
            </div>
          )}

          {/* Top áreas */}
          {hasData && topAreas.length > 0 && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground/80 dark:text-zinc-300">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Top {topAreas.length} áreas quentes
              </h4>
              <div className="space-y-1.5">
                {topAreas.map((area, idx) => (
                  <div key={`${area.lat}-${area.lng}`}
                    className="flex items-center justify-between rounded-lg border border-border dark:border-zinc-800 bg-card dark:bg-zinc-900 p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-[11px] font-bold text-emerald-400">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-foreground dark:text-zinc-100">
                          {area.count} {area.count === 1 ? "corrida" : "corridas"}
                        </p>
                        <p className="text-[10px] text-muted-foreground dark:text-zinc-500">
                          {area.lat.toFixed(4)}, {area.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">{formatBRL(area.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasData && (
            <div className="flex items-start gap-2 rounded-lg bg-blue-500/5 p-3 text-left text-[11px] text-blue-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                O mapa mostra sua localização atual. Para ver áreas quentes,
                inicie uma sessão "Corre do dia" com GPS ligado para capturar
                sua localização automaticamente durante as corridas.
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== HexMapContainer =====
//
// Renderiza hexágonos H3 coloridos sobre o mapa Leaflet.
// Cada hexágono é um polígono com preenchimento baseado na intensidade.

function HexMapContainer({
  cells,
  hasData,
  layer,
}: {
  cells: HeatmapCell[];
  hasData: boolean;
  layer: HeatmapLayer;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMap() {
      try {
        setLoading(true);
        setError(null);

        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");

        if (cancelled || !containerRef.current) return;

        if (mapInstanceRef.current) {
          (mapInstanceRef.current as { remove: () => void }).remove();
          mapInstanceRef.current = null;
        }

        // Centro do mapa
        let centerLat = -23.5505;
        let centerLng = -46.6333;

        if (hasData && cells.length > 0) {
          centerLat = cells.reduce((s, c) => s + c.lat, 0) / cells.length;
          centerLng = cells.reduce((s, c) => s + c.lng, 0) / cells.length;
        }

        // Tenta obter localização do usuário
        let userLocation: { lat: number; lng: number } | null = null;
        if (navigator.geolocation) {
          try {
            userLocation = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
              const timeout = setTimeout(() => resolve(null), 3000);
              navigator.geolocation.getCurrentPosition(
                (pos) => { clearTimeout(timeout); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
                () => { clearTimeout(timeout); resolve(null); },
                { enableHighAccuracy: true, timeout: 3000, maximumAge: 60000 },
              );
            });
          } catch { userLocation = null; }
        }

        if (userLocation) {
          centerLat = userLocation.lat;
          centerLng = userLocation.lng;
        }

        const map = L.map(containerRef.current, {
          center: [centerLat, centerLng],
          zoom: 14,
          scrollWheelZoom: false,
          attributionControl: true,
        });

        // Tiles escuros (CartoDB Dark Matter — gratuito, sem API key)
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
          subdomains: "abcd",
        }).addTo(map);

        // Marcador da localização atual
        if (userLocation) {
          const userMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
            radius: 8,
            fillColor: "#4ADE80",
            color: "#22C55E",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          }).addTo(map);
          userMarker.bindPopup("📍 Sua localização atual");
        }

        // ===== Desenha hexágonos H3 =====
        if (hasData && cells.length > 0) {
          const allBounds: [number, number][] = [];

          for (const cell of cells) {
            // Obtém a borda do hexágono H3
            const boundary = cellToBoundary(cell.h3Index, true) as [number, number][];

            if (boundary.length < 3) continue;

            const color = getHeatColor(cell.intensity);

            // Valor para exibir no popup
            let popupValue = `${cell.count} corrida(s)`;
            let popupExtra = `Faturamento: ${formatBRL(cell.totalValue)}`;
            if (layer === "revenue") {
              popupValue = formatBRL(cell.totalValue);
              popupExtra = `${cell.count} corrida(s)`;
            } else if (layer === "profit") {
              popupValue = `Lucro: ${formatBRL(cell.netProfit)}`;
              popupExtra = `${cell.count} corrida(s) | Receita: ${formatBRL(cell.totalValue)}`;
            }

            const polygon = L.polygon(boundary, {
              color: color.stroke,
              weight: 1.5,
              opacity: 0.8,
              fillColor: color.fill,
              fillOpacity: 0.6,
            }).addTo(map);

            polygon.bindPopup(
              `<div style="font-family: sans-serif; padding: 4px;">
                <div style="font-weight: bold; font-size: 14px; color: ${color.stroke};">${popupValue}</div>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">${popupExtra}</div>
                <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${cell.lat.toFixed(4)}, ${cell.lng.toFixed(4)}</div>
              </div>`,
            );

            allBounds.push(...boundary);
          }

          // Ajusta zoom para mostrar todos os hexágonos
          if (allBounds.length > 1) {
            const bounds = L.latLngBounds(allBounds);
            map.fitBounds(bounds, { padding: [30, 30] });
          }
        }

        mapInstanceRef.current = map;
        setLoading(false);
      } catch (err) {
        console.error("[HeatmapMap] Erro ao carregar Leaflet:", err);
        setError("Não foi possível carregar o mapa. Verifique sua conexão.");
        setLoading(false);
      }
    }

    loadMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        try { (mapInstanceRef.current as { remove: () => void }).remove(); } catch { /* ignore */ }
        mapInstanceRef.current = null;
      }
    };
  }, [cells, hasData, layer]);

  return (
    <div className="relative h-80 w-full">
      <div ref={containerRef} className="h-80 w-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted dark:bg-zinc-900">
          <p className="text-xs text-muted-foreground dark:text-zinc-500">Carregando mapa...</p>
        </div>
      )}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted dark:bg-zinc-900">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
