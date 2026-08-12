"use client";

import { useState } from "react";
import { Upload, FileText, AlertCircle, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface PreviewResult {
  preview: boolean;
  total: number;
  toCreate: number;
  toUpdate: number;
  errors: number;
  toCreateSample: Record<string, unknown>[];
  toUpdateSample: Record<string, unknown>[];
  errorsSample: Array<{ row: number; error: string; data?: unknown }>;
}

export function ImportView() {
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState<"preview" | "import" | null>(null);
  const [defaultCity, setDefaultCity] = useState("Recife");
  const [defaultState, setDefaultState] = useState("PE");
  const [defaultAssignedTo, setDefaultAssignedTo] = useState("Clodoaldo Silva");
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    errors: number;
  } | null>(null);

  const handlePreview = async () => {
    if (!csvText.trim()) {
      toast.error("Cole um CSV ou carregue um arquivo");
      return;
    }
    setLoading("preview");
    setImportResult(null);
    try {
      const res = await fetch("/api/admin/partners/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "csv",
          csv: csvText,
          preview: true,
          defaultCity,
          defaultState,
          defaultAssignedTo,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreview(data);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Erro no preview");
      }
    } finally {
      setLoading(null);
    }
  };

  const handleImport = async () => {
    if (!csvText.trim()) return;
    setLoading("import");
    try {
      const res = await fetch("/api/admin/partners/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: "csv",
          csv: csvText,
          defaultCity,
          defaultState,
          defaultAssignedTo,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setImportResult({
          created: data.created,
          updated: data.updated,
          errors: data.errors,
        });
        toast.success(
          `Importação concluída: ${data.created} criados, ${data.updated} atualizados, ${data.errors} erros`,
        );
        setCsvText("");
        setPreview(null);
      } else {
        toast.error("Erro na importação");
      }
    } finally {
      setLoading(null);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(reader.result as string);
      setPreview(null);
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const sampleCsv = `companyName,tradeName,cnpj,category,city,state,phone,email,assignedTo,priority,tags,potentialValue
Oficina do João,Oficina João,12.345.678/0001-90,oficina,Recife,PE,8199999-0001,joao@oficina.com,Clodoaldo Silva,alta,recife,oficina,1500
Pneus & Cia,PneusCia,98.765.432/0001-10,pneus,Olinda,PE,8198888-0002,contato@pneuscia.com,Clodoaldo Silva,media,pneus,800
Acessórios Premium,AccPremium,,acessorios,Recife,PE,8197777-0003,vendas@accpremium.com,Clodoaldo Silva,urgente,recife,acessorios,2500`;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-xs text-blue-300">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Importação CSV de parceiros</p>
            <p className="mt-1 text-blue-400/80">
              Cole o conteúdo do CSV ou carregue um arquivo. Colunas aceitas:
              <code className="mx-1 rounded bg-zinc-900 px-1 text-blue-300">
                companyName*, tradeName, cnpj, category, city, state, address, website, phone, email, assignedTo, priority, stage, status, tags, potentialValue, notes
              </code>
            </p>
            <p className="mt-1 text-blue-400/80">
              Idempotente: se CNPJ ou companyName+city já existirem, o registro é atualizado.
              Use preview antes de importar para validar.
            </p>
          </div>
        </div>
      </div>

      {/* Defaults */}
      <div className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3 sm:grid-cols-3">
        <div>
          <Label className="text-xs">Cidade padrão</Label>
          <Input value={defaultCity} onChange={(e) => setDefaultCity(e.target.value)} className="mt-1 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Estado padrão</Label>
          <Input
            value={defaultState}
            onChange={(e) => setDefaultState(e.target.value.toUpperCase().slice(0, 2))}
            maxLength={2}
            className="mt-1 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Responsável padrão</Label>
          <Input value={defaultAssignedTo} onChange={(e) => setDefaultAssignedTo(e.target.value)} className="mt-1 text-sm" />
        </div>
      </div>

      {/* Upload de arquivo */}
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept=".csv,text/csv"
          id="csv-file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileUpload(f);
          }}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => document.getElementById("csv-file")?.click()}
          className="gap-1.5 text-xs"
        >
          <Upload className="h-3.5 w-3.5" />
          Carregar arquivo CSV
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setCsvText(sampleCsv)}
          className="gap-1.5 text-xs text-zinc-400"
        >
          <FileText className="h-3.5 w-3.5" />
          Ver exemplo
        </Button>
      </div>

      {/* Textarea */}
      <Textarea
        value={csvText}
        onChange={(e) => {
          setCsvText(e.target.value);
          setPreview(null);
          setImportResult(null);
        }}
        placeholder="companyName,tradeName,cnpj,category,city,state,phone,email,..."
        rows={10}
        className="font-mono text-xs"
      />

      {/* Ações */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handlePreview}
          disabled={loading !== null || !csvText.trim()}
          className="gap-1.5 text-xs"
        >
          {loading === "preview" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileText className="h-3.5 w-3.5" />
          )}
          Preview
        </Button>
        <Button
          size="sm"
          onClick={handleImport}
          disabled={loading !== null || !csvText.trim()}
          className="gap-1.5 text-xs"
        >
          {loading === "import" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          Importar
        </Button>
      </div>

      {/* Resultado do preview */}
      {preview && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
            <FileText className="h-4 w-4 text-blue-400" />
            Preview da importação
          </h4>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="rounded border border-zinc-800 bg-zinc-950 p-2">
              <p className="text-[10px] text-zinc-500">Total</p>
              <p className="text-lg font-bold text-zinc-100">{preview.total}</p>
            </div>
            <div className="rounded border border-emerald-500/30 bg-emerald-500/5 p-2">
              <p className="text-[10px] text-emerald-400">Criar</p>
              <p className="text-lg font-bold text-emerald-400">{preview.toCreate}</p>
            </div>
            <div className="rounded border border-blue-500/30 bg-blue-500/5 p-2">
              <p className="text-[10px] text-blue-400">Atualizar</p>
              <p className="text-lg font-bold text-blue-400">{preview.toUpdate}</p>
            </div>
            <div className="rounded border border-red-500/30 bg-red-500/5 p-2">
              <p className="text-[10px] text-red-400">Erros</p>
              <p className="text-lg font-bold text-red-400">{preview.errors}</p>
            </div>
          </div>

          {preview.errorsSample.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-medium text-red-400">
                Primeiros erros:
              </p>
              <div className="space-y-1">
                {preview.errorsSample.map((e, i) => (
                  <div key={i} className="rounded border border-red-500/30 bg-red-500/5 px-2 py-1 text-[10px] text-red-300">
                    <strong>Linha {e.row}:</strong> {e.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resultado da importação */}
      {importResult && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
            <Check className="h-4 w-4" />
            Importação concluída
          </h4>
          <div className="flex gap-3 text-xs">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              {importResult.created} criados
            </Badge>
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">
              {importResult.updated} atualizados
            </Badge>
            {importResult.errors > 0 && (
              <Badge className="bg-red-500/10 text-red-400 border-red-500/30">
                {importResult.errors} erros
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
