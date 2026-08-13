"use client";

import { useEffect, useState, useCallback } from "react";
import { Handshake, Loader2, LayoutDashboard, Building2, Trello, Upload } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DashboardView } from "@/components/admin/parceiros/dashboard-view";
import { PartnersListView } from "@/components/admin/parceiros/partners-list-view";
import { KanbanView } from "@/components/admin/parceiros/kanban-view";
import { PartnerDetailDrawer } from "@/components/admin/parceiros/partner-detail-drawer";
import { ImportView } from "@/components/admin/parceiros/import-view";

export default function ParceirosPage() {
  const [flags, setFlags] = useState<Record<string, boolean> | null>(null);
  const [loadingFlags, setLoadingFlags] = useState(true);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch("/api/admin/feature-flags")
      .then((r) => r.json())
      .then((data) => setFlags(data.flags ?? {}))
      .catch(() => setFlags({}))
      .finally(() => setLoadingFlags(false));
  }, []);

  const handleSelectPartner = useCallback((id: string) => {
    setSelectedPartnerId(id);
    setDrawerOpen(true);
  }, []);

  const handlePartnerChanged = useCallback(() => {
    setRefreshKey((k) => k + 1);
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
            <Handshake className="h-6 w-6 text-emerald-400" />
            Parceiros
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            CRM de parceiros B2B — pipeline, contatos, oportunidades e atividades.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <Handshake className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">
            Módulo desativado
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            A feature flag <code className="rounded bg-zinc-800 px-1 py-0.5 text-emerald-400">admin_partner_crm_enabled</code> está OFF.
            Ative-a em <code className="rounded bg-zinc-800 px-1 py-0.5 text-emerald-400">/admin/flags</code> ou via API.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
          <Handshake className="h-6 w-6 text-emerald-400" />
          Parceiros
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          CRM de parceiros B2B — pipeline visual, contatos, oportunidades, atividades e auditoria.
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="flex w-full overflow-x-auto sm:grid sm:grid-cols-5 sm:w-auto sm:overflow-visible">
          <TabsTrigger value="dashboard" className="gap-1.5 text-xs whitespace-nowrap shrink-0">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-1.5 text-xs whitespace-nowrap shrink-0">
            <Building2 className="h-3.5 w-3.5" />
            Empresas
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-1.5 text-xs whitespace-nowrap shrink-0">
            <Trello className="h-3.5 w-3.5" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-1.5 text-xs whitespace-nowrap shrink-0">
            <Upload className="h-3.5 w-3.5" />
            Importar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <DashboardView onSelectPartner={handleSelectPartner} />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <PartnersListView
            key={`list-${refreshKey}`}
            onSelectPartner={handleSelectPartner}
            onPartnerChanged={handlePartnerChanged}
          />
        </TabsContent>

        <TabsContent value="kanban" className="mt-4">
          <KanbanView onSelectPartner={handleSelectPartner} />
        </TabsContent>

        <TabsContent value="import" className="mt-4">
          <ImportView />
        </TabsContent>
      </Tabs>

      <PartnerDetailDrawer
        partnerId={selectedPartnerId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onPartnerChanged={handlePartnerChanged}
      />
    </div>
  );
}
