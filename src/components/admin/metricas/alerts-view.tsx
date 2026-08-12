"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  RefreshCw,
  ExternalLink,
  Clock,
  Flag,
  FileText,
  Send,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AlertItem {
  id: string;
  partnerId?: string;
  companyName?: string;
  stage?: string;
  city?: string;
  daysSinceUpdate?: number;
  contactsCount?: number;
  activitiesCount?: number;
  number?: string;
  title?: string;
  validUntil?: string;
  daysExpired?: number;
  name?: string;
  endsAt?: string;
  daysUntilExpiry?: number;
  reportsCount?: number;
  type?: string;
  scheduledAt?: string;
  assignedTo?: string;
  daysLate?: number;
  contactName?: string;
  sentAt?: string;
  daysSinceSent?: number;
  approvedAt?: string;
  daysSinceApproval?: number;
}

interface AlertCategory {
  id: string;
  label: string;
  severity: "high" | "medium" | "low";
  count: number;
  items: AlertItem[];
}

interface AlertsData {
  generatedAt: string;
  totalAlerts: number;
  highSeverityCount: number;
  alerts: AlertCategory[];
}

const SEVERITY_CONFIG = {
  high: {
    label: "Alta",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: AlertCircle,
  },
  medium: {
    label: "Média",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: AlertTriangle,
  },
  low: {
    label: "Baixa",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: Info,
  },
};

const ALERT_ICONS: Record<string, React.ReactNode> = {
  leads_sem_contato: <Clock className="h-3.5 w-3.5" />,
  proposta_vencida: <FileText className="h-3.5 w-3.5" />,
  campanha_expirando: <Calendar className="h-3.5 w-3.5" />,
  campanha_com_denuncia: <Flag className="h-3.5 w-3.5" />,
  atividade_atrasada: <Clock className="h-3.5 w-3.5" />,
  outbound_sem_resposta: <Send className="h-3.5 w-3.5" />,
  proposta_aprovada_sem_ativacao: <FileText className="h-3.5 w-3.5" />,
  campanhas_expiradas_nao_marcadas: <Calendar className="h-3.5 w-3.5" />,
};

interface Props {
  onSelectPartner?: (id: string) => void;
}

export function AlertsView({ onSelectPartner }: Props) {
  const [data, setData] = useState<AlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/metrics/alerts");
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
        Carregando alertas...
      </div>
    );
  }

  if (data.totalAlerts === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
        <Info className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
        <p className="text-sm font-medium text-emerald-300">
          Nenhum alerta ativo
        </p>
        <p className="mt-1 text-xs text-emerald-400/70">
          Todas as métricas estão saudáveis. Última verificação:{" "}
          {new Date(data.generatedAt).toLocaleString("pt-BR")}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={load}
          className="mt-3 gap-1.5 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Verificar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span className="text-sm font-semibold text-zinc-100">
            {data.totalAlerts} alerta{data.totalAlerts === 1 ? "" : "s"} ativo{data.totalAlerts === 1 ? "" : "s"}
          </span>
        </div>
        {data.highSeverityCount > 0 && (
          <Badge className="bg-red-500/10 text-red-400 border-red-500/30">
            {data.highSeverityCount} de alta severidade
          </Badge>
        )}
        <span className="ml-auto text-[10px] text-zinc-500">
          {new Date(data.generatedAt).toLocaleString("pt-BR")}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={load}
          className="h-7 gap-1 text-xs"
        >
          <RefreshCw className="h-3 w-3" />
          Atualizar
        </Button>
      </div>

      {/* Alertas por categoria */}
      {data.alerts
        .filter((a) => a.count > 0)
        .sort((a, b) => {
          const sev = { high: 0, medium: 1, low: 2 };
          return sev[a.severity] - sev[b.severity];
        })
        .map((alert) => {
          const config = SEVERITY_CONFIG[alert.severity];
          const Icon = config.icon;
          const isExpanded = expandedId === alert.id;

          return (
            <div
              key={alert.id}
              className={`rounded-lg border ${config.border} ${config.bg} p-3`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                className="flex w-full items-center gap-2 text-left"
              >
                <Icon className={`h-4 w-4 ${config.color}`} />
                <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-100">
                  {ALERT_ICONS[alert.id]}
                  {alert.label}
                </span>
                <Badge className={`ml-auto ${config.bg} ${config.color} border-${alert.severity === "high" ? "red" : alert.severity === "medium" ? "amber" : "blue"}-500/30`}>
                  {alert.count}
                </Badge>
              </button>

              {isExpanded && alert.items.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-zinc-800 pt-2">
                  {alert.items.slice(0, 10).map((item, i) => (
                    <AlertItemRow
                      key={item.id ?? i}
                      alertId={alert.id}
                      item={item}
                      onSelectPartner={onSelectPartner}
                    />
                  ))}
                  {alert.items.length > 10 && (
                    <p className="pt-1 text-center text-[10px] text-zinc-500">
                      +{alert.items.length - 10} outros...
                    </p>
                  )}
                </div>
              )}

              {isExpanded && alert.items.length === 0 && alert.count > 0 && (
                <p className="mt-2 border-t border-zinc-800 pt-2 text-xs text-zinc-500">
                  {alert.count} ocorrências (sem detalhes disponíveis)
                </p>
              )}
            </div>
          );
        })}
    </div>
  );
}

