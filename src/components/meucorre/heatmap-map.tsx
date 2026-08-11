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
import { MapPin, TrendingUp, Calendar, X, Flame, Info } from "lucide-react";
import { formatBRL } from "@/lib/apps";
import { useHeatmap, type HeatmapFilter, HEATMAP_FILTER_LABELS, WEEKDAY_LABELS } from "@/hooks/use-heatmap";
import type { Delivery } from "@/lib/types";

// ===== Componente: HeatmapMap =====
//
// Mostra um mapa de calor das regiões onde o entregador mais fez corridas.
// Usa Leaflet (open-source) com tiles do OpenStreetMap (gratuito, sem API key).
// Camada de calor via leaflet.heat plugin.
//
// Filtros:
// - Tudo / Hoje / Esta semana / Este mês
// - Por dia da semana (identifica áreas quentes em dias específicos)
// - Período personalizado (startDate a endDate)
//
// Também mostra:
// - Lista de top 5 áreas quentes (com contagem e faturamento)
// - Estatísticas agregadas (total de corridas, faturamento total)
// - Instruções de uso
//
// IMPORTANTE: Carrega Leaflet dinamicamente só quando o dialog abre,
// para não pesar o bundle inicial do app.

interface HeatmapMapProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  deliveries: Delivery[];
}

