"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  Users,
  Handshake,
  Gift,
  Smartphone,
  Tag,
  Send,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  Loader2,
  RefreshCw,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardData {
  period: { days: number; start: string };
  revenue: {
    total: number;
    period: number;
    subscriptionsApproved: number;
    subscriptionsPending: number;
    subscriptionsRejected: number;
    avgTicket: number;
  };
  users: {
    total: number;
    pro: number;
    trial: number;
    newPeriod: number;
    conversionRate: number;
  };
  partners: {
    total: number;
    active: number;
    newPeriod: number;
    byStage: Record<string, number>;
  };
  referrals: {
    total: number;
    completed: number;
    pending: number;
    conversionRate: number;
    campaignActive: boolean;
    rewardAmount: number;
  };
  app: {
    totalViews: number;
    totalClicks: number;
    ctr: number;
    totalFeedbacks: number;
    avgRating: number;
    newFeedbacksPeriod: number;
  };
  campaigns: {
    total: number;
    published: number;
    paused: number;
    expired: number;
    views: number;
    clicks: number;
    leads: number;
    ctr: number;
  };
  outbound: Record<string, number>;
  proposals: Record<string, number>;
  promotion: Record<string, number>;
}

const STAGE_LABELS: Record<string, string> = {
  novo_lead: "Novo Lead",
  qualificando: "Qualificando",
  contato_iniciado: "Contato Iniciado",
  descoberta: "Descoberta",
  proposta_enviada: "Proposta Enviada",
  negociacao: "Negociação",
  aguardando_aprovacao: "Aguardando Aprovação",
  ativacao: "Ativação",
  ativo: "Ativo",
  renovacao: "Renovação",
  perdido: "Perdido",
  desqualificado: "Desqualificado",
};

