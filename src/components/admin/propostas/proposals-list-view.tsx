"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Loader2,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Check,
  X,
  Send,
  Eye,
  Clock,
} from "lucide-react";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  BILLING_LABELS,
  formatBRL,
  formatDate,
  type Proposal,
  type ProposalStatus,
  type ProposalTemplate,
} from "@/lib/proposal-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  city: string | null;
}

interface Props {
  onSelectPartner?: (id: string) => void;
}

export function ProposalsListView({ onSelectPartner }: Props) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Proposal | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Proposal | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus !== "all") params.set("status", filterStatus);
      params.set("limit", "200");

      const [proposalsRes, partnersRes, templatesRes] = await Promise.all([
        fetch(`/api/admin/proposals?${params}`),
        fetch("/api/admin/partners?limit=200"),
        fetch("/api/admin/proposals/templates"),
      ]);

      if (proposalsRes.ok) {
        const data = await proposalsRes.json();
        setProposals(data.proposals);
      }
      if (partnersRes.ok) {
        const data = await partnersRes.json();
        setPartners(
          data.partners.map((p: PartnerOption & { id: string }) => ({
            id: p.id,
            companyName: p.companyName,
            city: p.city,
          })),
        );
      }
      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data.templates);
      }
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const handleSend = async (p: Proposal) => {
    if (!confirm(`Enviar proposta ${p.number} para ${p.partner?.companyName}? O status mudará para "Enviada" e um link público será gerado.`)) return;
    const res = await fetch(`/api/admin/proposals/${p.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const data = await res.json();
      toast.success("Proposta enviada. Link público gerado.");
      // Copia link para clipboard
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}${data.publicUrl}`,
        );
        toast.info("Link copiado para a área de transferência");
      } catch {
        // ignore
      }
      load();
    } else {
      toast.error("Erro ao enviar proposta");
    }
  };

  const handleApprove = async (p: Proposal) => {
    if (!confirm(`Aprovar proposta ${p.number}?`)) return;
    const res = await fetch(`/api/admin/proposals/${p.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      toast.success("Proposta aprovada");
      load();
    } else {
      toast.error("Erro ao aprovar");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/proposals/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Proposta removida");
      setDeleteTarget(null);
      load();
    } else {
      toast.error("Erro ao remover");
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget || !reason.trim()) {
      toast.error("Motivo é obrigatório");
      return;
    }
    const res = await fetch(`/api/admin/proposals/${rejectTarget.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) {
      toast.success("Proposta rejeitada");
      setRejectTarget(null);
      load();
    } else {
      toast.error("Erro ao rejeitar");
    }
  };

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar por título, número, resumo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-64 pl-8 text-xs"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-32 text-xs">
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
            Nova proposta
          </Button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando propostas...
        </div>
      ) : proposals.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">
            Nenhuma proposta encontrada
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Crie a primeira proposta comercial.
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {proposals.map((p) => (
            <div
              key={p.id}
              className="group rounded-lg border border-zinc-800 bg-zinc-900 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-zinc-500">{p.number} · v{p.version}</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-zinc-100">
                    {p.title}
                  </p>
                </div>
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `${STATUS_COLORS[p.status]}20`,
                    color: STATUS_COLORS[p.status],
                  }}
                >
                  {STATUS_LABELS[p.status]}
                </span>
              </div>

              <button
                onClick={() => p.partner && onSelectPartner?.(p.partnerId)}
                className="mt-1.5 block truncate text-left text-xs text-emerald-400 hover:underline"
              >
                {p.partner?.companyName ?? "—"}
                {p.partner?.city ? ` · ${p.partner.city}` : ""}
              </button>

              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-500">
                {p.billingModel && (
                  <Badge variant="outline" className="border-zinc-700 text-[10px]">
                    {BILLING_LABELS[p.billingModel]}
                  </Badge>
                )}
                {p.campaignPrice !== null && (
                  <span className="text-emerald-400">
                    {formatBRL(p.campaignPrice)}/mês
                  </span>
                )}
                {p.leadPrice !== null && (
                  <span className="text-emerald-400">
                    {formatBRL(p.leadPrice)}/lead
                  </span>
                )}
                {p.validUntil && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {formatDate(p.validUntil)}
                  </span>
                )}
              </div>

              {/* Ações */}
              <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-zinc-800 pt-2">
                {p.status === "draft" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSend(p)}
                    className="h-6 gap-1 px-1.5 text-[10px] text-blue-400 hover:bg-blue-500/10"
                  >
                    <Send className="h-3 w-3" />
                    Enviar
                  </Button>
                )}
                {p.status === "sent" && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleApprove(p)}
                      className="h-6 gap-1 px-1.5 text-[10px] text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <Check className="h-3 w-3" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setRejectTarget(p)}
                      className="h-6 gap-1 px-1.5 text-[10px] text-red-400 hover:bg-red-500/10"
                    >
                      <X className="h-3 w-3" />
                      Rejeitar
                    </Button>
                  </>
                )}
                {p.publicToken && p.status !== "draft" && (
                  <a
                    href={`/propostas/${p.publicToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver link
                  </a>
                )}
                {p.status === "draft" && (
                  <button
                    onClick={() => setDeleteTarget(p)}
                    className="ml-auto text-zinc-600 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de criação */}
      <CreateProposalDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        partners={partners}
        templates={templates}
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
            <AlertDialogTitle>Remover proposta?</AlertDialogTitle>
            <AlertDialogDescription>
              Remover <strong>{deleteTarget?.number}</strong> — {deleteTarget?.title}?
              Apenas propostas em rascunho podem ser removidas.
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
        proposal={rejectTarget}
        onOpenChange={(v) => !v && setRejectTarget(null)}
        onConfirm={handleReject}
      />
    </div>
  );
}

function CreateProposalDialog({
  open,
  onOpenChange,
  partners,
  templates,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  partners: PartnerOption[];
  templates: ProposalTemplate[];
  onCreated: () => void;
}) {
  const [partnerId, setPartnerId] = useState("");
  const [title, setTitle] = useState("");
  const [fromTemplate, setFromTemplate] = useState("");
  const [billingModel, setBillingModel] = useState<string>("none");
  const [campaignPrice, setCampaignPrice] = useState("");
  const [leadPrice, setLeadPrice] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!partnerId || !title.trim()) {
      toast.error("Parceiro e título são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        partnerId,
        title,
        fromTemplate: fromTemplate || undefined,
        billingModel: billingModel !== "none" ? billingModel : undefined,
        campaignPrice: campaignPrice ? Number(campaignPrice) : undefined,
        leadPrice: leadPrice ? Number(leadPrice) : undefined,
        validUntil: validUntil || undefined,
        notes: notes || undefined,
      };
      const res = await fetch("/api/admin/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Proposta criada");
        onCreated();
        // Reset
        setPartnerId("");
        setTitle("");
        setFromTemplate("");
        setBillingModel("none");
        setCampaignPrice("");
        setLeadPrice("");
        setValidUntil("");
        setNotes("");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao criar");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova proposta</DialogTitle>
          <DialogDescription>
            Crie uma proposta comercial. Você pode usar um template para preencher automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Parceiro *</Label>
            <Select value={partnerId} onValueChange={setPartnerId}>
              <SelectTrigger className="mt-1 text-sm">
                <SelectValue placeholder="Selecione o parceiro" />
              </SelectTrigger>
              <SelectContent>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.companyName}
                    {p.city ? ` · ${p.city}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Parceria Q3 2026"
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Template (opcional)</Label>
            <Select value={fromTemplate} onValueChange={setFromTemplate}>
              <SelectTrigger className="mt-1 text-sm">
                <SelectValue placeholder="Começar do zero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Começar do zero</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Modelo de cobrança</Label>
              <Select value={billingModel} onValueChange={setBillingModel}>
                <SelectTrigger className="mt-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  <SelectItem value="campaign">Por campanha</SelectItem>
                  <SelectItem value="lead">Por lead</SelectItem>
                  <SelectItem value="both">Ambos (duplo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Válida até</Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(billingModel === "campaign" || billingModel === "both") && (
              <div>
                <Label className="text-xs">Preço campanha (R$/mês)</Label>
                <Input
                  type="number"
                  value={campaignPrice}
                  onChange={(e) => setCampaignPrice(e.target.value)}
                  placeholder="1500.00"
                  className="mt-1 text-sm"
                />
              </div>
            )}
            {(billingModel === "lead" || billingModel === "both") && (
              <div>
                <Label className="text-xs">Preço por lead (R$)</Label>
                <Input
                  type="number"
                  value={leadPrice}
                  onChange={(e) => setLeadPrice(e.target.value)}
                  placeholder="5.00"
                  className="mt-1 text-sm"
                />
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs">Notas internas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  proposal,
  onOpenChange,
  onConfirm,
}: {
  proposal: Proposal | null;
  onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <Dialog
      open={proposal !== null}
      onOpenChange={(v) => {
        if (!v) setReason("");
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rejeitar proposta</DialogTitle>
          <DialogDescription>
            Informe o motivo da rejeição de <strong>{proposal?.number}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label className="text-xs">Motivo *</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Ex: cliente achou o valor acima do orçamento..."
            className="mt-1 text-sm"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason)}
          >
            Rejeitar proposta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
