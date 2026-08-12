"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  TrendingUp,
  Clock,
  Activity as ActivityIcon,
  Building2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import {
  STAGE_LABELS,
  STAGE_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_ICONS,
  ACTIVITY_STATUS_LABELS,
  formatBRL,
  formatDateTime,
  timeAgo,
  type PartnerStage,
  type PartnerActivity,
} from "@/lib/partner-types";
import { Badge } from "@/components/ui/badge";

interface DashboardData {
  totalPartners: number;
  partnersCreatedLast30Days: number;
  totalOpportunities: number;
  potentialValueSum: number;
  pendingActivitiesCount: number;
  byStage: Record<string, number>;
  byCategory: Record<string, number>;
  byCity: Array<{ city: string | null; count: number }>;
  byAssignedTo: Array<{ assignedTo: string | null; count: number }>;
  byPriority: Record<string, number>;
  pendingActivities: (PartnerActivity & {
    partner?: { id: string; companyName: string; city: string | null; category: string | null };
    opportunity?: { title: string } | null;
  })[];
  recentLogs: Array<{
    id: string;
    action: string;
    details: string | null;
    adminEmail: string | null;
    createdAt: string;
    partner?: { companyName: string };
  }>;
}

const ACTION_LABELS: Record<string, string> = {
  created: "Criou",
  updated: "Atualizou",
  stage_changed: "Mudou estágio",
  contact_added: "Adicionou contato",
  contact_removed: "Removeu contato",
  contact_opt_out: "Opt-out",
  contact_opt_in: "Opt-in",
  opportunity_created: "Criou oportunidade",
  opportunity_deleted: "Removeu oportunidade",
  activity_created: "Criou atividade",
  activity_completed: "Concluiu atividade",
  activity_deleted: "Removeu atividade",
  import: "Importou",
};

interface Props {
  onSelectPartner: (id: string) => void;
}

export function DashboardView({ onSelectPartner }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/partners/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando dashboard...
      </div>
    );
  }

  const stagesArray = Object.entries(data.byStage) as Array<[PartnerStage, number]>;
  const maxStageCount = Math.max(...stagesArray.map(([, c]) => c), 1);

  return (
    <div className="space-y-4">
      {/* KPIs principais */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          icon={<Building2 className="h-4 w-4" />}
          label="Parceiros"
          value={data.totalPartners.toString()}
          sub={`${data.partnersCreatedLast30Days} nos últimos 30 dias`}
          color="text-emerald-400"
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Oportunidades"
          value={data.totalOpportunities.toString()}
          sub={`${formatBRL(data.potentialValueSum)} potencial`}
          color="text-blue-400"
        />
        <KpiCard
          icon={<Clock className="h-4 w-4" />}
          label="Atividades pendentes"
          value={data.pendingActivitiesCount.toString()}
          sub="Aguardando execução"
          color="text-amber-400"
        />
        <KpiCard
          icon={<Users className="h-4 w-4" />}
          label="Categorias"
          value={Object.keys(data.byCategory).length.toString()}
          sub={`${data.byCity.length} cidades`}
          color="text-purple-400"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Funil por estágio */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-100">Funil de parceiros</h3>
          <div className="space-y-2">
            {stagesArray.map(([stage, count]) => (
              <div key={stage} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-xs text-zinc-400">
                  {STAGE_LABELS[stage]}
                </span>
                <div className="h-6 flex-1 overflow-hidden rounded bg-zinc-950">
                  <div
                    className="flex h-full items-center justify-end px-2 text-[10px] font-bold text-white transition-all"
                    style={{
                      width: `${Math.max((count / maxStageCount) * 100, count > 0 ? 8 : 0)}%`,
                      backgroundColor: STAGE_COLORS[stage],
                    }}
                  >
                    {count > 0 && count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Próximas atividades */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            Próximas atividades
          </h3>
          {data.pendingActivities.length === 0 ? (
            <p className="py-4 text-center text-xs text-zinc-500">
              Nenhuma atividade pendente
            </p>
          ) : (
            <div className="space-y-2">
              {data.pendingActivities.slice(0, 6).map((a) => (
                <button
                  key={a.id}
                  onClick={() => a.partner && onSelectPartner(a.partner.id)}
                  className="w-full rounded border border-zinc-800 bg-zinc-950 p-2 text-left text-xs hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-medium text-zinc-200">
                      <span>{ACTIVITY_TYPE_ICONS[a.type]}</span>
                      {ACTIVITY_TYPE_LABELS[a.type]}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {a.scheduledAt ? formatDateTime(a.scheduledAt) : "sem data"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-zinc-400">{a.title}</p>
                  {a.partner && (
                    <p className="mt-0.5 text-[10px] text-zinc-600">
                      {a.partner.companyName}
                      {a.partner.city ? ` · ${a.partner.city}` : ""}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Por cidade */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-100">Top cidades</h3>
          <div className="space-y-1.5">
            {data.byCity.slice(0, 6).map((c) => (
              <div key={c.city ?? "null"} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">{c.city ?? "Sem cidade"}</span>
                <Badge variant="outline" className="border-zinc-700 text-[10px]">
                  {c.count}
                </Badge>
              </div>
            ))}
            {data.byCity.length === 0 && (
              <p className="py-2 text-center text-xs text-zinc-500">Sem dados</p>
            )}
          </div>
        </div>

        {/* Por prioridade */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-100">Por prioridade</h3>
          <div className="space-y-1.5">
            {Object.entries(data.byPriority).map(([p, count]) => (
              <div key={p} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: PRIORITY_COLORS[p as keyof typeof PRIORITY_COLORS] ?? "#71717a" }}
                  />
                  {PRIORITY_LABELS[p as keyof typeof PRIORITY_LABELS] ?? p}
                </span>
                <Badge variant="outline" className="border-zinc-700 text-[10px]">
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Atividade recente (logs) */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
          <ActivityIcon className="h-3.5 w-3.5 text-zinc-400" />
          Atividade recente
        </h3>
        {data.recentLogs.length === 0 ? (
          <p className="py-4 text-center text-xs text-zinc-500">
            Nenhuma ação registrada
          </p>
        ) : (
          <div className="space-y-1.5">
            {data.recentLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-zinc-700 text-[10px]">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </Badge>
                  <span className="text-zinc-300">
                    {log.partner?.companyName ?? "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  {log.adminEmail && <span>{log.adminEmail}</span>}
                  <span>{timeAgo(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase text-zinc-500">
          {label}
        </span>
        <span className={color}>{icon}</span>
      </div>
      <p className="mt-1 text-xl font-bold text-zinc-100">{value}</p>
      <p className="mt-0.5 text-[10px] text-zinc-500">{sub}</p>
    </div>
  );
}