function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatNumber(v: number): string {
  return v.toLocaleString("pt-BR");
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodDays, setPeriodDays] = useState("30");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/metrics/dashboard?periodDays=${periodDays}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [periodDays]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando dashboard executivo...
      </div>
    );
  }

  const stagesArray = Object.entries(data.partners.byStage) as Array<[string, number]>;
  const maxStageCount = Math.max(...stagesArray.map(([, c]) => c), 1);

  return (
    <div className="space-y-4">
      {/* Header com seletor de período */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          Período: últimos {data.period.days} dias (desde{" "}
          {new Date(data.period.start).toLocaleDateString("pt-BR")})
        </p>
        <div className="flex items-center gap-2">
          <Select value={periodDays} onValueChange={setPeriodDays}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="365">365 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={load} className="h-8 gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPIs principais — 4 cards grandes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BigKpi
          icon={<DollarSign className="h-5 w-5" />}
          label="Receita total"
          value={formatBRL(data.revenue.total)}
          sub={`${data.revenue.subscriptionsApproved} assinaturas aprovadas`}
          sub2={`${formatBRL(data.revenue.period)} nos últimos ${data.period.days}d`}
          color="text-emerald-400"
        />
        <BigKpi
          icon={<Users className="h-5 w-5" />}
          label="Usuários"
          value={formatNumber(data.users.total)}
          sub={`${data.users.pro} PRO · ${data.users.trial} trial`}
          sub2={`${data.users.newPeriod} novos (${data.users.conversionRate}% conversão)`}
          color="text-blue-400"
        />
        <BigKpi
          icon={<Handshake className="h-5 w-5" />}
          label="Parceiros"
          value={formatNumber(data.partners.total)}
          sub={`${data.partners.active} ativos`}
          sub2={`${data.partners.newPeriod} novos no período`}
          color="text-purple-400"
        />
        <BigKpi
          icon={<Gift className="h-5 w-5" />}
          label="Indicações"
          value={formatNumber(data.referrals.total)}
          sub={`${data.referrals.completed} convertidas`}
          sub2={`${data.referrals.conversionRate}% conversão`}
          color="text-amber-400"
        />
      </div>

      {/* Grid de KPIs secundários */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <SmallKpi
          icon={<TrendingUp className="h-3 w-3" />}
          label="Receita período"
          value={formatBRL(data.revenue.period)}
          color="text-emerald-400"
        />
        <SmallKpi
          icon={<DollarSign className="h-3 w-3" />}
          label="Ticket médio"
          value={formatBRL(data.revenue.avgTicket)}
        />
        <SmallKpi
          icon={<Users className="h-3 w-3" />}
          label="Novos usuários"
          value={formatNumber(data.users.newPeriod)}
        />
        <SmallKpi
          icon={<Star className="h-3 w-3" />}
          label="Avaliação média"
          value={data.app.avgRating > 0 ? `${data.app.avgRating}★` : "—"}
          sub={`${data.app.totalFeedbacks} feedbacks`}
          color="text-amber-400"
        />
        <SmallKpi
          icon={<Smartphone className="h-3 w-3" />}
          label="App views"
          value={formatNumber(data.app.totalViews)}
          sub={`${data.app.ctr}% CTR`}
        />
        <SmallKpi
          icon={<Tag className="h-3 w-3" />}
          label="Campanhas publicadas"
          value={formatNumber(data.campaigns.published)}
          sub={`${data.campaigns.leads} leads`}
          color="text-emerald-400"
        />
      </div>

      {/* Grid de detalhes */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Funil de parceiros */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
            <Handshake className="h-3.5 w-3.5 text-purple-400" />
            Funil de parceiros
          </h3>
          <div className="space-y-1.5">
            {stagesArray.map(([stage, count]) => (
              <div key={stage} className="flex items-center gap-2">
                <span className="w-36 shrink-0 text-[10px] text-zinc-400">
                  {STAGE_LABELS[stage] ?? stage}
                </span>
                <div className="h-5 flex-1 overflow-hidden rounded bg-zinc-950">
                  <div
                    className="flex h-full items-center justify-end px-2 text-[9px] font-bold text-white transition-all"
                    style={{
                      width: `${Math.max((count / maxStageCount) * 100, count > 0 ? 8 : 0)}%`,
                      backgroundColor: count > 0 ? "#a855f7" : "#27272a",
                    }}
                  >
                    {count > 0 && count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campanhas + App */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
            <Tag className="h-3.5 w-3.5 text-emerald-400" />
            Campanhas e App
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="mb-1 text-[10px] text-zinc-500">Campanhas de parceiros</p>
              <div className="space-y-0.5">
                <Row label="Total" value={data.campaigns.total} />
                <Row label="Publicadas" value={data.campaigns.published} color="text-emerald-400" />
                <Row label="Pausadas" value={data.campaigns.paused} color="text-amber-400" />
                <Row label="Expiradas" value={data.campaigns.expired} color="text-zinc-500" />
                <Row label="Views" value={data.campaigns.views} />
                <Row label="Clicks" value={data.campaigns.clicks} />
                <Row label="Leads" value={data.campaigns.leads} color="text-emerald-400" />
                <Row label="CTR" value={`${data.campaigns.ctr}%`} />
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] text-zinc-500">App (anúncios)</p>
              <div className="space-y-0.5">
                <Row label="Total views" value={data.app.totalViews} />
                <Row label="Total clicks" value={data.app.totalClicks} />
                <Row label="CTR" value={`${data.app.ctr}%`} />
                <Row label="Feedbacks" value={data.app.totalFeedbacks} />
                <Row label="Avaliação" value={data.app.avgRating > 0 ? `${data.app.avgRating}★` : "—"} />
                <Row label="Novos feedbacks" value={data.app.newFeedbacksPeriod} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Outbound + Propostas + Divulgação */}
      <div className="grid gap-4 lg:grid-cols-3">
        <StatusGrid
          title="Outbound"
          icon={<Send className="h-3.5 w-3.5 text-blue-400" />}
          data={data.outbound}
          labels={{
            preparado: "Preparado",
            aguardando_aprovacao: "Aguardando Aprovação",
            enviado: "Enviado",
            respondeu: "Respondeu",
            interessado: "Interessado",
            reuniao_marcada: "Reunião Marcada",
            proposta_enviada: "Proposta Enviada",
            negociacao: "Negociação",
            ganho: "Ganho",
            ativo: "Ativo",
            opt_out: "Opt-out",
            perdido: "Perdido",
            erro: "Erro",
          }}
        />
        <StatusGrid
          title="Propostas"
          icon={<FileText className="h-3.5 w-3.5 text-purple-400" />}
          data={data.proposals}
          labels={{
            draft: "Rascunho",
            sent: "Enviada",
            approved: "Aprovada",
            rejected: "Rejeitada",
            expired: "Expirada",
            canceled: "Cancelada",
          }}
        />
        <StatusGrid
          title="Divulgação"
          icon={<Calendar className="h-3.5 w-3.5 text-emerald-400" />}
          data={data.promotion}
          labels={{
            pending: "Pendente",
            published: "Publicada",
            skipped: "Pulada",
            failed: "Falhou",
          }}
        />
      </div>

      {/* Indicações detalhe */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
          <Gift className="h-3.5 w-3.5 text-amber-400" />
          Campanha de indicações
        </h3>
        <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <Row label="Total" value={data.referrals.total} />
          <Row label="Convertidas" value={data.referrals.completed} color="text-emerald-400" />
          <Row label="Pendentes" value={data.referrals.pending} color="text-amber-400" />
          <Row label="Conversão" value={`${data.referrals.conversionRate}%`} />
          <Row
            label="Status campanha"
            value={data.referrals.campaignActive ? "Ativa" : "Inativa"}
            color={data.referrals.campaignActive ? "text-emerald-400" : "text-zinc-500"}
          />
          <Row label="Recompensa" value={formatBRL(data.referrals.rewardAmount)} />
        </div>
      </div>
    </div>
  );
}

function BigKpi({
  icon,
  label,
  value,
  sub,
  sub2,
  color = "text-zinc-400",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  sub2: string;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase text-zinc-500">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className="mt-1 text-2xl font-bold text-zinc-100">{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{sub}</p>
      <p className="text-[10px] text-zinc-500">{sub2}</p>
    </div>
  );
}

function SmallKpi({
  icon,
  label,
  value,
  sub,
  color = "text-zinc-300",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase text-zinc-500">{label}</span>
        <span className="text-zinc-500">{icon}</span>
      </div>
      <p className={`mt-0.5 text-base font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[9px] text-zinc-500">{sub}</p>}
    </div>
  );
}

function Row({
  label,
  value,
  color = "text-zinc-300",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  );
}

function StatusGrid({
  title,
  icon,
  data,
  labels,
}: {
  title: string;
  icon: React.ReactNode;
  data: Record<string, number>;
  labels: Record<string, string>;
}) {
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, c]) => sum + c, 0);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
        {icon}
        {title}
        <Badge variant="outline" className="ml-auto border-zinc-700 text-[10px]">
          {total}
        </Badge>
      </h3>
      {entries.length === 0 ? (
        <p className="py-4 text-center text-xs text-zinc-500">
          Sem dados
        </p>
      ) : (
        <div className="space-y-1">
          {entries.map(([status, count]) => (
            <div key={status} className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">{labels[status] ?? status}</span>
              <span className="font-medium text-zinc-200">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
