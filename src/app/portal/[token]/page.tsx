"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  Tag,
  TrendingUp,
  Eye,
  MousePointerClick,
  Gift,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PortalData {
  partner: {
    id: string;
    companyName: string;
    city: string | null;
    state: string | null;
    category: string | null;
  };
  permissions: {
    canViewCampaigns: boolean;
    canViewMetrics: boolean;
    canViewProposals: boolean;
  };
  campaigns: Array<{
    id: string;
    name: string;
    offerTitle: string;
    offerDescription: string;
    offerCta: string;
    offerUrl: string;
    couponCode: string | null;
    discountText: string | null;
    category: string;
    status: string;
    startsAt: string;
    endsAt: string | null;
    publishedAt: string | null;
    views: number;
    clicks: number;
    leads: number;
    redemptions: number;
  }>;
  metrics: {
    totalCampaigns: number;
    publishedCampaigns: number;
    totalViews: number;
    totalClicks: number;
    totalLeads: number;
    totalRedemptions: number;
    ctr: number;
  } | null;
  proposals: Array<{
    id: string;
    number: string;
    title: string;
    status: string;
    billingModel: string | null;
    campaignPrice: number | null;
    leadPrice: number | null;
    validUntil: string | null;
    sentAt: string | null;
    approvedAt: string | null;
    version: number;
  }>;
  tokenInfo: {
    expiresAt: string | null;
    lastUsedAt: string | null;
  };
}

const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  pending_approval: "Pendente",
  approved: "Aprovada",
  published: "Publicada",
  paused: "Pausada",
  expired: "Expirada",
  rejected: "Rejeitada",
  canceled: "Cancelada",
};

const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviada",
  approved: "Aprovada",
  rejected: "Rejeitada",
  expired: "Expirada",
  canceled: "Cancelada",
};

