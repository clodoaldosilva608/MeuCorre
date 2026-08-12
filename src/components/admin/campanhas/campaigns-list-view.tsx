"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Tag,
  Loader2,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Check,
  X,
  Send,
  Pause,
  Play,
  Flag,
  BarChart3,
  Eye,
  MousePointerClick,
  TrendingUp,
  Gift,
  AlertCircle,
  Calendar,
  MapPin,
} from "lucide-react";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  BILLING_LABELS,
  formatBRL,
  formatDate,
  type PartnerCampaign,
} from "@/lib/campaign-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface PartnerOption {
  id: string;
  companyName: string;
}

interface Props {
  onSelectPartner?: (id: string) => void;
}

interface Stats {
  totalCampaigns: number;
  totalViews: number;
  totalClicks: number;
  totalLeads: number;
  totalRedemptions: number;
  totalReports: number;
}

export function CampaignsListView({ onSelectPartner }: Props) {
  const [campaigns, setCampaigns] = useState<PartnerCampaign[]>([]);
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PartnerCampaign | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PartnerCampaign | null>(null);
  const [reportTarget, setReportTarget] = useState<PartnerCampaign | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus !== "all") params.set("status", filterStatus);
      params.set("limit", "200");

      const [campaignsRes, partnersRes] = await Promise.all([
        fetch(`/api/admin/partner-campaigns?${params}`),
        fetch("/api/admin/partners?limit=200"),
      ]);

      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        setCampaigns(data.campaigns);
        setStats(data.stats);
      }
      if (partnersRes.ok) {
        const data = await partnersRes.json();
        setPartners(
          data.partners.map((p: PartnerOption) => ({
            id: p.id,
            companyName: p.companyName,
          })),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const handleAction = async (
    campaign: PartnerCampaign,
    action: "approve" | "publish" | "pause" | "reject" | "report",
    extra?: Record<string, unknown>,
  ) => {
    const res = await fetch(`/api/admin/partner-campaigns/${campaign.id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(extra ?? {}),
    });
    if (res.ok) {
      const data = await res.json();
      const actionLabels: Record<string, string> = {
        approve: "aprovada",
        publish: "publicada",
        pause: "pausada",
        reject: "rejeitada",
        report: "denúncia registrada",
      };
      toast.success(`Campanha ${actionLabels[action]}`);
      if (action === "reject") setRejectTarget(null);
      if (action === "report") setReportTarget(null);
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Erro");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/partner-campaigns/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Campanha removida");
      setDeleteTarget(null);
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Erro ao remover");
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats globais */}
      {stats && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total" value={stats.totalCampaigns} icon={<Tag className="h-3 w-3" />} />
          <StatCard label="Views" value={stats.totalViews} icon={<Eye className="h-3 w-3" />} color="text-blue-400" />
          <StatCard label="Cliques" value={stats.totalClicks} icon={<MousePointerClick className="h-3 w-3" />} color="text-purple-400" />
          <StatCard label="Leads" value={stats.totalLeads} icon={<TrendingUp className="h-3 w-3" />} color="text-emerald-400" />
          <StatCard label="Resgates" value={stats.totalRedemptions} icon={<Gift className="h-3 w-3" />} color="text-amber-400" />
          <StatCard label="Denúncias" value={stats.totalReports} icon={<Flag className="h-3 w-3" />} color="text-red-400" />
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar campanha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-56 pl-8 text-xs"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button
            size="sm"
            onClick={() => setOpenDialog(true)}
            className="h-8 gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova campanha
          </Button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando campanhas...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <Tag className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">
            Nenhuma campanha encontrada
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Crie a primeira campanha de parceiro.
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              onSelectPartner={onSelectPartner}
              onApprove={() => handleAction(c, "approve")}
              onPublish={() => handleAction(c, "publish")}
              onPause={() => handleAction(c, "pause")}
              onReject={() => setRejectTarget(c)}
              onReport={() => setReportTarget(c)}
              onDelete={() => setDeleteTarget(c)}
            />
          ))}
        </div>
      )}

      {/* Dialog de criação */}
      <CreateCampaignDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        partners={partners}
        onCreated={() => {
          setOpenDialog(false);
          load();
        }}
      />

      {/* Confirmação de exclusão */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              Remover <strong>{deleteTarget?.name}</strong>?
              Apenas campanhas em rascunho ou canceladas podem ser removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de rejeição */}
      <RejectDialog
        campaign={rejectTarget}
        onOpenChange={(v) => !v && setRejectTarget(null)}
        onConfirm={(reason) => {
          if (rejectTarget) handleAction(rejectTarget, "reject", { reason });
        }}
      />

      {/* Dialog de denúncia */}
      <ReportDialog
        campaign={reportTarget}
        onOpenChange={(v) => !v && setReportTarget(null)}
        onConfirm={(reason) => {
          if (reportTarget) handleAction(reportTarget, "report", { reason });
        }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color = "text-zinc-400",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase text-zinc-500">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-base font-bold text-zinc-100">{value.toLocaleString("pt-BR")}</p>
    </div>
  );
}

function CampaignCard({
  campaign,
  onSelectPartner,
  onApprove,
  onPublish,
  onPause,
  onReject,
  onReport,
  onDelete,
}: {
  campaign: PartnerCampaign;
  onSelectPartner?: (id: string) => void;
  onApprove: () => void;
  onPublish: () => void;
  onPause: () => void;
  onReject: () => void;
  onReport: () => void;
  onDelete: () => void;
}) {
  const ctr = campaign.views > 0 ? (campaign.clicks / campaign.views) * 100 : 0;

  return (
    <div className="group rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-100">{campaign.name}</p>
          <button
            onClick={() => onSelectPartner?.(campaign.partnerId)}
            className="mt-0.5 block truncate text-left text-xs text-emerald-400 hover:underline"
          >
            {campaign.partner?.companyName ?? "—"}
          </button>
        </div>
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{
            backgroundColor: `${STATUS_COLORS[campaign.status]}20`,
            color: STATUS_COLORS[campaign.status],
          }}
        >
          {STATUS_LABELS[campaign.status]}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-xs text-zinc-400">{campaign.offerTitle}</p>
      {campaign.discountText && (
        <Badge className="mt-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
          <Gift className="mr-0.5 h-2.5 w-2.5" />
          {campaign.discountText}
        </Badge>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
        {campaign.couponCode && (
          <Badge variant="outline" className="border-zinc-700 text-[10px]">
            Cupom: {campaign.couponCode}
          </Badge>
        )}
        {campaign.billingModel && (
          <span>{BILLING_LABELS[campaign.billingModel as keyof typeof BILLING_LABELS] ?? campaign.billingModel}</span>
        )}
        {campaign.campaignPrice !== null && (
          <span className="text-emerald-400">{formatBRL(campaign.campaignPrice)}/mês</span>
        )}
        {campaign.leadPrice !== null && (
          <span className="text-emerald-400">{formatBRL(campaign.leadPrice)}/lead</span>
        )}
      </div>

      {(campaign.city || campaign.endsAt) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-zinc-600">
          {campaign.city && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5" />
              {campaign.city}
              {campaign.state ? `/${campaign.state}` : ""}
            </span>
          )}
          {campaign.endsAt && (
            <span className="flex items-center gap-0.5">
              <Calendar className="h-2.5 w-2.5" />
              até {formatDate(campaign.endsAt)}
            </span>
          )}
        </div>
      )}

      {/* Métricas */}
      {campaign.status === "published" && (
        <div className="mt-2 grid grid-cols-4 gap-1 rounded bg-zinc-950 p-1.5 text-center text-[10px]">
          <div>
            <p className="text-zinc-600">Views</p>
            <p className="font-semibold text-zinc-300">{campaign.views}</p>
          </div>
          <div>
            <p className="text-zinc-600">Clicks</p>
            <p className="font-semibold text-zinc-300">{campaign.clicks}</p>
          </div>
          <div>
            <p className="text-zinc-600">Leads</p>
            <p className="font-semibold text-emerald-400">{campaign.leads}</p>
          </div>
          <div>
            <p className="text-zinc-600">CTR</p>
            <p className="font-semibold text-blue-400">{ctr.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Denúncias */}
      {campaign.reportsCount > 0 && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-red-400">
          <Flag className="h-2.5 w-2.5" />
          {campaign.reportsCount} denúncia{campaign.reportsCount === 1 ? "" : "s"}
        </div>
      )}

      {/* Ações */}
      <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-zinc-800 pt-2">
        {campaign.status === "draft" && (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={onApprove}
              className="h-6 gap-1 px-1.5 text-[10px] text-emerald-400 hover:bg-emerald-500/10"
            >
              <Check className="h-3 w-3" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onReject}
              className="h-6 gap-1 px-1.5 text-[10px] text-red-400 hover:bg-red-500/10"
            >
              <X className="h-3 w-3" />
              Rejeitar
            </Button>
          </>
        )}
        {campaign.status === "approved" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onPublish}
            className="h-6 gap-1 px-1.5 text-[10px] text-blue-400 hover:bg-blue-500/10"
          >
            <Send className="h-3 w-3" />
            Publicar
          </Button>
        )}
        {campaign.status === "published" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onPause}
            className="h-6 gap-1 px-1.5 text-[10px] text-amber-400 hover:bg-amber-500/10"
          >
            <Pause className="h-3 w-3" />
            Pausar
          </Button>
        )}
        {campaign.status === "paused" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onPublish}
            className="h-6 gap-1 px-1.5 text-[10px] text-emerald-400 hover:bg-emerald-500/10"
          >
            <Play className="h-3 w-3" />
            Reativar
          </Button>
        )}
        {(campaign.status === "published" || campaign.status === "paused") && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onReport}
            className="h-6 gap-1 px-1.5 text-[10px] text-red-400 hover:bg-red-500/10"
          >
            <Flag className="h-3 w-3" />
            Denunciar
          </Button>
        )}
        {campaign.offerUrl && (
          <a
            href={campaign.offerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-zinc-400 hover:bg-zinc-800"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {(campaign.status === "draft" || campaign.status === "canceled") && (
          <button
            onClick={onDelete}
            className="ml-auto text-zinc-600 hover:text-red-400"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function CreateCampaignDialog({
  open,
  onOpenChange,
  partners,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  partners: PartnerOption[];
  onCreated: () => void;
}) {
  const [partnerId, setPartnerId] = useState("");
  const [name, setName] = useState("");
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [offerCta, setOfferCta] = useState("Aproveitar");
  const [offerUrl, setOfferUrl] = useState("https://");
  const [couponCode, setCouponCode] = useState("");
  const [discountText, setDiscountText] = useState("");
  const [category, setCategory] = useState("servicos");
  const [city, setCity] = useState("Recife");
  const [state, setState] = useState("PE");
  const [proOnly, setProOnly] = useState(false);
  const [endsAt, setEndsAt] = useState("");
  const [billingModel, setBillingModel] = useState("campaign");
  const [campaignPrice, setCampaignPrice] = useState("");
  const [leadPrice, setLeadPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!partnerId || !name.trim() || !offerTitle.trim() || !offerDescription.trim() || !offerUrl.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/partner-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId,
          name,
          offerTitle,
          offerDescription,
          offerCta,
          offerUrl,
          couponCode: couponCode || undefined,
          discountText: discountText || undefined,
          category,
          city,
          state,
          proOnly,
          endsAt: endsAt || undefined,
          billingModel,
          campaignPrice: campaignPrice ? Number(campaignPrice) : undefined,
          leadPrice: leadPrice ? Number(leadPrice) : undefined,
        }),
      });
      if (res.ok) {
        toast.success("Campanha criada");
        onCreated();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Erro");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova campanha de parceiro</DialogTitle>
          <DialogDescription>
            Crie uma oferta para ser exibida no app do entregador. A campanha precisa ser aprovada antes de publicar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="text-xs">Parceiro *</Label>
            <Select value={partnerId} onValueChange={setPartnerId}>
              <SelectTrigger className="mt-1 text-sm">
                <SelectValue placeholder="Selecione o parceiro" />
              </SelectTrigger>
              <SelectContent>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label className="text-xs">Nome interno *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Campanha Hamburgueria Corre Duro"
              className="mt-1 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="text-xs">Título da oferta (exibido no app) *</Label>
            <Input
              value={offerTitle}
              onChange={(e) => setOfferTitle(e.target.value)}
              placeholder="Ex: 15% OFF para entregadores"
              className="mt-1 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="text-xs">Descrição da oferta *</Label>
            <Textarea
              value={offerDescription}
              onChange={(e) => setOfferDescription(e.target.value)}
              placeholder="Descreva a oferta..."
              rows={2}
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">CTA</Label>
            <Input value={offerCta} onChange={(e) => setOfferCta(e.target.value)} className="mt-1 text-sm" />
          </div>
          <div>
            <Label className="text-xs">URL de destino *</Label>
            <Input value={offerUrl} onChange={(e) => setOfferUrl(e.target.value)} className="mt-1 text-sm" />
          </div>

          <div>
            <Label className="text-xs">Cupom</Label>
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="MEUCORRE10"
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Texto do desconto</Label>
            <Input
              value={discountText}
              onChange={(e) => setDiscountText(e.target.value)}
              placeholder="10% OFF"
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="servicos">Serviços</SelectItem>
                <SelectItem value="equipamentos">Equipamentos</SelectItem>
                <SelectItem value="combustivel">Combustível</SelectItem>
                <SelectItem value="seguro">Seguro</SelectItem>
                <SelectItem value="ferramentas">Ferramentas</SelectItem>
                <SelectItem value="alimentacao">Alimentação</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Expira em</Label>
            <Input
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Cidade-alvo</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Estado</Label>
            <Input
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
              maxLength={2}
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Modelo de cobrança</Label>
            <Select value={billingModel} onValueChange={setBillingModel}>
              <SelectTrigger className="mt-1 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="campaign">Por campanha</SelectItem>
                <SelectItem value="lead">Por lead</SelectItem>
                <SelectItem value="both">Ambos (duplo)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-3">
            {(billingModel === "campaign" || billingModel === "both") && (
              <div className="flex-1">
                <Label className="text-xs">Campanha R$/mês</Label>
                <Input
                  type="number"
                  value={campaignPrice}
                  onChange={(e) => setCampaignPrice(e.target.value)}
                  placeholder="1500"
                  className="mt-1 text-sm"
                />
              </div>
            )}
            {(billingModel === "lead" || billingModel === "both") && (
              <div className="flex-1">
                <Label className="text-xs">Lead R$</Label>
                <Input
                  type="number"
                  value={leadPrice}
                  onChange={(e) => setLeadPrice(e.target.value)}
                  placeholder="5"
                  className="mt-1 text-sm"
                />
              </div>
            )}
          </div>

          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="proOnly"
              checked={proOnly}
              onChange={(e) => setProOnly(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            <Label htmlFor="proOnly" className="text-xs">
              Apenas usuários PRO (upsell)
            </Label>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded bg-blue-500/5 p-2 text-[10px] text-blue-300">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <p>
            A campanha será criada em status "draft". Você precisará aprová-la e publicá-la
            manualmente. Não afeta anúncios existentes (tabela Ad) — é uma camada adicional.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
            Criar campanha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  campaign,
  onOpenChange,
  onConfirm,
}: {
  campaign: PartnerCampaign | null;
  onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <Dialog
      open={campaign !== null}
      onOpenChange={(v) => {
        if (!v) setReason("");
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rejeitar campanha</DialogTitle>
          <DialogDescription>
            Informe o motivo da rejeição de <strong>{campaign?.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label className="text-xs">Motivo *</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Ex: oferta não atende aos critérios..."
            className="mt-1 text-sm"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={() => onConfirm(reason)}>
            Rejeitar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReportDialog({
  campaign,
  onOpenChange,
  onConfirm,
}: {
  campaign: PartnerCampaign | null;
  onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <Dialog
      open={campaign !== null}
      onOpenChange={(v) => {
        if (!v) setReason("");
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar denúncia</DialogTitle>
          <DialogDescription>
            Denunciar <strong>{campaign?.name}</strong>.
            {campaign && campaign.reportsCount >= 2 && (
              <span className="mt-1 block text-red-400">
                ⚠️ Esta campanha tem {campaign.reportsCount} denúncia(s). Uma nova denúncia pausará automaticamente a campanha.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label className="text-xs">Motivo *</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Ex: oferta enganosa, cupom não funciona..."
            className="mt-1 text-sm"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={() => onConfirm(reason)}>
            Denunciar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
