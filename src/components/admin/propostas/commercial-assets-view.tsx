"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Upload,
  Loader2,
  Search,
  Trash2,
  FileText,
  FileImage,
  FileVideo,
  File as FileIcon,
  ExternalLink,
  Power,
  AlertCircle,
} from "lucide-react";
import {
  ASSET_TYPE_LABELS,
  ASSET_TYPE_COLORS,
  ASSET_TYPE_ICONS,
  formatFileSize,
  formatDate,
  type CommercialAsset,
  type CommercialAssetType,
} from "@/lib/proposal-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const VALID_TYPES: CommercialAssetType[] = [
  "media_kit", "case", "contract", "presentation",
  "one_pager", "pricing_table", "video", "other",
];

function getFileIcon(mimeType: string | undefined) {
  if (!mimeType) return <FileIcon className="h-6 w-6" />;
  if (mimeType.startsWith("image/")) return <FileImage className="h-6 w-6" />;
  if (mimeType.startsWith("video/")) return <FileVideo className="h-6 w-6" />;
  if (mimeType === "application/pdf") return <FileText className="h-6 w-6" />;
  return <FileIcon className="h-6 w-6" />;
}

export function CommercialAssetsView() {
  const [assets, setAssets] = useState<CommercialAsset[]>([]);
  const [byType, setByType] = useState<Array<{ type: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [uploadType, setUploadType] = useState<CommercialAssetType>("media_kit");
  const [uploadVersion, setUploadVersion] = useState("");
  const [uploadTags, setUploadTags] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterType !== "all") params.set("type", filterType);
      params.set("limit", "500");
      const res = await fetch(`/api/admin/commercial-assets?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets);
        setByType(data.byType ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [search, filterType]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let success = 0;
    let errors = 0;

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", uploadType);
      if (uploadVersion) formData.append("version", uploadVersion);
      if (uploadTags) formData.append("tags", uploadTags);

      const res = await fetch("/api/admin/commercial-assets/upload", {
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

  const handleToggleActive = async (asset: CommercialAsset) => {
    const res = await fetch(`/api/admin/commercial-assets/${asset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !asset.active }),
    });
    if (res.ok) {
      toast.success(asset.active ? "Desativado" : "Ativado");
      load();
    }
  };

  const handleDelete = async (asset: CommercialAsset) => {
    if (!confirm(`Remover "${asset.name}"?`)) return;
    const res = await fetch(`/api/admin/commercial-assets/${asset.id}`, {
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
      {/* Estatísticas por tipo */}
      {byType.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-xs">
          <span className="text-zinc-500">Por tipo:</span>
          {byType.map((t) => (
            <Badge key={t.type} variant="outline" className="border-zinc-700 text-[10px]">
              {ASSET_TYPE_ICONS[t.type as CommercialAssetType] ?? "📎"}{" "}
              {ASSET_TYPE_LABELS[t.type as CommercialAssetType] ?? t.type}: {t.count}
            </Badge>
          ))}
        </div>
      )}

      {/* Upload + filtros */}
      <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label className="text-xs">Tipo do material *</Label>
            <Select
              value={uploadType}
              onValueChange={(v) => setUploadType(v as CommercialAssetType)}
            >
              <SelectTrigger className="mt-1 h-8 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VALID_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {ASSET_TYPE_ICONS[t]} {ASSET_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Versão</Label>
            <Input
              value={uploadVersion}
              onChange={(e) => setUploadVersion(e.target.value)}
              placeholder="v1.0"
              className="mt-1 h-8 w-24 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Tags</Label>
            <Input
              value={uploadTags}
              onChange={(e) => setUploadTags(e.target.value)}
              placeholder="recife, premium"
              className="mt-1 h-8 w-40 text-xs"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4,.pptx,.ppt,.docx,.doc"
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
            Enviar materiais
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-40 pl-8 text-xs"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos tipos</SelectItem>
                {VALID_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {ASSET_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded bg-zinc-950 p-2 text-[10px] text-zinc-500">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <p>
            Aceita: PDF, PNG, JPG, WEBP, MP4, PPTX, PPT, DOCX, DOC — máx 50 MB por arquivo.
            Em produção, recomenda-se usar Vercel Blob ou CDN para armazenamento persistente.
          </p>
        </div>
      </div>

      {/* Lista de assets */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando materiais...
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">
            Nenhum material cadastrado
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Faça upload do media kit, cases, contratos, apresentações, etc.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className={`rounded-lg border border-zinc-800 bg-zinc-900 p-3 ${
                !asset.active ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                <div
                  className="grid h-10 w-10 shrink-0 place-items-center rounded"
                  style={{
                    backgroundColor: `${ASSET_TYPE_COLORS[asset.type]}20`,
                    color: ASSET_TYPE_COLORS[asset.type],
                  }}
                >
                  {getFileIcon(asset.mimeType)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-100" title={asset.name}>
                    {asset.name}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-zinc-500">
                    <span style={{ color: ASSET_TYPE_COLORS[asset.type] }}>
                      {ASSET_TYPE_ICONS[asset.type]} {ASSET_TYPE_LABELS[asset.type]}
                    </span>
                    {asset.version && <span>· v{asset.version}</span>}
                    <span>· {formatFileSize(asset.fileSize)}</span>
                  </div>
                </div>
              </div>

              {asset.description && (
                <p className="mt-2 line-clamp-2 text-[10px] text-zinc-500">
                  {asset.description}
                </p>
              )}

              {asset.tags && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {asset.tags.split(",").map((t) => (
                    <Badge key={t} variant="outline" className="border-zinc-700 text-[9px]">
                      {t.trim()}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mt-2 text-[10px] text-zinc-600">
                Atualizado em {formatDate(asset.updatedAt)}
              </div>

              <div className="mt-2 flex items-center gap-1 border-t border-zinc-800 pt-2">
                {asset.publicUrl && (
                  <a
                    href={asset.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Abrir
                  </a>
                )}
                <button
                  onClick={() => handleToggleActive(asset)}
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-zinc-400 hover:bg-zinc-800"
                >
                  <Power className="h-3 w-3" />
                  {asset.active ? "Desativar" : "Ativar"}
                </button>
                <button
                  onClick={() => handleDelete(asset)}
                  className="ml-auto text-zinc-600 hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
