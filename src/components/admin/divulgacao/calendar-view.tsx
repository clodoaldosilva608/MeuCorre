"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  Download,
  Eye,
} from "lucide-react";
import {
  PLATFORMS,
  PLATFORM_COLORS,
  STATUS_COLORS,
  STATUS_LABELS,
  formatDateTime,
  type PromotionPost,
} from "@/lib/promotion-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  campaignId: string | null;
  onSelectPost: (post: PromotionPost) => void;
}

export function CalendarView({ campaignId, onSelectPost }: Props) {
  const [posts, setPosts] = useState<PromotionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  // Dia selecionado (1-90). Default: hoje se dentro do range, senão 1.
  const [selectedDay, setSelectedDay] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (campaignId) params.set("campaignId", campaignId);
      params.set("limit", "500");
      const res = await fetch(`/api/admin/promotion/posts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (filterPlatform !== "all" && p.platform !== filterPlatform) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      return true;
    });
  }, [posts, filterPlatform, filterStatus]);

  // Agrupa por editorialDay
  const postsByDay = useMemo(() => {
    const map = new Map<number, PromotionPost[]>();
    for (const p of filteredPosts) {
      const arr = map.get(p.editorialDay) ?? [];
      arr.push(p);
      map.set(p.editorialDay, arr);
    }
    return map;
  }, [filteredPosts]);

  // Dia atual selecionado
  const currentDayPosts = postsByDay.get(selectedDay) ?? [];

  // Estatísticas
  const stats = useMemo(() => {
    const total = filteredPosts.length;
    const published = filteredPosts.filter((p) => p.status === "published").length;
    const pending = filteredPosts.filter((p) => p.status === "pending").length;
    const skipped = filteredPosts.filter((p) => p.status === "skipped").length;
    return { total, published, pending, skipped };
  }, [filteredPosts]);

  const downloadICS = async () => {
    const params = new URLSearchParams();
    if (campaignId) params.set("campaignId", campaignId);
    if (filterPlatform !== "all") params.set("platform", filterPlatform);
    if (filterStatus !== "all") params.set("status", filterStatus);
    window.open(`/api/admin/promotion/calendar.ics?${params}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando postagens...
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <Calendar className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
        <p className="text-sm font-medium text-zinc-300">
          Nenhuma postagem encontrada
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {campaignId
            ? "Esta campanha ainda não tem postagens. Use a aba Campanhas para importar o Plano 90 Dias."
            : "Selecione uma campanha na aba Campanhas."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estatísticas + Filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <div className="flex items-center gap-3 text-xs">
          <Badge variant="outline" className="border-zinc-700 text-zinc-300">
            Total: {stats.total}
          </Badge>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            Publicadas: {stats.published}
          </Badge>
          <Badge className="bg-zinc-700/50 text-zinc-300">
            Pendentes: {stats.pending}
          </Badge>
          {stats.skipped > 0 && (
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">
              Puladas: {stats.skipped}
            </Badge>
          )}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-zinc-500" />
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Plataforma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas plataformas</SelectItem>
              {PLATFORMS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="published">Publicada</SelectItem>
              <SelectItem value="skipped">Pulada</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="outline"
            onClick={downloadICS}
            className="h-8 gap-1.5 border-zinc-700 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            ICS
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Lista de dias (1-90) */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
            <span className="text-xs font-semibold text-zinc-300">
              Dias editoriais
            </span>
            <span className="text-xs text-zinc-500">1-90</span>
          </div>
          <div className="grid max-h-[480px] grid-cols-6 gap-1 overflow-y-auto p-2 sm:grid-cols-8 lg:grid-cols-6">
            {Array.from({ length: 90 }, (_, i) => i + 1).map((day) => {
              const dayPosts = postsByDay.get(day) ?? [];
              const hasPublished = dayPosts.some((p) => p.status === "published");
              const hasPending = dayPosts.some((p) => p.status === "pending");
              const isSelected = day === selectedDay;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`relative aspect-square rounded-md border text-[10px] font-medium transition-colors ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                      : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900"
                  }`}
                  title={`Dia ${day} — ${dayPosts.length} posts`}
                >
                  {day}
                  {dayPosts.length > 0 && (
                    <span
                      className={`absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full ${
                        hasPublished
                          ? "bg-emerald-500"
                          : hasPending
                            ? "bg-amber-500"
                            : "bg-zinc-600"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detalhe do dia selecionado */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Dia editorial {selectedDay}
              </h3>
              <p className="text-xs text-zinc-500">
                {currentDayPosts.length} postagen{currentDayPosts.length === 1 ? "" : "s"} programada{currentDayPosts.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedDay((d) => Math.max(1, d - 1))}
                disabled={selectedDay === 1}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedDay((d) => Math.min(90, d + 1))}
                disabled={selectedDay === 90}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 p-3">
            {currentDayPosts.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                Nenhuma postagem neste dia com os filtros atuais.
              </div>
            ) : (
              currentDayPosts
                .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
                .map((post) => (
                  <button
                    key={post.id}
                    onClick={() => onSelectPost(post)}
                    className="group flex w-full items-start gap-3 rounded-md border border-zinc-800 bg-zinc-950 p-3 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                  >
                    <div
                      className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded text-[10px] font-bold text-white"
                      style={{
                        backgroundColor:
                          PLATFORM_COLORS[post.platform] ?? "#71717a",
                      }}
                    >
                      {post.platform.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-200">
                          P{post.sequenceNumber} · {formatDateTime(post.publishAt)}
                        </span>
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: `${STATUS_COLORS[post.status]}20`,
                            color: STATUS_COLORS[post.status],
                          }}
                        >
                          {STATUS_LABELS[post.status]}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-zinc-400 group-hover:text-zinc-300">
                        {post.title}
                      </p>
                      {post.pillar && (
                        <p className="mt-0.5 text-[10px] text-zinc-600">
                          Pilar: {post.pillar}
                        </p>
                      )}
                    </div>
                    <Eye className="h-4 w-4 shrink-0 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
