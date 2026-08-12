"use client";

import { useEffect, useState } from "react";
import { Send, Loader2, MessageSquare, AlertCircle, ShieldAlert } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TemplatesView } from "@/components/admin/outbound/templates-view";
import { LogsView } from "@/components/admin/outbound/logs-view";

export default function OutboundPage() {
  const [flags, setFlags] = useState<Record<string, boolean> | null>(null);
  const [loadingFlags, setLoadingFlags] = useState(true);

  useEffect(() => {
    fetch("/api/admin/feature-flags")
      .then((r) => r.json())
      .then((data) => setFlags(data.flags ?? {}))
      .catch(() => setFlags({}))
      .finally(() => setLoadingFlags(false));
  }, []);

  if (loadingFlags) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando...
      </div>
    );
  }

  const crmEnabled = flags?.admin_partner_crm_enabled === true;
  const previewEnabled = flags?.partner_outbound_preview_enabled === true;

  if (!crmEnabled || !previewEnabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <Send className="h-6 w-6 text-emerald-400" />
            Outbound Supervisionado
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Prospecção B2B supervisionada — preview, aprovação, registro manual.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <Send className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">Módulo desativado</p>
          <p className="mt-1 text-xs text-zinc-500">
            Ative as feature flags:
          </p>
          <ul className="mt-2 text-xs text-zinc-400">
            <li>
              <code className="rounded bg-zinc-800 px-1 py-0.5 text-emerald-400">admin_partner_crm_enabled</code>
              {" "}= {crmEnabled ? "✅ ON" : "❌ OFF"}
            </li>
            <li className="mt-1">
              <code className="rounded bg-zinc-800 px-1 py-0.5 text-emerald-400">partner_outbound_preview_enabled</code>
              {" "}= {previewEnabled ? "✅ ON" : "❌ OFF"}
            </li>
          </ul>
          <p className="mt-3 text-xs text-zinc-500">
            Acesse <code className="rounded bg-zinc-800 px-1 py-0.5 text-emerald-400">/admin/flags</code> para ativar.
          </p>
        </div>
      </div>
    );
  }

  const sendEnabled = flags?.partner_outbound_send_enabled === true;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
          <Send className="h-6 w-6 text-emerald-400" />
          Outbound Supervisionado
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Prospecção B2B supervisionada. O sistema prepara; o administrador executa.
        </p>
      </div>

      {/* Aviso de princípios */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="space-y-1 text-amber-300">
            <p className="font-medium">Princípios do outbound supervisionado</p>
            <ul className="list-inside list-disc space-y-0.5 text-amber-400/80">
              <li>O sistema prepara; o administrador executa. <strong>Nenhum envio automático.</strong></li>
              <li>Dry-run obrigatório. Preview antes de qualquer contato.</li>
              <li>Opt-out permanente. Contato com opt-out NUNCA é selecionado.</li>
              <li>Sem anti-ban. Canais oficiais e autorizados. Não burlar limites.</li>
              <li>Volume controlado. Lotes pequenos, revisão humana, sem spam.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Aviso de feature flag send */}
      {!sendEnabled && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-xs text-blue-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Envio manual desativado (recomendado)</p>
            <p className="mt-1 text-blue-400/80">
              A feature flag <code className="rounded bg-zinc-900 px-1 text-blue-300">partner_outbound_send_enabled</code> está OFF.
              Você pode preparar e aprovar mensagens, mas não registrar envios.
              Ative apenas quando estiver pronto para operar com revisão humana ativa.
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="logs" className="gap-1.5 text-xs">
            <MessageSquare className="h-3.5 w-3.5" />
            Mensagens
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5 text-xs">
            <Send className="h-3.5 w-3.5" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-4">
          <LogsView />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <TemplatesView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
