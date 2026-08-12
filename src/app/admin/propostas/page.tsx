"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2, FileStack, Package } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProposalsListView } from "@/components/admin/propostas/proposals-list-view";
import { CommercialAssetsView } from "@/components/admin/propostas/commercial-assets-view";

export default function PropostasPage() {
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

  const enabled = flags?.admin_partner_crm_enabled === true;

  if (!enabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <FileText className="h-6 w-6 text-emerald-400" />
            Propostas e Materiais
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Geração de propostas comerciais e biblioteca de materiais.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">Módulo desativado</p>
          <p className="mt-1 text-xs text-zinc-500">
            Ative <code className="rounded bg-zinc-800 px-1 py-0.5 text-emerald-400">admin_partner_crm_enabled</code> em{" "}
            <code className="rounded bg-zinc-800 px-1 py-0.5 text-emerald-400">/admin/flags</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
          <FileText className="h-6 w-6 text-emerald-400" />
          Propostas e Materiais
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Gere propostas comerciais com templates, acompanhe aprovações e gerencie a biblioteca de materiais.
        </p>
      </div>

      <Tabs defaultValue="proposals" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="proposals" className="gap-1.5 text-xs">
            <FileStack className="h-3.5 w-3.5" />
            Propostas
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-1.5 text-xs">
            <Package className="h-3.5 w-3.5" />
            Materiais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proposals" className="mt-4">
          <ProposalsListView />
        </TabsContent>

        <TabsContent value="assets" className="mt-4">
          <CommercialAssetsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