export function HeatmapMap({ open, onOpenChange, deliveries }: HeatmapMapProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [weekday, setWeekday] = useState<number>(1); // segunda por padrão
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Constrói o filtro ativo
  const filter: HeatmapFilter = useMemo(() => {
    switch (filterType) {
      case "today":
        return { type: "today" as const };
      case "week":
        return { type: "week" as const };
      case "month":
        return { type: "month" as const };
      case "weekday":
        return { type: "weekday" as const, weekday };
      case "custom":
        if (!startDate || !endDate) return { type: "all" as const };
        return { type: "custom" as const, startDate, endDate };
      default:
        return { type: "all" as const };
    }
  }, [filterType, weekday, startDate, endDate]);

  const { points, totalDeliveries, totalValue, topAreas, hasData } = useHeatmap(
    deliveries,
    filter,
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
            Veja onde você mais faz corridas e identifique áreas quentes por dia da semana
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-5">
          {/* Filtros */}
          <div className="space-y-3">
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
                      <SelectItem key={idx} value={String(idx)}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground dark:text-zinc-500">
                  Identifique áreas quentes em dias específicos (ex: segundas à noite no centro)
                </p>
              </div>
            )}

            {filterType === "custom" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground dark:text-zinc-400">
                    Data inicial
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground dark:text-zinc-400">
                    Data final
                  </Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Estatísticas */}
          {hasData && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border dark:border-zinc-800 bg-card dark:bg-zinc-900 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground dark:text-zinc-500">
                  Corridas no período
                </p>
                <p className="mt-1 text-xl font-bold text-foreground dark:text-zinc-100">
                  {totalDeliveries}
                </p>
              </div>
              <div className="rounded-lg border border-border dark:border-zinc-800 bg-card dark:bg-zinc-900 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground dark:text-zinc-500">
                  Faturamento total
                </p>
                <p className="mt-1 text-xl font-bold text-emerald-400">
                  {formatBRL(totalValue)}
                </p>
              </div>
            </div>
          )}

          {/* Mapa */}
          <div className="overflow-hidden rounded-xl border border-border dark:border-zinc-800">
            <MapContainer
              points={points}
              hasData={hasData}
            />
          </div>

          {/* Top áreas quentes */}
          {hasData && topAreas.length > 0 && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground/80 dark:text-zinc-300">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Top {topAreas.length} áreas quentes
              </h4>
              <div className="space-y-1.5">
                {topAreas.map((area, idx) => (
                  <div
                    key={`${area.lat}-${area.lng}`}
                    className="flex items-center justify-between rounded-lg border border-border dark:border-zinc-800 bg-card dark:bg-zinc-900 p-2.5"
                  >
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
                    <span className="text-xs font-bold text-emerald-400">
                      {formatBRL(area.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!hasData && (
            <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center">
              <MapPin className="mx-auto mb-2 h-8 w-8 text-zinc-400" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Sem dados de localização ainda
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                Quando você registrar corridas com localização, o mapa de calor vai mostrar
                suas áreas quentes automaticamente.
              </p>
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-500/5 p-2 text-left text-[10px] text-blue-500">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                <span>
                  Dica: inicie uma sessão "Corre do dia" com GPS ligado para capturar
                  sua localização automaticamente durante as corridas.
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== MapContainer =====
//
// Carrega Leaflet dinamicamente (import dinâmico) só quando o dialog abre.
// Usa tiles do OpenStreetMap (gratuito, sem API key).
// Camada de calor via leaflet.heat plugin.
//
// Centraliza o mapa na média das coordenadas dos pontos.
// Ajusta o zoom automaticamente para mostrar todos os pontos.

function MapContainer({
  points,
  hasData,
}: {
  points: { lat: number; lng: number; intensity: number; count: number; totalValue: number }[];
  hasData: boolean;
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

        // Importa Leaflet dinamicamente (só quando necessário)
        const L = (await import("leaflet")).default;

        // Importa o plugin leaflet.heat dinamicamente
        await import("leaflet.heat");

        // Importa o CSS
        // @ts-expect-error — CSS module import (sem declaração de tipo)
        await import("leaflet/dist/leaflet.css");

        if (cancelled || !containerRef.current) return;

        // Limpa mapa anterior se existir
        if (mapInstanceRef.current) {
          (mapInstanceRef.current as { remove: () => void }).remove();
          mapInstanceRef.current = null;
        }

        // ===== Determina o centro do mapa =====
        // Se há pontos de calor, usa a média deles.
        // Se não há pontos, tenta obter a localização atual do usuário.
        // Se não conseguir, usa São Paulo como fallback.
        let centerLat = -23.5505;
        let centerLng = -46.6333;

        if (hasData && points.length > 0) {
          centerLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
          centerLng = points.reduce((s, p) => s + p.lng, 0) / points.length;
        } else {
          // Tenta obter localização atual do usuário (mesmo sem sessão ativa)
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              if (!navigator.geolocation) {
                reject(new Error("GPS não disponível"));
                return;
              }
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                maximumAge: 60000,
                timeout: 5000,
              });
            });
            centerLat = pos.coords.latitude;
            centerLng = pos.coords.longitude;
          } catch {
            // Mantém fallback São Paulo se não conseguir obter localização
          }
        }

        // Cria o mapa
        const map = L.map(containerRef.current, {
          center: [centerLat, centerLng],
          zoom: 13,
          scrollWheelZoom: false,
          attributionControl: true,
        });

        // Adiciona tiles do OpenStreetMap
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        // ===== Adiciona marcador da localização atual do usuário =====
        // Sempre mostra um marcador azul pulsante na localização do usuário
        try {
          const userPos = await new Promise<GeolocationPosition>((resolve, reject) => {
            if (!navigator.geolocation) {
              reject(new Error("GPS não disponível"));
              return;
            }
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              maximumAge: 0,
              timeout: 5000,
            });
          });

          const userMarker = L.circleMarker([userPos.coords.latitude, userPos.coords.longitude], {
            radius: 8,
            fillColor: "#4ADE80",
            color: "#22C55E",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          }).addTo(map);

          userMarker.bindPopup("📍 Sua localização atual");
        } catch {
          // Se não conseguir obter localização, não mostra marcador
        }

        // ===== Adiciona camada de calor (se houver pontos) =====
        if (hasData && points.length > 0) {
          const heatLayer = (L as unknown as {
            heatLayer: (
              latlngs: [number, number, number][],
              options?: {
                radius?: number;
                blur?: number;
                maxZoom?: number;
                max?: number;
                gradient?: Record<number, string>;
              },
            ) => { addTo: (m: unknown) => void };
          }).heatLayer(
            points.map((p) => [p.lat, p.lng, p.intensity] as [number, number, number]),
            {
              radius: 35,
              blur: 25,
              maxZoom: 17,
              max: 1.0,
              gradient: {
                0.0: "blue",
                0.3: "cyan",
                0.5: "lime",
                0.7: "yellow",
                1.0: "red",
              },
            },
          );
          heatLayer.addTo(map);

          // Ajusta bounds para mostrar todos os pontos + localização do usuário
          if (points.length > 1) {
            const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
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
        try {
          (mapInstanceRef.current as { remove: () => void }).remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
    };
  }, [points, hasData]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-muted dark:bg-zinc-900">
        <p className="text-xs text-muted-foreground dark:text-zinc-500">
          Carregando mapa...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center bg-muted dark:bg-zinc-900">
        <p className="text-xs text-red-400">{error}</p>
      </div>
    );
  }

  return <div ref={containerRef} className="h-80 w-full" />;
}