function AlertItemRow({
  alertId,
  item,
  onSelectPartner,
}: {
  alertId: string;
  item: AlertItem;
  onSelectPartner?: (id: string) => void;
}) {
  const renderDetails = () => {
    switch (alertId) {
      case "leads_sem_contato":
        return (
          <>
            <span className="text-zinc-300">{item.companyName}</span>
            <span className="text-zinc-500">
              · {item.stage} · {item.daysSinceUpdate}d sem atualização
            </span>
            <span className="text-zinc-600">
              · {item.contactsCount}C {item.activitiesCount}A
            </span>
          </>
        );
      case "proposta_vencida":
        return (
          <>
            <span className="text-zinc-300">{item.companyName}</span>
            <span className="text-zinc-500">
              · {item.number} · vencida há {item.daysExpired}d
            </span>
          </>
        );
      case "campanha_expirando":
        return (
          <>
            <span className="text-zinc-300">{item.companyName}</span>
            <span className="text-zinc-500">
              · expira em {item.daysUntilExpiry}d
            </span>
          </>
        );
      case "campanha_com_denuncia":
        return (
          <>
            <span className="text-zinc-300">{item.companyName}</span>
            <span className="text-red-400"> · {item.reportsCount} denúncias</span>
          </>
        );
      case "atividade_atrasada":
        return (
          <>
            <span className="text-zinc-300">{item.companyName}</span>
            <span className="text-zinc-500">
              · {item.type} · {item.daysLate}d atrasada
            </span>
            <span className="text-zinc-400"> · {item.title}</span>
          </>
        );
      case "outbound_sem_resposta":
        return (
          <>
            <span className="text-zinc-300">{item.companyName}</span>
            <span className="text-zinc-500">
              · {item.contactName} · enviado há {item.daysSinceSent}d
            </span>
          </>
        );
      case "proposta_aprovada_sem_ativacao":
        return (
          <>
            <span className="text-zinc-300">{item.companyName}</span>
            <span className="text-zinc-500">
              · {item.number} · aprovada há {item.daysSinceApproval}d
            </span>
          </>
        );
      default:
        return <span className="text-zinc-400">{String(item.companyName ?? item.id)}</span>;
    }
  };

  return (
    <div className="flex items-center gap-2 rounded bg-zinc-950/50 px-2 py-1 text-xs">
      {item.partnerId && onSelectPartner ? (
        <button
          onClick={() => onSelectPartner(item.partnerId!)}
          className="flex flex-1 items-center gap-1 text-left hover:text-emerald-400"
        >
          {renderDetails()}
          <ExternalLink className="ml-auto h-3 w-3 text-zinc-600" />
        </button>
      ) : (
        <span className="flex-1">{renderDetails()}</span>
      )}
    </div>
  );
}
