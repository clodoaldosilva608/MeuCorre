"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  FileJson,
  Loader2,
  PackageOpen,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ImportItem = {
  title: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  imageUrl: string;
  videoUrl?: string | null;
  productUrl: string;
  category?: string;
  proOnly?: boolean;
  active?: boolean;
  sourceCategory?: string;
};

type Result = {
  title: string;
  status: "created" | "skipped" | "error";
  detail?: string;
};

type Phase = "select" | "ready" | "importing" | "done";

export default function OffersImportPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>("select");
  const [items, setItems] = useState<ImportItem[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [current, setCurrent] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  useEffect(() => {
    fetch("/api/admin/offers")
      .then((res) => setAuthed(res.ok))
      .catch(() => setAuthed(false));
  }, []);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setResults([]);
    setFileName(file.name);
    try {
      const parsed = JSON.parse(await file.text()) as { ready?: ImportItem[] };
      const ready = Array.isArray(parsed.ready) ? parsed.ready : [];
      const valid = ready.filter(
        (item) =>
          typeof item.title === "string" &&
          item.title.trim().length >= 3 &&
          typeof item.description === "string" &&
          item.description.trim().length >= 5 &&
          typeof item.price === "number" &&
          item.price > 0 &&
          typeof item.imageUrl === "string" &&
          item.imageUrl.startsWith("https://") &&
          typeof item.productUrl === "string" &&
          item.productUrl.startsWith("https://"),
      );
      if (valid.length === 0) {
        setError("O JSON não contém itens prontos para importação.");
        setPhase("select");
        return;
      }
      setItems(valid);
      setPhase("ready");
    } catch {
      setError("Arquivo inválido. Selecione ofertas_importacao.json.");
      setPhase("select");
    }
  };

  const handleImport = async () => {
    if (!items.length) return;
    setPhase("importing");
    setError(null);
    setResults([]);
    setCurrent(-1);

    try {
      const existingResponse = await fetch("/api/admin/offers");
      if (!existingResponse.ok) throw new Error("Não foi possível consultar as ofertas atuais.");
      const existingData = (await existingResponse.json()) as {
        offers?: Array<{ title: string; productUrl: string }>;
      };
      const existingLinks = new Set(
        (existingData.offers ?? []).map((offer) => offer.productUrl.trim().toLowerCase()),
      );
      const seenLinks = new Set(existingLinks);
      const allResults: Result[] = [];

      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        setCurrent(index);
        const key = item.productUrl.trim().toLowerCase();
        if (seenLinks.has(key)) {
          allResults.push({ title: item.title, status: "skipped", detail: "Link já cadastrado" });
          setResults([...allResults]);
          continue;
        }

        try {
          const response = await fetch("/api/admin/offers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: item.title,
              description: item.description,
              price: item.price,
              originalPrice: item.originalPrice ?? null,
              imageUrl: item.imageUrl,
              videoUrl: item.videoUrl ?? null,
              productUrl: item.productUrl,
              category: item.category ?? "outros",
              proOnly: item.proOnly ?? false,
              active: item.active ?? true,
            }),
          });
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          if (!response.ok) {
            allResults.push({ title: item.title, status: "error", detail: data.error ?? `HTTP ${response.status}` });
          } else {
            seenLinks.add(key);
            allResults.push({ title: item.title, status: "created" });
          }
        } catch {
          allResults.push({ title: item.title, status: "error", detail: "Erro de conexão" });
        }
        setResults([...allResults]);
      }

      setCurrent(-1);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao importar ofertas.");
      setCurrent(-1);
      setPhase("ready");
    }
  };

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

  const created = results.filter((result) => result.status === "created").length;
  const skipped = results.filter((result) => result.status === "skipped").length;
  const errors = results.filter((result) => result.status === "error").length;
  const progress = items.length && current >= 0 ? Math.round(((current + 1) / items.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/offers")}
          className="mb-2 gap-1.5 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para Ofertas
        </Button>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
          <PackageOpen className="h-6 w-6 text-emerald-400" />
          Importar ofertas em lote
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-zinc-400">
          Importe um JSON preparado a partir da planilha. O processo consulta os links já cadastrados,
          ignora duplicatas e cria apenas ofertas novas.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-300">
          <X className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Não foi possível continuar</p>
            <p className="mt-1 text-red-400/80">{error}</p>
          </div>
        </div>
      )}

      {phase === "select" && (
        <div className="rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900 p-12 text-center">
          <FileJson className="mx-auto mb-3 h-12 w-12 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">Selecione o arquivo ofertas_importacao.json</p>
          <p className="mt-1 text-xs text-zinc-500">O arquivo deve conter a propriedade `ready` com os produtos validados.</p>
          <Button onClick={() => inputRef.current?.click()} className="mt-4 gap-1.5">
            <Upload className="h-4 w-4" />
            Selecionar JSON
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </div>
      )}

      {(phase === "ready" || phase === "importing" || phase === "done") && (
        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-zinc-100">{fileName || "Catálogo selecionado"}</p>
                <p className="mt-1 text-xs text-zinc-500">{items.length} produtos prontos para avaliação</p>
              </div>
              <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                {phase === "importing" ? `${progress}%` : phase === "done" ? "Concluído" : "Aguardando"}
              </Badge>
            </div>
            {phase === "importing" && (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
            {phase === "ready" && (
              <Button onClick={handleImport} className="mt-4 w-full gap-1.5 bg-emerald-500 text-zinc-950 hover:bg-emerald-400">
                <Upload className="h-4 w-4" />
                Iniciar importação idempotente
              </Button>
            )}
          </div>

          {results.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <SummaryCard label="Criadas" value={created} icon={<Check className="h-5 w-5" />} color="emerald" />
                <SummaryCard label="Ignoradas" value={skipped} icon={<RefreshCw className="h-5 w-5" />} color="blue" />
                <SummaryCard label="Falhas" value={errors} icon={<X className="h-5 w-5" />} color="red" />
              </div>
              <div className="max-h-96 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                {results.map((result, index) => (
                  <div key={`${result.title}-${index}`} className="flex items-center gap-2 border-b border-zinc-800/60 px-2 py-1.5 text-xs last:border-0">
                    {result.status === "created" ? <Check className="h-3 w-3 text-emerald-400" /> : result.status === "skipped" ? <RefreshCw className="h-3 w-3 text-blue-400" /> : <X className="h-3 w-3 text-red-400" />}
                    <span className="min-w-0 flex-1 truncate text-zinc-300">{result.title}</span>
                    {result.detail && <span className="shrink-0 text-[10px] text-zinc-500">{result.detail}</span>}
                  </div>
                ))}
              </div>
            </>
          )}

          {phase === "done" && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => router.push("/admin/offers")} className="gap-1.5 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800">
                Ver ofertas cadastradas
              </Button>
              <Button variant="outline" onClick={() => { setItems([]); setResults([]); setPhase("select"); setFileName(""); }} className="gap-1.5 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800">
                Nova importação
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: "emerald" | "blue" | "red" }) {
  const styles = {
    emerald: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
    blue: "border-blue-500/30 bg-blue-500/5 text-blue-400",
    red: "border-red-500/30 bg-red-500/5 text-red-400",
  }[color];
  return (
    <div className={`rounded-lg border p-3 text-center ${styles}`}>
      <div className="mx-auto mb-1 flex justify-center">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[10px] text-zinc-500">{label}</p>
    </div>
  );
}
