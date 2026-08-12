"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  List,
  Loader2,
  Search,
  Download,
  Eye,
  Filter,
  CheckSquare,
  Square,
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  campaignId: string | null;
  onSelectPost: (post: PromotionPost) => void;
}

export function ListView({ campaignId, onSelectPost }: Props) {
  const [posts, setPosts] = useState<PromotionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPillar, setFilterPillar] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

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

  // Lista única de pilares
  const pillars = useMemo(() => {
    const set = new Set<string>();
    for (const p of posts) if (p.pillar) set.add(p.pillar);
    return Array.from(set).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (filterPlatform !== "all" && p.platform !== filterPlatform) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      if (filterPillar !== "all" && p.pillar !== filterPillar) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.hashtags ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [posts, filterPlatform, filterStatus, filterPillar, search]);

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  const bulkMarkPublished = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const res = await fetch("/api/admin/promotion/posts/bulk-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, updates: { status: "published" } }),
    });
    if (res.ok) {
      const data = await res.json();
      toast.success(`${data.updated} postagen${data.updated === 1 ? "" : "s"} marcada${data.updated === 1 ? "" : "s"} como publicada${data.updated === 1 ? "" : "s"}`);
      setSelected(new Set());
      load();
    } else {
      toast.error("Erro ao atualizar em bulk");
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar por título, descrição ou hashtag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-72 pl-8 text-xs"
          />
        </div>

        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <Filter className="mr-1 h-3 w-3" />
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

        {pillars.length > 0 && (
          <Select value={filterPillar} onValueChange={setFilterPillar}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="Pilar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos pilares</SelectItem>
              {pillars.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="ml-auto flex items-center gap-2 text-xs text-zinc-400">
          <Badge variant="outline" className="border-zinc-700">
            {filtered.length} de {posts.length}
          </Badge>
          {selected.size > 0 && (
            <>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                {selected.size} selecionada{selected.size === 1 ? "" : "s"}
              </Badge>
              <Button
                size="sm"
                onClick={bulkMarkPublished}
                className="h-8 gap-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                Marcar como publicadas
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-950/50 text-zinc-500">
              <tr>
                <th className="w-8 px-3 py-2">
                  <button onClick={selectAll} className="text-zinc-500 hover:text-zinc-300">
                    {selected.size === filtered.length && filtered.length > 0 ? (
                      <CheckSquare className="h-3.5 w-3.5" />
                    ) : (
                      <Square className="h-3.5 w-3.5" />
                    )}
                  </button>
                </th>
                <th className="px-2 py-2 text-left font-medium">Dia</th>
                <th className="px-2 py-2 text-left font-medium">Seq</th>
                <th className="px-2 py-2 text-left font-medium">Plataforma</th>
                <th className="px-2 py-2 text-left font-medium">Horário</th>
                <th className="px-2 py-2 text-left font-medium">Título</th>
                <th className="px-2 py-2 text-left font-medium">Pilar</th>
                <th className="px-2 py-2 text-left font-medium">Status</th>
                <th className="w-8 px-2 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-zinc-500">
                    <List className="mx-auto mb-2 h-8 w-8 text-zinc-700" />
                    Nenhuma postagem encontrada com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filtered.map((post) => (
                  <tr
                    key={post.id}
                    className="cursor-pointer hover:bg-zinc-800/50"
                    onClick={() => onSelectPost(post)}
                  >
                    <td
                      className="px-3 py-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(post.id);
                      }}
                    >
                      {selected.has(post.id) ? (
                        <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-zinc-600" />
                      )}
                    </td>
                    <td className="px-2 py-2 text-zinc-400">{post.editorialDay}</td>
                    <td className="px-2 py-2 text-zinc-400">P{post.sequenceNumber}</td>
                    <td className="px-2 py-2">
                      <span
                        className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                        style={{
                          backgroundColor:
                            PLATFORM_COLORS[post.platform] ?? "#71717a",
                        }}
                      >
                        {post.platform}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-zinc-400">
                      {formatDateTime(post.publishAt)}
                    </td>
                    <td className="max-w-xs px-2 py-2">
                      <p className="truncate text-zinc-200">{post.title}</p>
                    </td>
                    <td className="px-2 py-2 text-zinc-500">{post.pillar ?? "—"}</td>
                    <td className="px-2 py-2">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${STATUS_COLORS[post.status]}20`,
                          color: STATUS_COLORS[post.status],
                        }}
                      >
                        {STATUS_LABELS[post.status]}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <Eye className="h-3.5 w-3.5 text-zinc-600" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
