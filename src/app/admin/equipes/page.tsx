"use client";

import { useEffect, useState } from "react";
import { Users, Loader2 } from "lucide-react";
import { TeamsView } from "@/components/admin/equipes/teams-view";

export default function EquipesPage() {
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

  const enabled = flags?.admin_teams_enabled === true;

  if (!enabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <Users className="h-6 w-6 text-emerald-400" />
            Equipes B2B
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Organize entregadores em times por empresa.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">Módulo desativado</p>
          <p className="mt-1 text-xs text-zinc-500">
            Ative <code className="rounded bg-zinc-800 px-1 py-0.5 text-emerald-400">admin_teams_enabled</code> em{" "}
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
          <Users className="h-6 w-6 text-emerald-400" />
          Equipes B2B
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Crie times por empresa, convide membros e acompanhe estatísticas agregadas.
        </p>
      </div>
      <TeamsView />
    </div>
  );
}