function formatBRL(v: number | null): string {
  if (v === null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function PartnerPortalPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/public/portal/${token}`)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.error ?? "Erro");
        }
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 text-zinc-500">
        <div className="text-center">
          <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
          <p className="text-sm">Carregando portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 p-6 text-zinc-300">
        <div className="max-w-md text-center">
          <XCircle className="mx-auto mb-3 h-12 w-12 text-red-400" />
          <h1 className="mb-2 text-xl font-bold">Portal indisponível</h1>
          <p className="text-sm text-zinc-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-zinc-950 py-8 text-zinc-200">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-zinc-100">{data.partner.companyName}</h1>
          <p className="mt-1 text-xs text-zinc-500">
            Portal do Parceiro · MeuCorre
            {data.partner.city && (
              <> · {data.partner.city}{data.partner.state ? `/${data.partner.state}` : ""}</>
            )}
          </p>
        </div>

        {/* Métricas */}
        {data.metrics && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard
              icon={<Tag className="h-4 w-4" />}
              label="Campanhas"
              value={data.metrics.totalCampaigns}
              sub={`${data.metrics.publishedCampaigns} publicadas`}
              color="text-emerald-400"
            />
            <MetricCard
              icon={<Eye className="h-4 w-4" />}
              label="Views"
              value={data.metrics.totalViews}
              color="text-blue-400"
            />
            <MetricCard
              icon={<MousePointerClick className="h-4 w-4" />}
              label="Cliques"
              value={data.metrics.totalClicks}
              sub={`${data.metrics.ctr}% CTR`}
              color="text-purple-400"
            />
            <MetricCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Leads"
              value={data.metrics.totalLeads}
              sub={`${data.metrics.totalRedemptions} resgates`}
              color="text-amber-400"
            />
          </div>
        )}

        {/* Campanhas */}
        {data.permissions.canViewCampaigns && (
          <div className="mb-6">
            <h2 className="mb-3 flex items-center gap-1.5 text-lg font-semibold text-zinc-100">
              <Tag className="h-4 w-4 text-emerald-400" />
              Campanhas
            </h2>
            {data.campaigns.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center text-sm text-zinc-500">
                Nenhuma campanha cadastrada.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.campaigns.map((c) => (
                  <div key={c.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-100">{c.offerTitle}</p>
                        <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{c.offerDescription}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          c.status === "published"
                            ? "border-emerald-500/30 text-emerald-400 text-[10px]"
                            : "border-zinc-700 text-zinc-500 text-[10px]"
                        }
                      >
                        {CAMPAIGN_STATUS_LABELS[c.status] ?? c.status}
                      </Badge>
                    </div>

                    {c.discountText && (
                      <Badge className="mt-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                        <Gift className="mr-0.5 h-2.5 w-2.5" />
                        {c.discountText}
                      </Badge>
                    )}

                    {c.couponCode && (
                      <p className="mt-2 text-[10px] text-zinc-500">
                        Cupom: <code className="rounded bg-zinc-800 px-1 text-emerald-400">{c.couponCode}</code>
                      </p>
                    )}

                    {c.status === "published" && (
                      <div className="mt-3 grid grid-cols-4 gap-1 rounded bg-zinc-950 p-2 text-center text-[10px]">
                        <div>
                          <p className="text-zinc-600">Views</p>
                          <p className="font-semibold text-zinc-300">{c.views}</p>
                        </div>
                        <div>
                          <p className="text-zinc-600">Clicks</p>
                          <p className="font-semibold text-zinc-300">{c.clicks}</p>
                        </div>
                        <div>
                          <p className="text-zinc-600">Leads</p>
                          <p className="font-semibold text-emerald-400">{c.leads}</p>
                        </div>
                        <div>
                          <p className="text-zinc-600">Resgates</p>
                          <p className="font-semibold text-amber-400">{c.redemptions}</p>
                        </div>
                      </div>
                    )}

                    {c.status === "published" && c.offerUrl && (
                      <a
                        href={c.offerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {c.offerCta}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Propostas */}
        {data.permissions.canViewProposals && data.proposals.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 flex items-center gap-1.5 text-lg font-semibold text-zinc-100">
              <FileText className="h-4 w-4 text-purple-400" />
              Propostas
            </h2>
            <div className="space-y-2">
              {data.proposals.map((p) => (
                <div key={p.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-zinc-500">{p.number} · v{p.version}</p>
                      <p className="text-sm font-medium text-zinc-100">{p.title}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        p.status === "approved"
                          ? "border-emerald-500/30 text-emerald-400 text-[10px]"
                          : p.status === "sent"
                            ? "border-blue-500/30 text-blue-400 text-[10px]"
                            : "border-zinc-700 text-zinc-500 text-[10px]"
                      }
                    >
                      {PROPOSAL_STATUS_LABELS[p.status] ?? p.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-zinc-500">
                    {p.billingModel && <span>Modelo: {p.billingModel}</span>}
                    {p.campaignPrice !== null && (
                      <span className="text-emerald-400">{formatBRL(p.campaignPrice)}/mês</span>
                    )}
                    {p.leadPrice !== null && (
                      <span className="text-emerald-400">{formatBRL(p.leadPrice)}/lead</span>
                    )}
                    {p.validUntil && <span>Válida até: {formatDate(p.validUntil)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-center text-[10px] text-zinc-500">
          <p>
            Portal do Parceiro MeuCorre · Acesso via token único
            {data.tokenInfo.expiresAt && (
              <> · Expira em {formatDate(data.tokenInfo.expiresAt)}</>
            )}
          </p>
          <p className="mt-1">
            Para suporte, contate <a href="mailto:contato@meucorre.com.br" className="text-emerald-500 hover:underline">contato@meucorre.com.br</a>
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  color = "text-zinc-400",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase text-zinc-500">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className="mt-1 text-xl font-bold text-zinc-100">{value.toLocaleString("pt-BR")}</p>
      {sub && <p className="text-[10px] text-zinc-500">{sub}</p>}
    </div>
  );
}
