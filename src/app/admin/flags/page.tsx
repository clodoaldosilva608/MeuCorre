"use client";

import { useEffect, useState, useCallback } from "react";
import { Flag, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const FLAG_DESCRIPTIONS: Record<string, { label: string; description: string; release: string }> = {
  admin_marketing_hub_enabled: {
    label: "Central de Divulgação",
    description: "Calendário editorial de 90 dias com 450 postagens, assets, canais e lembretes",
    release: "Release C",
  },
  admin_partner_crm_enabled: {
    label: "CRM de Parceiros",
    description: "Gestão de empresas, contatos, oportunidades e pipeline Kanban",
    release: "Release D",
  },
  partner_campaigns_enabled: {
    label: "Campanhas de Parceiros",
    description: "Campanhas com oferta, cupom, CTA, vigência e métricas",
    release: "Release F",
  },
  partner_outbound_preview_enabled: {
    label: "Outbound (preview)",
    description: "Prospecção B2B supervisionada — preview e dry-run",
    release: "Release G",
  },
  partner_outbound_send_enabled: {
    label: "Outbound (envio)",
    description: "Envio manual de mensagens outbound — só ativar com revisão humana ativa",
    release: "Release G",
  },
  partner_portal_enabled: {
    label: "Portal do Parceiro",
    description: "Visão restrita do parceiro (campanhas e métricas próprias)",
    release: "Release I",
  },
  app_radar_enabled: {
    label: "Radar do Prejuízo",
    description: "Alertas explicáveis no app do entregador",
    release: "Release I",
  },
  app_score_enabled: {
    label: "MeuCorre Score",
    description: "Score de consistência do entregador (não julga, mostra evolução)",
    release: "Release I",
  },
  app_challenge_enabled: {
    label: "Desafio 7 Dias",
    description: "Desafio de 7 dias no app para engajar entregadores",
    release: "Release I",
  },
  admin_teams_enabled: {
    label: "MeuCorre Equipes",
    description: "Equipes B2B — organização, convites, painel agregado",
    release: "Release I",
  },
};

export default function FlagsPage() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/feature-flags");
      if (res.ok) {
        const data = await res.json();
        setFlags(data.flags ?? {});
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFlag = async (key: string, value: boolean) => {
    setUpdating(key);
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        setFlags((f) => ({ ...f, [key]: value }));
        toast.success(
          `${FLAG_DESCRIPTIONS[key]?.label ?? key} ${value ? "ativado" : "desativado"}`,
        );
      } else {
        toast.error("Erro ao atualizar flag");
      }
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando feature flags...
      </div>
    );
  }

  const enabledCount = Object.values(flags).filter(Boolean).length;
  const totalCount = Object.keys(flags).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
          <Flag className="h-6 w-6 text-emerald-400" />
          Feature Flags
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Ativação controlada de módulos. {enabledCount} de {totalCount} módulos ativos.
        </p>
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Atenção: mudanças aqui afetam produção imediatamente</p>
            <p className="mt-1 text-amber-400/80">
              Ativar uma flag habilita o módulo no menu admin e nas APIs correspondentes.
              Desativar oculta o módulo mas NÃO remove dados já cadastrados.
              Use o plano de rollback documentado em <code>docs/PLANO_IMPLEMENTACAO_SEGURO_MEU_CORRE.md</code>.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {Object.entries(flags).map(([key, value]) => {
          const meta = FLAG_DESCRIPTIONS[key];
          return (
            <div
              key={key}
              className="flex items-start justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-100">
                    {meta?.label ?? key}
                  </span>
                  <Badge variant="outline" className="border-zinc-700 text-[10px] text-zinc-400">
                    {meta?.release ?? "—"}
                  </Badge>
                  {value ? (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                      <ShieldCheck className="mr-1 h-2.5 w-2.5" />
                      Ativo
                    </Badge>
                  ) : (
                    <Badge className="bg-zinc-800 text-zinc-500 text-[10px]">
                      Inativo
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {meta?.description ?? "Sem descrição"}
                </p>
                <code className="mt-1 block text-[10px] text-zinc-600">{key}</code>
              </div>
              <div className="flex items-center gap-2">
                {updating === key && <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />}
                <Switch
                  checked={value}
                  onCheckedChange={(v) => toggleFlag(key, v)}
                  disabled={updating === key}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
