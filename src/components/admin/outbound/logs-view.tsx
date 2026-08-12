"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Search,
  Check,
  X,
  Send,
  Eye,
  Copy,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Plus,
} from "lucide-react";
import {
  CHANNEL_LABELS,
  CHANNEL_COLORS,
  CHANNEL_ICONS,
  LOG_STATUS_LABELS,
  LOG_STATUS_COLORS,
  CLASSIFICATION_LABELS,
  CLASSIFICATION_COLORS,
  CLASSIFICATION_NEXT_ACTIONS,
  formatDateTime,
  type OutboundLog,
  type OutboundLogStatus,
  type ResponseClassification,
  type OutboundChannel,
} from "@/lib/outbound-types";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface PartnerOption {
  id: string;
  companyName: string;
  contacts: Array<{
    id: string;
    name: string;
    optOut: boolean;
  }>;
}

interface TemplateOption {
  id: string;
  name: string;
  channel: OutboundChannel;
  status: string;
}

export function LogsView() {
  const [logs, setLogs] = useState<OutboundLog[]>([]);
  const [byStatus, setByStatus] = useState<Array<{ status: string; _count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [filterClassification, setFilterClassification] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<OutboundLog | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [prepareOpen, setPrepareOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterChannel !== "all") params.set("channel", filterChannel);
      if (filterClassification !== "all") params.set("classification", filterClassification);
      params.set("limit", "200");
      const res = await fetch(`/api/admin/outbound/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setByStatus(data.byStatus ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterChannel, filterClassification]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleSelectLog = (log: OutboundLog) => {
    setSelectedLog(log);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-3">
      {/* Stats por status */}
      {byStatus.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-xs">
          <span className="text-zinc-500">Por status:</span>
          {byStatus.map((s) => (
            <Badge key={s.status} variant="outline" className="border-zinc-700 text-[10px]">
              {LOG_STATUS_LABELS[s.status as OutboundLogStatus] ?? s.status}: {s._count}
            </Badge>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar mensagem..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-56 pl-8 text-xs"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {Object.entries(LOG_STATUS_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterChannel} onValueChange={setFilterChannel}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos canais</SelectItem>
            {Object.entries(CHANNEL_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterClassification} onValueChange={setFilterClassification}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder="Classificação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas classificações</SelectItem>
            {Object.entries(CLASSIFICATION_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button
            size="sm"
            onClick={() => setPrepareOpen(true)}
            className="h-8 gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Preparar mensagens
          </Button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando mensagens...
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <Send className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">
            Nenhuma mensagem encontrada
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Prepare mensagens a partir de templates aprovados.
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {logs.map((log) => (
            <LogCard key={log.id} log={log} onClick={() => handleSelectLog(log)} />
          ))}
        </div>
      )}

      {/* Drawer de detalhe */}
      <LogDetailDrawer
        log={selectedLog}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onChanged={refresh}
      />

      {/* Dialog preparar */}
      <PrepareDialog
        open={prepareOpen}
        onOpenChange={setPrepareOpen}
        onPrepared={() => {
          setPrepareOpen(false);
          refresh();
        }}
      />
    </div>
  );
}

function LogCard({ log, onClick }: { log: OutboundLog; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-left transition-colors hover:border-zinc-700"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className="grid h-4 w-4 place-items-center rounded text-[9px] font-bold text-white"
              style={{ backgroundColor: CHANNEL_COLORS[log.channel] }}
            >
              {CHANNEL_ICONS[log.channel]}
            </span>
            <p className="truncate text-xs font-semibold text-zinc-100">
              {log.partner?.companyName ?? "—"}
            </p>
          </div>
          <p className="mt-0.5 truncate text-[10px] text-zinc-500">
            → {log.contact?.name ?? "—"}
            {log.contact?.optOut && (
              <span className="ml-1 text-red-400">⚠ opt-out</span>
            )}
          </p>
        </div>
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium"
          style={{
            backgroundColor: `${LOG_STATUS_COLORS[log.status]}20`,
            color: LOG_STATUS_COLORS[log.status],
          }}
        >
          {LOG_STATUS_LABELS[log.status]}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-[10px] text-zinc-400">
        {log.renderedBody}
      </p>

      {log.responseClassification && (
        <div className="mt-1.5 flex items-center gap-1">
          <span
            className="rounded px-1 py-0.5 text-[9px] font-medium"
            style={{
              backgroundColor: `${CLASSIFICATION_COLORS[log.responseClassification]}20`,
              color: CLASSIFICATION_COLORS[log.responseClassification],
            }}
          >
            {CLASSIFICATION_LABELS[log.responseClassification]}
          </span>
          {log.responseClassifiedByMethod === "ai" && (
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[9px]">
              <Sparkles className="mr-0.5 h-2 w-2" />
              IA
            </Badge>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-[9px] text-zinc-600">
        <span>{formatDateTime(log.updatedAt)}</span>
        {log.template && <span>{log.template.name}</span>}
      </div>
    </button>
  );
}

function LogDetailDrawer({
  log,
  open,
  onOpenChange,
  onChanged,
}: {
  log: OutboundLog | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChanged: () => void;
}) {
  const [responseText, setResponseText] = useState("");
  const [classification, setClassification] = useState<string>("none");
  const [classifying, setClassifying] = useState<"manual" | "ai" | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setResponseText(log?.responseText ?? "");
      setClassification(log?.responseClassification ?? "none");
    }, 0);
    return () => clearTimeout(t);
  }, [log?.id, log?.responseText, log?.responseClassification, open]);

  const handleCopy = async () => {
    if (!log) return;
    const parts = [log.renderedSubject, log.renderedBody, log.renderedCta].filter(Boolean);
    await navigator.clipboard.writeText(parts.join("\n\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Mensagem copiada");
  };

  const handleApprove = async () => {
    if (!log) return;
    const res = await fetch(`/api/admin/outbound/logs/${log.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      toast.success("Mensagem aprovada (pronta para envio manual)");
      onChanged();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Erro");
    }
  };

  const handleSend = async () => {
    if (!log) return;
    if (!confirm("Confirmar envio MANUAL? Você já deve ter colado a mensagem no canal escolhido e enviado. Esta ação apenas REGISTRA que o envio foi feito.")) return;
    const res = await fetch(`/api/admin/outbound/logs/${log.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      toast.success("Envio registrado");
      onChanged();
    } else {
      const err = await res.json().catch(() => ({}));
      if (err.error === "FEATURE_FLAG_OFF") {
        toast.error("Feature flag partner_outbound_send_enabled está OFF. Ative em /admin/flags.");
      } else {
        toast.error(err.message ?? err.error ?? "Erro");
      }
    }
  };

  const handleOptOut = async () => {
    if (!log) return;
    if (!confirm(`Marcar ${log.contact?.name} como OPT-OUT PERMANENTE? Esta ação NÃO pode ser desfeita.`)) return;
    const res = await fetch(`/api/admin/outbound/logs/${log.id}/opt-out`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      toast.success("Opt-out permanente registrado");
      onChanged();
    }
  };

  const handleClassify = async (method: "manual" | "ai") => {
    if (!log) return;
    if (method === "manual" && classification === "none") {
      toast.error("Selecione uma classificação");
      return;
    }
    if (method === "ai" && !responseText.trim()) {
      toast.error("Cole o texto da resposta para classificar por IA");
      return;
    }
    setClassifying(method);
    try {
      const body: Record<string, unknown> = { method };
      if (method === "manual") {
        body.classification = classification;
      }
      if (responseText) {
        body.responseText = responseText;
      }
      const res = await fetch(`/api/admin/outbound/logs/${log.id}/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        if (method === "ai") {
          setClassification(data.classification);
          toast.success(`IA classificou: ${data.classificationLabel}`);
        } else {
          toast.success("Classificação manual registrada");
        }
        if (data.contactMarkedOptOut) {
          toast.warning("Contato marcado como opt-out PERMANENTE");
        }
        if (data.riskAlerted) {
          toast.error("⚠ Risco detectado — alerta registrado");
        }
        onChanged();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao classificar");
      }
    } finally {
      setClassifying(null);
    }
  };

  if (!log) return null;

  const isOptOut = log.contact?.optOut === true;
  const canApprove = log.status === "preparado";
  const canSend = log.status === "aguardando_aprovacao";
  const canClassify = ["enviado", "respondeu", "interessado", "reuniao_marcada", "proposta_enviada", "negociacao"].includes(log.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <span
              className="grid h-5 w-5 place-items-center rounded text-[10px] font-bold text-white"
              style={{ backgroundColor: CHANNEL_COLORS[log.channel] }}
            >
              {CHANNEL_ICONS[log.channel]}
            </span>
            <span>{log.partner?.companyName}</span>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${LOG_STATUS_COLORS[log.status]}20`,
                color: LOG_STATUS_COLORS[log.status],
              }}
            >
              {LOG_STATUS_LABELS[log.status]}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {/* Aviso opt-out */}
          {isOptOut && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-2 text-xs text-red-300">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              <div>
                <p className="font-medium">CONTATO EM OPT-OUT PERMANENTE</p>
                <p className="mt-0.5 text-red-400/80">
                  Este contato pediu para não receber mais mensagens. NUNCA selecionar para envio.
                </p>
              </div>
            </div>
          )}

          {/* Info do contato */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-zinc-500">Parceiro</p>
                <p className="text-zinc-300">{log.partner?.companyName}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500">Contato</p>
                <p className="text-zinc-300">{log.contact?.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500">Email</p>
                <p className="text-zinc-300">{log.contact?.email ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500">Telefone</p>
                <p className="text-zinc-300">{log.contact?.phone ?? "—"}</p>
              </div>
            </div>
          </div>

          {/* Mensagem renderizada */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label className="text-xs">Mensagem (renderizada)</Label>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-zinc-400 hover:bg-zinc-800"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copiar
                  </>
                )}
              </button>
            </div>
            {log.renderedSubject && (
              <div className="mb-1 rounded border border-zinc-800 bg-zinc-900 p-2 text-xs">
                <p className="text-[10px] text-zinc-500">Assunto</p>
                <p className="text-zinc-200">{log.renderedSubject}</p>
              </div>
            )}
            <div className="rounded border border-zinc-800 bg-zinc-900 p-2 text-xs">
              <p className="whitespace-pre-wrap text-zinc-200">{log.renderedBody}</p>
            </div>
            {log.renderedCta && (
              <div className="mt-1 rounded border border-zinc-800 bg-zinc-900 p-2 text-xs">
                <p className="text-[10px] text-zinc-500">CTA</p>
                <p className="text-zinc-200">{log.renderedCta}</p>
              </div>
            )}
          </div>

          {/* Ações principais */}
          <div className="flex flex-wrap gap-2">
            {canApprove && !isOptOut && (
              <Button onClick={handleApprove} size="sm" className="gap-1.5 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Aprovar (dry-run OK)
              </Button>
            )}
            {canSend && !isOptOut && (
              <Button onClick={handleSend} size="sm" className="gap-1.5 text-xs">
                <Send className="h-3.5 w-3.5" />
                Registrar envio manual
              </Button>
            )}
            {!isOptOut && log.status !== "opt_out" && (
              <Button
                onClick={handleOptOut}
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs text-red-400 hover:bg-red-500/10"
              >
                <X className="h-3.5 w-3.5" />
                Marcar opt-out
              </Button>
            )}
          </div>

          {/* Linha do tempo */}
          <div className="rounded border border-zinc-800 bg-zinc-900 p-2 text-[10px] text-zinc-500">
            <p>Criado: {formatDateTime(log.createdAt)}</p>
            {log.approvedAt && <p>Aprovado: {formatDateTime(log.approvedAt)} por {log.approvedByEmail}</p>}
            {log.sentAt && <p>Enviado: {formatDateTime(log.sentAt)} por {log.sentByEmail}</p>}
            {log.responseClassifiedAt && (
              <p>
                Classificado: {formatDateTime(log.responseClassifiedAt)} por{" "}
                {log.responseClassifiedByEmail} ({log.responseClassifiedByMethod})
              </p>
            )}
          </div>

          {/* Classificação de resposta */}
          {(canClassify || log.responseClassification) && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <Label className="text-xs">Classificação de resposta</Label>

              {/* Texto da resposta */}
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Cole aqui a resposta recebida..."
                rows={3}
                className="mt-1 text-xs"
              />

              {/* Classificação manual */}
              <div className="mt-2">
                <Label className="text-[10px] text-zinc-500">Classificar manualmente</Label>
                <Select
                  value={classification}
                  onValueChange={setClassification}
                >
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {Object.entries(CLASSIFICATION_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-2 flex gap-2">
                <Button
                  onClick={() => handleClassify("manual")}
                  disabled={classifying !== null || classification === "none"}
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                >
                  {classifying === "manual" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  Classificar manual
                </Button>
                <Button
                  onClick={() => handleClassify("ai")}
                  disabled={classifying !== null || !responseText.trim()}
                  size="sm"
                  className="gap-1.5 text-xs"
                >
                  {classifying === "ai" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Classificar com IA
                </Button>
              </div>

              {/* Próxima ação sugerida */}
              {log.responseClassification && (
                <div className="mt-2 rounded bg-zinc-950 p-2 text-[10px]">
                  <p className="text-zinc-500">Próxima ação sugerida:</p>
                  <p className="text-zinc-300">
                    {CLASSIFICATION_NEXT_ACTIONS[log.responseClassification]}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function PrepareDialog({
  open,
  onOpenChange,
  onPrepared,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPrepared: () => void;
}) {
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [channel, setChannel] = useState<OutboundChannel>("whatsapp");
  const [preparing, setPreparing] = useState(false);

  useEffect(() => {
    if (open) {
      // Carrega parceiros com contatos (sem opt-out) e templates aprovados
      Promise.all([
        fetch("/api/admin/partners?limit=200").then((r) => r.json()),
        fetch("/api/admin/outbound/templates?status=approved&limit=100").then((r) => r.json()),
      ]).then(([p, t]) => {
        setPartners(p.partners ?? []);
        setTemplates(t.templates ?? []);
      });
    }
  }, [open]);

  const selectedPartner = partners.find((p) => p.id === selectedPartnerId);

  const toggleContact = (id: string) => {
    setSelectedContactIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePrepare = async () => {
    if (!selectedContactIds.size || !selectedTemplateId) {
      toast.error("Selecione pelo menos 1 contato e 1 template");
      return;
    }
    setPreparing(true);
    try {
      const items = Array.from(selectedContactIds).map((contactId) => ({
        partnerId: selectedPartnerId,
        contactId,
        templateId: selectedTemplateId,
        channel,
      }));
      const res = await fetch("/api/admin/outbound/logs/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(
          `${data.created} mensagens preparadas, ${data.blocked} bloqueadas (opt-out), ${data.errors} erros`,
        );
        onPrepared();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Erro");
      }
    } finally {
      setPreparing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>Preparar mensagens (lote)</DialogTitle>
          <DialogDescription>
            Gera mensagens renderizadas a partir de um template aprovado.
            Contatos com opt-out NUNCA são selecionados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Template aprovado *</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className="mt-1 text-sm">
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {CHANNEL_ICONS[t.channel]} {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templates.length === 0 && (
              <p className="mt-1 text-[10px] text-amber-400">
                Nenhum template aprovado. Aprove um template primeiro.
              </p>
            )}
          </div>

          <div>
            <Label className="text-xs">Canal de envio *</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as OutboundChannel)}>
              <SelectTrigger className="mt-1 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CHANNEL_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {CHANNEL_ICONS[v as OutboundChannel]} {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Parceiro *</Label>
            <Select
              value={selectedPartnerId}
              onValueChange={(v) => {
                setSelectedPartnerId(v);
                setSelectedContactIds(new Set());
              }}
            >
              <SelectTrigger className="mt-1 text-sm">
                <SelectValue placeholder="Selecione um parceiro" />
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

          {selectedPartner && (
            <div>
              <Label className="text-xs">
                Contatos ({selectedPartner.contacts.filter((c) => !c.optOut).length} disponíveis, {selectedPartner.contacts.filter((c) => c.optOut).length} em opt-out)
              </Label>
              <div className="mt-1 max-h-48 space-y-1 overflow-y-auto rounded border border-zinc-800 p-2">
                {selectedPartner.contacts.length === 0 ? (
                  <p className="py-2 text-center text-[10px] text-zinc-500">
                    Nenhum contato cadastrado para este parceiro.
                  </p>
                ) : (
                  selectedPartner.contacts.map((c) => (
                    <label
                      key={c.id}
                      className={`flex items-center gap-2 rounded p-1.5 text-xs ${
                        c.optOut ? "opacity-50" : "hover:bg-zinc-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedContactIds.has(c.id)}
                        onChange={() => toggleContact(c.id)}
                        disabled={c.optOut}
                        className="h-3 w-3"
                      />
                      <span className="flex-1 text-zinc-200">{c.name}</span>
                      {c.optOut && (
                        <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-[9px]">
                          opt-out
                        </Badge>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handlePrepare}
            disabled={preparing || !selectedContactIds.size || !selectedTemplateId}
          >
            {preparing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
            Preparar {selectedContactIds.size} mensagem(ns)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
