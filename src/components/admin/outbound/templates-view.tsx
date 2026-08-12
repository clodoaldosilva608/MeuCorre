"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare,
  Loader2,
  Plus,
  Search,
  Trash2,
  Send,
  Eye,
  Copy,
  Check,
  GitBranch,
  AlertCircle,
} from "lucide-react";
import {
  CHANNEL_LABELS,
  CHANNEL_COLORS,
  CHANNEL_ICONS,
  OBJECTIVE_LABELS,
  TEMPLATE_STATUS_LABELS,
  TEMPLATE_STATUS_COLORS,
  type OutboundTemplate,
  type OutboundChannel,
  type OutboundObjective,
  type OutboundTemplateStatus,
} from "@/lib/outbound-types";
import { STANDARD_VARIABLES } from "@/lib/outbound-variables";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";

export function TemplatesView() {
  const [templates, setTemplates] = useState<OutboundTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<OutboundTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<OutboundTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterChannel !== "all") params.set("channel", filterChannel);
      if (filterStatus !== "all") params.set("status", filterStatus);
      params.set("limit", "200");
      const res = await fetch(`/api/admin/outbound/templates?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates);
      }
    } finally {
      setLoading(false);
    }
  }, [search, filterChannel, filterStatus]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const handleSave = async (data: Partial<OutboundTemplate>) => {
    const method = editing ? "PATCH" : "POST";
    const url = editing
      ? `/api/admin/outbound/templates/${editing.id}`
      : "/api/admin/outbound/templates";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success(editing ? "Template atualizado" : "Template criado");
      setOpenDialog(false);
      setEditing(null);
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Erro ao salvar");
    }
  };

  const handleArchive = async (t: OutboundTemplate) => {
    if (!confirm(`Arquivar template "${t.name}" (v${t.version})?`)) return;
    const res = await fetch(`/api/admin/outbound/templates/${t.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Template arquivado");
      load();
    }
  };

  const handleNewVersion = async (t: OutboundTemplate) => {
    if (!confirm(`Criar nova versão do template "${t.name}"? A versão atual (v${t.version}) será arquivada.`)) return;
    const res = await fetch(`/api/admin/outbound/templates/${t.id}/version`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const data = await res.json();
      toast.success(`Nova versão criada (v${data.template.version})`);
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Erro ao criar versão");
    }
  };

  const handleStatusChange = async (t: OutboundTemplate, newStatus: OutboundTemplateStatus) => {
    const res = await fetch(`/api/admin/outbound/templates/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      toast.success(`Status: ${TEMPLATE_STATUS_LABELS[newStatus]}`);
      load();
    }
  };

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar template..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-56 pl-8 text-xs"
          />
        </div>
        <Select value={filterChannel} onValueChange={setFilterChannel}>
          <SelectTrigger className="h-8 w-32 text-xs">
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
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {Object.entries(TEMPLATE_STATUS_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setOpenDialog(true);
            }}
            className="h-8 gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo template
          </Button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando templates...
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <MessageSquare className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">
            Nenhum template encontrado
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Crie templates de mensagem para prospecção supervisionada.
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className="group rounded-lg border border-zinc-800 bg-zinc-900 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="grid h-5 w-5 place-items-center rounded text-[10px] font-bold text-white"
                      style={{ backgroundColor: CHANNEL_COLORS[t.channel] }}
                    >
                      {CHANNEL_ICONS[t.channel]}
                    </span>
                    <p className="truncate text-sm font-semibold text-zinc-100">
                      {t.name}
                    </p>
                  </div>
                  <p className="mt-0.5 text-[10px] text-zinc-500">
                    v{t.version} · {OBJECTIVE_LABELS[t.objective]}
                    {t.segment ? ` · ${t.segment}` : ""}
                  </p>
                </div>
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `${TEMPLATE_STATUS_COLORS[t.status]}20`,
                    color: TEMPLATE_STATUS_COLORS[t.status],
                  }}
                >
                  {TEMPLATE_STATUS_LABELS[t.status]}
                </span>
              </div>

              <p className="mt-2 line-clamp-3 text-xs text-zinc-400">
                {t.body}
              </p>

              {t.variables && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.variables.split(",").slice(0, 5).map((v) => (
                    <Badge key={v} variant="outline" className="border-zinc-700 text-[9px]">
                      {`{${v}}`}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mt-2 flex items-center justify-between border-t border-zinc-800 pt-2 text-[10px] text-zinc-500">
                <span>{t._count?.logs ?? 0} mensagens</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setPreviewTemplate(t);
                      setPreviewOpen(true);
                    }}
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                    title="Preview (dry-run)"
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleNewVersion(t)}
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                    title="Nova versão"
                  >
                    <GitBranch className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => {
                      setEditing(t);
                      setOpenDialog(true);
                    }}
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                    title="Editar"
                  >
                    <Send className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleArchive(t)}
                    className="rounded p-1 text-zinc-500 hover:text-red-400"
                    title="Arquivar"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Quick status change */}
              {t.status !== "archived" && (
                <Select
                  value={t.status}
                  onValueChange={(v) => handleStatusChange(t, v as OutboundTemplateStatus)}
                >
                  <SelectTrigger className="mt-2 h-6 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEMPLATE_STATUS_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialog de criação/edição */}
      <TemplateDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        template={editing}
        onSave={handleSave}
      />

      {/* Sheet de preview/dry-run */}
      <DryRunSheet
        template={previewTemplate}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}

function TemplateDialog({
  open,
  onOpenChange,
  template,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: OutboundTemplate | null;
  onSave: (data: Partial<OutboundTemplate>) => void;
}) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<OutboundChannel>("whatsapp");
  const [segment, setSegment] = useState("");
  const [objective, setObjective] = useState<OutboundObjective>("permission");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [cta, setCta] = useState("");
  const [optOutText, setOptOutText] = useState("Responda PARE para não receber mais mensagens");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<OutboundTemplateStatus>("draft");

  useEffect(() => {
    const t = setTimeout(() => {
      if (template) {
        setName(template.name);
        setChannel(template.channel);
        setSegment(template.segment ?? "");
        setObjective(template.objective);
        setSubject(template.subject ?? "");
        setBody(template.body);
        setCta(template.cta ?? "");
        setOptOutText(template.optOutText ?? "");
        setNotes(template.notes ?? "");
        setStatus(template.status);
      } else {
        setName("");
        setChannel("whatsapp");
        setSegment("");
        setObjective("permission");
        setSubject("");
        setBody("Olá {NOME}! Aqui é do MeuCorre, o app que ajuda entregadores a organizar corridas e despesas.\n\nVi que a {EMPRESA} em {CIDADE}/{ESTADO} atende muitos entregadores. Topa uma parceria?\n\n{MOTIVO}");
        setCta("Posso te mandar mais informações?");
        setOptOutText("Responda PARE para não receber mais mensagens");
        setNotes("");
        setStatus("draft");
      }
    }, 0);
    return () => clearTimeout(t);
  }, [template, open]);

  const handleSave = () => {
    if (!name.trim() || !body.trim()) {
      toast.error("name e body são obrigatórios");
      return;
    }
    if (channel === "email" && !subject.trim()) {
      toast.error("subject é obrigatório para email");
      return;
    }
    onSave({
      name,
      channel,
      segment: segment || undefined,
      objective,
      subject: subject || undefined,
      body,
      cta: cta || undefined,
      optOutText: optOutText || undefined,
      notes: notes || undefined,
      status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {template ? `Editar template (v${template.version})` : "Novo template"}
          </DialogTitle>
          <DialogDescription>
            Crie templates de mensagem com variáveis. Use {`{NOME}`}, {`{EMPRESA}`}, {`{CIDADE}`}, {`{ESTADO}`}, {`{CATEGORIA}`}, {`{MOTIVO}`}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="text-xs">Nome *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Oficina local — primeiro contato"
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Canal *</Label>
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
            <Label className="text-xs">Objetivo *</Label>
            <Select value={objective} onValueChange={(v) => setObjective(v as OutboundObjective)}>
              <SelectTrigger className="mt-1 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(OBJECTIVE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Segmento</Label>
            <Input
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              placeholder="oficina-recife"
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as OutboundTemplateStatus)}>
              <SelectTrigger className="mt-1 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TEMPLATE_STATUS_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {channel === "email" && (
            <div className="sm:col-span-2">
              <Label className="text-xs">Assunto * (email)</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <Label className="text-xs">
              Corpo da mensagem * (use {`{VARIAVEL}`})
            </Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="mt-1 font-mono text-sm"
            />
            <div className="mt-1 flex flex-wrap gap-1">
              {STANDARD_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  onClick={() => setBody((b) => b + `{${v.key}}`)}
                  className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-700"
                  title={v.description}
                >
                  {`{${v.key}}`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">CTA</Label>
            <Input
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Texto de opt-out</Label>
            <Input
              value={optOutText}
              onChange={(e) => setOptOutText(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>
            {template ? "Salvar alterações" : "Criar template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DryRunSheet({
  template,
  open,
  onOpenChange,
}: {
  template: OutboundTemplate | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({
    NOME: "João",
    EMPRESA: "Oficina do Zé",
    CIDADE: "Recife",
    ESTADO: "PE",
    CATEGORIA: "oficina",
    MOTIVO: "",
    TELEFONE: "(81) 99999-9999",
    EMAIL: "joao@oficina.com",
    CARGO: "Proprietário",
  });
  const [result, setResult] = useState<{
    rendered: { subject: string | null; body: string; cta: string | null; optOutText: string | null };
    missingVariables: string[];
    warnings: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const runDryRun = async () => {
    if (!template) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/outbound/templates/${template.id}/dry-run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview: previewVars }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        if (data.warnings?.length > 0) {
          toast.warning(data.warnings.join("; "));
        } else {
          toast.success("Preview gerado");
        }
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Erro no dry-run");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const parts = [
      result.rendered.subject,
      result.rendered.body,
      result.rendered.cta,
      result.rendered.optOutText,
    ].filter(Boolean);
    await navigator.clipboard.writeText(parts.join("\n\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Mensagem copiada");
  };

  if (!template) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="text-base">
            Preview (dry-run) — {template.name} v{template.version}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2 text-[10px] text-amber-300">
            <AlertCircle className="mr-1 inline h-3 w-3" />
            DRY-RUN — nada é enviado. Preview apenas.
          </div>

          {/* Variáveis editáveis */}
          <div>
            <Label className="text-xs">Variáveis de preview</Label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {Object.entries(previewVars).map(([k, v]) => (
                <div key={k}>
                  <Label className="text-[10px] text-zinc-500">{`{${k}}`}</Label>
                  <Input
                    value={v}
                    onChange={(e) =>
                      setPreviewVars((p) => ({ ...p, [k]: e.target.value }))
                    }
                    className="h-7 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={runDryRun}
            disabled={loading}
            size="sm"
            className="w-full gap-1.5 text-xs"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            Gerar preview
          </Button>

          {/* Resultado */}
          {result && (
            <div className="space-y-2">
              {result.rendered.subject && (
                <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
                  <p className="text-[10px] font-medium text-zinc-500">Assunto</p>
                  <p className="mt-0.5 text-sm text-zinc-200">{result.rendered.subject}</p>
                </div>
              )}
              <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
                <p className="text-[10px] font-medium text-zinc-500">Corpo</p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-200">
                  {result.rendered.body}
                </p>
              </div>
              {result.rendered.cta && (
                <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
                  <p className="text-[10px] font-medium text-zinc-500">CTA</p>
                  <p className="mt-0.5 text-sm text-zinc-200">{result.rendered.cta}</p>
                </div>
              )}
              {result.rendered.optOutText && (
                <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
                  <p className="text-[10px] font-medium text-zinc-500">Opt-out</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{result.rendered.optOutText}</p>
                </div>
              )}
              {result.missingVariables.length > 0 && (
                <div className="rounded border border-amber-500/30 bg-amber-500/5 p-2 text-[10px] text-amber-300">
                  Variáveis não substituídas: {result.missingVariables.join(", ")}
                </div>
              )}
              <Button
                onClick={handleCopy}
                size="sm"
                variant="outline"
                className="w-full gap-1.5 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copiar mensagem completa
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
