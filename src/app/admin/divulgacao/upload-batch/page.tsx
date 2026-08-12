"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Loader2,
  Check,
  X,
  AlertCircle,
  Image as ImageIcon,
  RefreshCw,
  ArrowLeft,
  FileArchive,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { extractTarGz, type ExtractedFile } from "@/lib/tar-gz-parser";

interface UploadResult {
  fileName: string;
  status: "success" | "error" | "skipped";
  error?: string;
  publicUrl?: string;
}

type Phase = "select" | "extracting" | "uploading" | "done";

export default function UploadBatchPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>("select");
  const [extractedFiles, setExtractedFiles] = useState<ExtractedFile[]>([]);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [extractProgress, setExtractProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const archiveInputRef = useRef<HTMLInputElement>(null);

  // Verifica auth
  useEffect(() => {
    fetch("/api/admin/ads", { method: "GET" })
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  // Processa arquivo .tar.gz ou múltiplas imagens
  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setError(null);

    // Se é um único arquivo .tar.gz ou .tar
    if (selectedFiles.length === 1) {
      const file = selectedFiles[0];
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith(".tar.gz") || lowerName.endsWith(".tgz") || lowerName.endsWith(".tar")) {
        await handleArchive(file);
        return;
      }
    }

    // Múltiplas imagens
    const valid = Array.from(selectedFiles).filter((f) =>
      /\.(png|jpg|jpeg|webp|gif)$/i.test(f.name),
    );
    if (valid.length === 0) {
      setError("Nenhum arquivo de imagem válido encontrado. Use PNG, JPG, WEBP ou GIF.");
      return;
    }

    const extracted: ExtractedFile[] = valid.map((f) => ({
      name: f.name,
      blob: f,
      size: f.size,
    }));
    setExtractedFiles(extracted);
    setPhase("uploading");
  };

  // Processa arquivo .tar.gz
  const handleArchive = async (file: File) => {
    setPhase("extracting");
    setExtractProgress(0);
    setError(null);

    try {
      setExtractProgress(20);
      const files = await extractTarGz(file);
      setExtractProgress(80);

      if (files.length === 0) {
        setError("Nenhuma imagem encontrada no arquivo. Verifique se o .tar.gz contém imagens (PNG, JPG, WEBP, GIF).");
        setPhase("select");
        return;
      }

      setExtractedFiles(files);
      setExtractProgress(100);

      // Pequeno delay para mostrar 100%
      await new Promise((r) => setTimeout(r, 500));

      setPhase("uploading");
    } catch (err) {
      setError(
        `Erro ao extrair arquivo: ${err instanceof Error ? err.message : String(err)}. ` +
          "Verifique se é um arquivo .tar.gz válido.",
      );
      setPhase("select");
    }
  };

  // Upload de todos os arquivos extraídos
  const handleUpload = async () => {
    if (extractedFiles.length === 0) return;

    const allResults: UploadResult[] = [];

    for (let i = 0; i < extractedFiles.length; i++) {
      setCurrentIdx(i);
      const file = extractedFiles[i];

      try {
        const formData = new FormData();
        formData.append("file", file.blob, file.name);
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

      // Atualiza resultados a cada 3 arquivos ou no último
      if (i % 3 === 0 || i === extractedFiles.length - 1) {
        setResults([...allResults]);
      }
    }

    setResults(allResults);
    setCurrentIdx(-1);
    setPhase("done");
  };

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const uploadProgress =
    extractedFiles.length > 0 && currentIdx >= 0
      ? Math.round(((currentIdx + 1) / extractedFiles.length) * 100)
      : 0;

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

  return (
    <div className="space-y-6">
      {/* Header */}
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
          Upload de Pacote Visual
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Envie um arquivo .tar.gz com todas as imagens. O sistema extrai e vincula automaticamente às 450 postagens.
        </p>
      </div>

      {/* Aviso informativo */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-xs text-blue-300">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">Como funciona</p>
          <ol className="mt-1 list-inside list-decimal space-y-0.5 text-blue-400/80">
            <li>Selecione o arquivo <code className="rounded bg-zinc-900 px-1 text-blue-300">Pacote_Visual_MeuCorre_90_Dias.tar.gz</code></li>
            <li>O navegador extrai o arquivo localmente (sem upload do arquivo inteiro)</li>
            <li>Cada imagem é enviada individualmente para o servidor</li>
            <li>Vinculação automática pelo nome do arquivo (ex: M01_D01_P01_Instagram_...)</li>
            <li>Não feche a página durante o processo</li>
          </ol>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Erro</p>
            <p className="mt-1 text-red-400/80">{error}</p>
          </div>
        </div>
      )}

      {/* Fase: Seleção */}
      {phase === "select" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFileSelect(e.dataTransfer.files);
          }}
          className={`rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
            dragOver
              ? "border-emerald-500 bg-emerald-500/5"
              : "border-zinc-700 bg-zinc-900"
          }`}
        >
          <Package className="mx-auto mb-3 h-12 w-12 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">
            Arraste o arquivo .tar.gz aqui
          </p>
          <p className="mt-1 text-xs text-zinc-500">ou</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button
              onClick={() => archiveInputRef.current?.click()}
              className="gap-1.5"
            >
              <FileArchive className="h-4 w-4" />
              Selecionar .tar.gz
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="gap-1.5"
            >
              <ImageIcon className="h-4 w-4" />
              Selecionar imagens
            </Button>
          </div>
          <input
            ref={archiveInputRef}
            type="file"
            accept=".tar.gz,.tgz,.tar,application/gzip,application/x-tar"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <p className="mt-4 text-[10px] text-zinc-600">
            Aceita: .tar.gz, .tgz, .tar, PNG, JPG, WEBP, GIF
          </p>
        </div>
      )}

      {/* Fase: Extraindo */}
      {phase === "extracting" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-emerald-400" />
          <p className="text-sm font-medium text-zinc-100">Extraindo arquivo...</p>
          <p className="mt-1 text-xs text-zinc-500">
            Descompactando e separando imagens no navegador
          </p>
          <div className="mx-auto mt-4 max-w-xs">
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${extractProgress}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-zinc-500">{extractProgress}%</p>
          </div>
        </div>
      )}

      {/* Fase: Upload */}
      {phase === "uploading" && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-100">
                {extractedFiles.length} imagens para enviar
              </span>
            </div>
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">
              {currentIdx >= 0 ? `${currentIdx + 1} / ${extractedFiles.length}` : "Aguardando..."}
            </Badge>
          </div>

          {/* Barra de progresso */}
          {currentIdx >= 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="truncate">
                  {currentIdx >= 0 ? extractedFiles[currentIdx]?.name : ""}
                </span>
                <span className="shrink-0">{uploadProgress}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Resultados parciais */}
          {results.length > 0 && (
            <div className="max-h-48 overflow-y-auto">
              {results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded px-2 py-0.5 text-xs"
                >
                  {r.status === "success" ? (
                    <Check className="h-3 w-3 shrink-0 text-emerald-400" />
                  ) : (
                    <X className="h-3 w-3 shrink-0 text-red-400" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-zinc-400">
                    {r.fileName}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Botão iniciar (apenas se ainda não começou) */}
          {currentIdx === -1 && results.length === 0 && (
            <Button
              onClick={handleUpload}
              className="mt-3 w-full gap-1.5"
            >
              <Upload className="h-4 w-4" />
              Iniciar upload de {extractedFiles.length} imagens
            </Button>
          )}
        </div>
      )}

      {/* Fase: Concluído */}
      {phase === "done" && (
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
                  setExtractedFiles([]);
                  setResults([]);
                  setCurrentIdx(-1);
                  setPhase("select");
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
