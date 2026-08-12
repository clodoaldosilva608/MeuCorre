"use client";

import { useEffect, useState } from "react";
import { Megaphone, Loader2 } from "lucide-react";

export default function DivulgacaoPage() {
  const [flags, setFlags] = useState<Record<string, boolean> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/feature-flags")
      .then((r) => r.json())
      .then((data) => setFlags(data.flags ?? {}))
      .catch(() => setFlags({}))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando...
      </div>
    );
  }

  const enabled = flags?.admin_marketing_hub_enabled === true;

  if (!enabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <Megaphone className="h-6 w-6 text-emerald-400" />
            Divulgação
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Central de divulgação e calendário editorial.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <Megaphone className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">
            Módulo em preparação
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            A Central de Divulgação será implementada na Release C.
            Ative a feature flag <code className="rounded bg-zinc-800 px-1 py-0.5 text-emerald-400">admin_marketing_hub_enabled</code> para habilitar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
          <Megaphone className="h-6 w-6 text-emerald-400" />
          Divulgação
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Central de divulgação e calendário editorial.
        </p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
        <p className="text-sm text-zinc-400">
          Implementação da Release C em andamento.
        </p>
      </div>
    </div>
  );
}
