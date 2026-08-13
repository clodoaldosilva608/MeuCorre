"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Upload,
  Loader2,
  Search,
  Image as ImageIcon,
  Trash2,
  Link2,
  FileImage,
  Layers,
  Grid3x3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { type PromotionAsset } from "@/lib/promotion-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const PAGE_SIZE = 60;

export function AssetsView() {
  const [assets, setAssets] = useState<PromotionAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({ total: 0, withUrl: 0, withoutUrl: 0 });
  const [viewMode, setViewMode] = useState<"grouped" | "all">("grouped");
  const [page, setPage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", "500");
      const res = await fetch(`/api/admin/promotion/assets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets);
        setStats({
          total: data.total,
          withUrl: data.withUrl,
          withoutUrl: data.withoutUrl,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  // Reset page when view mode or search changes
  useEffect(() => {
    setPage(0);
  }, [viewMode, search]);

  // Group assets by baseAssetName for "grouped" view
  const groupedAssets = useMemo(() => {
    const groups = new Map<string, PromotionAsset[]>();
    for (const a of assets) {
      const key = a.baseAssetName || a.name;
      const arr = groups.get(key) ?? [];
      arr.push(a);
      groups.set(key, arr);
    }
    return Array.from(groups.entries()).map(([baseName, items]) => ({
      baseName,
      items,
      preview: items.find((i) => i.publicUrl) ?? items[0],
      count: items.length,
    }));
  }, [assets]);

  // Paginated assets for "all" view
  const paginatedAssets = useMemo(() => {
    const start = page * PAGE_SIZE;
    return assets.slice(start, start + PAGE_SIZE);
  }, [assets, page]);

  // Paginated grouped assets
  const paginatedGroups = useMemo(() => {
    const start = page * PAGE_SIZE;
    return groupedAssets.slice(start, start + PAGE_SIZE);
  }, [groupedAssets, page]);

  const totalItems = viewMode === "grouped" ? groupedAssets.length : assets.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const currentItems = viewMode === "grouped" ? paginatedGroups : paginatedAssets;

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let success = 0;
    let errors = 0;
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);
      formData.append("source", "upload_admin");
      const res = await fetch("/api/admin/promotion/assets/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) success++;
      else errors++;
    }
    setUploading(false);
    if (success > 0) {
      toast.success(`${success} arquivo(s) enviado(s)${errors > 0 ? `, ${errors} falharam` : ""}`);
      load();
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (asset: PromotionAsset) => {
    if (!confirm(`Remover o asset "${asset.name}"? Postagens vinculadas ficarão sem imagem.`))
      return;
    const res = await fetch(`/api/admin/promotion/assets/${asset.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Asset removido");
      load();
    } else {
      toast.error("Erro ao remover");
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats + controles */}
      <div className="space-y-3">
        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-zinc-700 text-zinc-300">
            {viewMode === "grouped"
              ? `${groupedAssets.length} imagens únicas`
              : `${stats.total} assets totais`}
          </Badge>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            {stats.withUrl} com imagem
          </Badge>
          {viewMode === "grouped" && (
            <Badge variant="outline" className="border-zinc-700 text-zinc-500">
              {stats.total} variações (posts)
            </Badge>
          )}
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
            <button
              onClick={() => setViewMode("grouped")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === "grouped"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Layers className="h-3 w-3" />
              <span className="hidden sm:inline">Agrupar por</span>
              <span className="sm:hidden">Grupo</span>
            </button>
            <button
              onClick={() => setViewMode("all")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === "all"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Grid3x3 className="h-3 w-3" />
              <span className="hidden sm:inline">Ver todos</span>
              <span className="sm:hidden">Todos</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          {/* Upload */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
          />
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-8 shrink-0 gap-1.5 text-xs"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Enviar imagens</span>
            <span className="sm:hidden">Enviar</span>
          </Button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando assets...
        </div>
      ) : totalItems === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <ImageIcon className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">Nenhum asset encontrado</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {viewMode === "grouped"
              ? paginatedGroups.map((group) => (
                  <div
                    key={group.baseName}
                    className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
                  >
                    <div className="aspect-square bg-zinc-950">
                      {group.preview.publicUrl ? (
                        <img
                          src={group.preview.publicUrl}
                          alt={group.preview.altText ?? group.baseName}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <FileImage className="h-6 w-6 text-zinc-700" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="truncate text-[10px] font-medium text-zinc-300" title={group.baseName}>
                        {group.baseName}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[9px]">
                          {group.count}x
                        </Badge>
                        {group.preview.publicUrl && (
                          <a
                            href={group.preview.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-600 hover:text-emerald-400"
                          >
                            <Link2 className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              : paginatedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
                  >
                    <div className="aspect-square bg-zinc-950">
                      {asset.publicUrl ? (
                        <img
                          src={asset.publicUrl}
                          alt={asset.altText ?? asset.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <FileImage className="h-6 w-6 text-zinc-700" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="truncate text-[10px] font-medium text-zinc-300" title={asset.name}>
                        {asset.name}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[9px] text-zinc-600">
                          {asset._count?.posts ?? 0} posts
                        </span>
                        <div className="flex items-center gap-1">
                          {asset.publicUrl && (
                            <a
                              href={asset.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-600 hover:text-emerald-400"
                            >
                              <Link2 className="h-3 w-3" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(asset)}
                            className="text-zinc-600 hover:text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="h-7 gap-1 text-xs"
              >
                <ChevronLeft className="h-3 w-3" />
                <span className="hidden sm:inline">Anterior</span>
              </Button>
              <span className="text-xs text-zinc-500">
                {page + 1} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="h-7 gap-1 text-xs"
              >
                <span className="hidden sm:inline">Próxima</span>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
