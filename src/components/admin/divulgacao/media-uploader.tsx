"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  Plus,
  AlertCircle,
} from "lucide-react";
import type { PromotionAsset } from "@/lib/promotion-types";

// ===== Componente de upload de múltiplas mídias =====
//
// Permite fazer upload de 1+ imagens via drag&drop ou clique.
// Usa a rota /api/admin/promotion/assets/upload (multipart/form-data).
// Retorna os assets criados via onChange callback.

interface Props {
  onAssetsChange: (assets: PromotionAsset[]) => void;
  initialAssets?: PromotionAsset[];
  maxFiles?: number;
}

interface UploadItem {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  asset?: PromotionAsset;
  error?: string;
  previewUrl?: string;
}

export function MediaUploader({
  onAssetsChange,
  initialAssets = [],
  maxFiles = 10,
}: Props) {
  const [items, setItems] = useState<UploadItem[]>(
    initialAssets.map((asset) => ({
      file: new File([], asset.name), // placeholder
      status: "done" as const,
      asset,
      previewUrl: asset.publicUrl ?? undefined,
    })),
  );
  const [dragging, setDragging] = useState(false);
  const [supabaseDisabled, setSupabaseDisabled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const notifyChange = useCallback(
    (newItems: UploadItem[]) => {
      const assets = newItems
        .filter((i) => i.status === "done" && i.asset)
        .map((i) => i.asset!) as PromotionAsset[];
      onAssetsChange(assets);
    },
    [onAssetsChange],
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArr = Array.from(files);
      if (fileArr.length === 0) return;

      // Verifica limite
      const currentDone = items.filter((i) => i.status === "done").length;
      if (currentDone + fileArr.length > maxFiles) {
        toast.error(`Máximo de ${maxFiles} imagens por post`);
        return;
      }

      // Cria preview URLs e adiciona à lista
      const newItems: UploadItem[] = fileArr.map((file) => ({
        file,
        status: "pending" as const,
        previewUrl: URL.createObjectURL(file),
      }));

      const allItems = [...items, ...newItems];
      setItems(allItems);

      // Upload um por um
      for (let i = items.length; i < allItems.length; i++) {
        const item = allItems[i];

        // Atualiza status pra uploading
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i ? { ...it, status: "uploading" } : it,
          ),
        );

        try {
          const formData = new FormData();
          formData.append("file", item.file);
          formData.append("source", "upload_admin");

          const res = await fetch("/api/admin/promotion/assets/upload", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          if (!res.ok) {
            if (data.needsConfig) {
              setSupabaseDisabled(true);
              setItems((prev) =>
                prev.map((it, idx) =>
                  idx === i
                    ? {
                        ...it,
                        status: "error",
                        error: "Supabase não configurado",
                      }
                    : it,
                ),
              );
              toast.error("Upload desabilitado", {
                description:
                  "Configure Supabase Storage nas variáveis de ambiente",
              });
              return; // para de tentar os próximos
            }
            throw new Error(data.error || "Erro no upload");
          }

          // Sucesso
          setItems((prev) => {
            const updated = prev.map((it, idx) =>
              idx === i
                ? { ...it, status: "done" as const, asset: data.asset }
                : it,
            );
            notifyChange(updated);
            return updated;
          });
        } catch (e: unknown) {
          const err = e as Error;
          setItems((prev) =>
            prev.map((it, idx) =>
              idx === i ? { ...it, status: "error", error: err.message } : it,
            ),
          );
          toast.error(`Erro ao enviar ${item.file.name}: ${err.message}`);
        }
      }
    },
    [items, maxFiles, notifyChange],
  );

  const handleRemove = (idx: number) => {
    setItems((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      notifyChange(updated);
      // Revoga URL de preview
      const item = prev[idx];
      if (item.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return updated;
    });
  };

  const handleRetry = (idx: number) => {
    const item = items[idx];
    if (!item || !item.file) return;
    // Re-dispara o upload só desse item
    handleFiles([item.file]);
  };

  if (supabaseDisabled) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="flex-1 text-xs text-zinc-300">
            <p className="font-bold text-amber-400">Upload desabilitado</p>
            <p className="mt-1 text-zinc-400">
              Configure as variáveis de ambiente{" "}
              <code className="rounded bg-zinc-800 px-1 text-emerald-400">
                NEXT_PUBLIC_SUPABASE_URL
              </code>{" "}
              e{" "}
              <code className="rounded bg-zinc-800 px-1 text-emerald-400">
                SUPABASE_SERVICE_ROLE_KEY
              </code>{" "}
              na Vercel para habilitar o upload de imagens.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition ${
          dragging
            ? "border-emerald-500 bg-emerald-500/10"
            : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            // Reset pra permitir selecionar o mesmo arquivo novamente
            e.target.value = "";
          }}
        />
        <Upload className="mb-2 h-6 w-6 text-zinc-500" />
        <p className="text-xs font-medium text-zinc-300">
          Arraste imagens aqui ou clique para selecionar
        </p>
        <p className="mt-1 text-[10px] text-zinc-500">
          PNG, JPG, WebP, GIF · máx 10MB · até {maxFiles} imagens
        </p>
      </div>

      {/* Preview das imagens */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
            >
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={item.file?.name ?? `Imagem ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center">
                  <ImageIcon className="h-6 w-6 text-zinc-600" />
                </div>
              )}

              {/* Overlay de status */}
              {item.status === "uploading" && (
                <div className="absolute inset-0 grid place-items-center bg-black/60">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                </div>
              )}
              {item.status === "error" && (
                <div className="absolute inset-0 grid place-items-center bg-red-950/80 p-1 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRetry(idx);
                    }}
                    className="text-[9px] font-bold text-red-300 hover:text-red-200"
                  >
                    Erro. Toque para retry
                  </button>
                </div>
              )}

              {/* Botão remover */}
              {item.status === "done" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(idx);
                  }}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                  title="Remover"
                >
                  <X className="h-3 w-3" />
                </button>
              )}

              {/* Nome do arquivo (truncado) */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                <p className="truncate text-[9px] text-zinc-300">
                  {item.file?.name ?? item.asset?.name ?? `Imagem ${idx + 1}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
