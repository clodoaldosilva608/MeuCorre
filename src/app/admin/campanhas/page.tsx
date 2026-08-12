"use client";

import { useEffect, useState } from "react";
import { Tag, Loader2 } from "lucide-react";
import { CampaignsListView } from "@/components/admin/campanhas/campaigns-list-view";

export default function CampanhasPage() {
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
  const campaignsEnabled = flags?.partner_campaigns_enabled === true;

  if (!crmEnabled || !campaignsEnabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <Tag className="h-6 w-6 text-emerald-400" />
            Campanhas de Parceiros
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Ofertas de parceiros exibidas no app do entregador.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <Tag className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
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
              <code className="rounded bg-zinc-800 px-1 py-0.5 text-emerald-400">partner_campaigns_enabled</code>
              {" "}= {campaignsEnabled ? "✅ ON" : "❌ OFF"}
            </li>
          </ul>
          <p className="mt-3 text-xs text-zinc-500">
            Acesse <code className="rounded bg-zinc-800 px-1 py-0.5 text-emerald-400">/admin/flags</code> para ativar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
          <Tag className="h-6 w-6 text-emerald-400" />
          Campanhas de Parceiros
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Crie, aprove e publique ofertas de parceiros no app do entregador. Não afeta anúncios existentes.
        </p>
      </div>

      <CampaignsListView />
    </div>
  );
}
