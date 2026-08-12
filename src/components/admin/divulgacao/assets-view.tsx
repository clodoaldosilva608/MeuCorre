"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Upload,
  Loader2,
  Search,
  Image as ImageIcon,
  Trash2,
  Link2,
  AlertCircle,
  FileImage,
} from "lucide-react";
import { type PromotionAsset } from "@/lib/promotion-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function AssetsView() {
  const [assets, setAssets] = useState<PromotionAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({ total: 0, withUrl: 0, withoutUrl: 0 });
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
    load();
  }, [load]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let success = 0;
    let errors = 0;

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);

      const res = await fetch("/api/admin/promotion/assets/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        success++;
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(`${file.name}: ${err.error ?? "erro"}`);
        errors++;
      }
    }

    setUploading(false);
    if (success > 0) {
      toast.success(
        `${success} arquivo${success === 1 ? "" : "s"} enviado${success === 1 ? "" : "s"}${errors > 0 ? `, ${errors} falharam` : ""}`,
      );
      load();
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (asset: PromotionAsset) => {
    if (
      !confirm(
        `Remover o asset "${asset.name}"? Postagens vinculadas ficarão sem imagem.`,
      )
    )
      return;
    const res = await fetch(`/api/admin/promotion/assets/${asset.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Asset removido");
      load();
    } else {
      toast.error("Erro ao remover");
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho + upload */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="border-zinc-700 text-zinc-300">
            Total: {stats.total}
          </Badge>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            Com imagem: {stats.withUrl}
          </Badge>
          {stats.withoutUrl > 0 && (
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">
              Sem imagem: {stats.withoutUrl}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Buscar asset..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-48 pl-8 text-xs"
            />
          </div>

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
            className="h-8 gap-1.5 text-xs"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Enviar imagens
          </Button>
        </div>
      </div>

      {stats.withoutUrl > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">{stats.withoutUrl} assets sem imagem</p>
            <p className="mt-0.5 text-amber-400/80">
              Estes assets foram criados pela importação do plano 90 dias mas
              ainda não receberam upload da imagem correspondente. Envie as
              imagens com o nome correspondente (ex: <code>M01_D01_P01_Instagram_vendas_ig_feed_1.png</code>).
            </p>
          </div>
        </div>
      )}

      {/* Grid de assets */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando assets...
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <ImageIcon className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">
            Nenhum asset cadastrado
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Faça upload de imagens ou importe o Plano 90 Dias para criar os assets automaticamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
            >
              {/* Preview da imagem */}
              <div className="aspect-square bg-zinc-950">
                {asset.publicUrl ? (
                  <img
                    src={asset.publicUrl}
                    alt={asset.altText ?? asset.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-2 text-center">
                    <FileImage className="mb-1 h-6 w-6 text-zinc-700" />
                    <p className="text-[10px] text-zinc-600">Sem imagem</p>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="truncate text-[10px] font-medium text-zinc-300" title={asset.name}>
                  {asset.name}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[9px] text-zinc-600">
                    {asset._count?.posts ?? 0} posts
                  </span>
                  {asset.publicUrl ? (
                    <a
                      href={asset.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-600 hover:text-emerald-400"
                    >
                      <Link2 className="h-3 w-3" />
                    </a>
                  ) : null}
                  <button
                    onClick={() => handleDelete(asset)}
                    className="text-zinc-600 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
