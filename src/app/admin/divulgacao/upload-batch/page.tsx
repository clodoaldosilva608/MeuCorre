"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Loader2,
  Check,
  X,
  AlertCircle,
  FolderOpen,
  Image as ImageIcon,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UploadResult {
  fileName: string;
  status: "success" | "error" | "skipped";
  error?: string;
  publicUrl?: string;
}

export default function UploadBatchPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verifica auth
  useEffect(() => {
    fetch("/api/admin/ads", { method: "GET" })
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const valid = Array.from(selectedFiles).filter((f) =>
      /\.(png|jpg|jpeg|webp|gif)$/i.test(f.name),
    );
    setFiles(valid);
    setResults([]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setResults([]);
    const allResults: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      setCurrentIdx(i);
      const file = files[i];

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", file.name);
        formData.append("source", "upload_admin");

        const res = await fetch("/api/admin/promotion/assets/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          allResults.push({
            fileName: file.name,
            status: "success",
            publicUrl: data.publicUrl,
          });
        } else {
          const err = await res.json().catch(() => ({}));
          allResults.push({
            fileName: file.name,
            status: "error",
            error: err.error ?? `HTTP ${res.status}`,
          });
        }
      } catch (err) {
        allResults.push({
          fileName: file.name,
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }

      // Atualiza resultados a cada 5 arquivos ou no último
      if (i % 5 === 0 || i === files.length - 1) {
        setResults([...allResults]);
      }
    }

    setResults(allResults);
    setCurrentIdx(-1);
    setUploading(false);
  };

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  if (authed === null) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Verificando acesso...
      </div>
    );
  }

  if (authed === false) {
    router.push("/admin/login");
    return null;
  }

  const progress = files.length > 0 && currentIdx >= 0
    ? Math.round(((currentIdx + 1) / files.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/divulgacao")}
            className="mb-2 gap-1.5 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para Divulgação
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <Upload className="h-6 w-6 text-emerald-400" />
            Upload em Lote
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Envie todas as imagens do pacote visual de uma vez. Elas serão vinculadas às 450 postagens automaticamente pelo nome do arquivo.
          </p>
        </div>
      </div>

      {/* Aviso */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-xs text-blue-300">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">Como usar</p>
          <ol className="mt-1 list-inside list-decimal space-y-0.5 text-blue-400/80">
            <li>Clique em "Selecionar pasta" e escolha a pasta <code className="rounded bg-zinc-900 px-1 text-blue-300">pacote-visual</code></li>
            <li>Ou arraste os arquivos direto para a área abaixo</li>
            <li>Clique em "Iniciar upload" e aguarde — não feche a página</li>
            <li>Máximo 10 MB por arquivo · Formatos: PNG, JPG, WEBP, GIF</li>
          </ol>
        </div>
      </div>

      {/* Drop zone */}
      {!uploading && results.length === 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
            dragOver
              ? "border-emerald-500 bg-emerald-500/5"
              : "border-zinc-700 bg-zinc-900"
          }`}
        >
          <FolderOpen className="mx-auto mb-3 h-12 w-12 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">
            Arraste os arquivos aqui
          </p>
          <p className="mt-1 text-xs text-zinc-500">ou</p>
          <div className="mt-3 flex justify-center gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5"
            >
              <FolderOpen className="h-4 w-4" />
              Selecionar pasta
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            // @ts-expect-error webkitdirectory não é padrão TS
            webkitdirectory=""
            directory=""
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* Lista de arquivos selecionados */}
      {files.length > 0 && results.length === 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-100">
                {files.length} arquivo(s) selecionado(s)
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFiles([]);
                  setCurrentIdx(-1);
                }}
                disabled={uploading}
                className="text-xs"
              >
                Limpar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                size="sm"
                className="gap-1.5 text-xs"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Iniciar upload
              </Button>
            </div>
          </div>

          {/* Barra de progresso */}
          {uploading && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>
                  Enviando {currentIdx + 1} de {files.length}...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 truncate text-[10px] text-zinc-500">
                {files[currentIdx]?.name}
              </p>
            </div>
          )}

          {/* Preview dos primeiros arquivos */}
          <div className="max-h-48 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
              {files.slice(0, 30).map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-[10px]"
                >
                  <ImageIcon className="h-2.5 w-2.5 shrink-0 text-zinc-600" />
                  <span className="truncate text-zinc-400">{f.name}</span>
                </div>
              ))}
              {files.length > 30 && (
                <div className="px-2 py-1 text-[10px] text-zinc-500">
                  +{files.length - 30} outros...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resultados */}
      {results.length > 0 && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-center">
              <Check className="mx-auto mb-1 h-5 w-5 text-emerald-400" />
              <p className="text-2xl font-bold text-emerald-400">{successCount}</p>
              <p className="text-[10px] text-zinc-500">Sucesso</p>
            </div>
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-center">
              <X className="mx-auto mb-1 h-5 w-5 text-red-400" />
              <p className="text-2xl font-bold text-red-400">{errorCount}</p>
              <p className="text-[10px] text-zinc-500">Falha</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-center">
              <ImageIcon className="mx-auto mb-1 h-5 w-5 text-zinc-400" />
              <p className="text-2xl font-bold text-zinc-200">{results.length}</p>
              <p className="text-[10px] text-zinc-500">Total</p>
            </div>
          </div>

          {/* Lista de resultados */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300">Detalhes</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFiles([]);
                  setResults([]);
                  setCurrentIdx(-1);
                }}
                className="h-7 gap-1 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
                Novo upload
              </Button>
            </div>
            <div className="max-h-64 space-y-0.5 overflow-y-auto">
              {results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded px-2 py-1 text-xs"
                >
                  {r.status === "success" ? (
                    <Check className="h-3 w-3 shrink-0 text-emerald-400" />
                  ) : (
                    <X className="h-3 w-3 shrink-0 text-red-400" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-zinc-300">
                    {r.fileName}
                  </span>
                  {r.error && (
                    <span className="shrink-0 text-[10px] text-red-400">
                      {r.error}
                    </span>
                  )}
                  {r.publicUrl && (
                    <a
                      href={r.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-[10px] text-emerald-400 hover:underline"
                    >
                      ver
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Próximos passos */}
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/divulgacao")}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Ir para Divulgação
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
