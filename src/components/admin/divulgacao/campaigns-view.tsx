"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Loader2,
  Calendar,
  Upload,
  Sparkles,
} from "lucide-react";
import { type Campaign } from "@/lib/promotion-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  selectedCampaignId: string | null;
  onSelectCampaign: (id: string | null) => void;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativa",
  paused: "Pausada",
  completed: "Concluída",
  archived: "Arquivada",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-700/50 text-zinc-300",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  paused: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  completed: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  archived: "bg-zinc-800 text-zinc-500",
};

export function CampaignsView({ selectedCampaignId, onSelectCampaign }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promotion/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns);
        // Auto-seleciona primeira campanha se nenhuma selecionada
        if (!selectedCampaignId && data.campaigns.length > 0) {
          onSelectCampaign(data.campaigns[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCampaignId, onSelectCampaign]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (data: Partial<Campaign>) => {
    const res = await fetch("/api/admin/promotion/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const { campaign } = await res.json();
      toast.success("Campanha criada");
      setOpenDialog(false);
      onSelectCampaign(campaign.id);
      load();
    } else {
      toast.error("Erro ao criar campanha");
    }
  };

  const handleImport = async () => {
    if (
      !confirm(
        "Importar as 450 postagens do Plano 90 Dias? Isso pode levar alguns segundos. A operação é idempotente (pode ser repetida).",
      )
    )
      return;
    setImporting(true);
    try {
      const res = await fetch("/api/admin/promotion/posts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(
          `Importação concluída: ${data.created} criadas, ${data.updated} atualizadas, ${data.errors} erros`,
        );
        onSelectCampaign(data.campaignId);
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Erro na importação");
      }
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando campanhas...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Campanhas</h3>
          <p className="text-xs text-zinc-500">
            Campanhas editoriais do MeuCorre
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleImport}
            disabled={importing}
            className="gap-1.5 border-zinc-700 text-xs"
          >
            {importing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Importar Plano 90 Dias
          </Button>
          <Button
            size="sm"
            onClick={() => setOpenDialog(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova campanha
          </Button>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <Calendar className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">
            Nenhuma campanha cadastrada
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Importe o Plano 90 Dias para criar a campanha com 450 postagens, ou
            crie uma campanha manualmente.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button
              size="sm"
              onClick={handleImport}
              disabled={importing}
              className="gap-1.5 text-xs"
            >
              {importing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              Importar 450 postagens
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCampaign(c.id)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                selectedCampaignId === c.id
                  ? "border-emerald-500 bg-emerald-500/5"
                  : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-sm font-semibold text-zinc-100">
                    {c.name}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={STATUS_COLORS[c.status] ?? "border-zinc-700"}
                >
                  {STATUS_LABELS[c.status] ?? c.status}
                </Badge>
              </div>
              {c.description && (
                <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2">
                  {c.description}
                </p>
              )}
              <div className="mt-2 flex items-center gap-3 text-[10px] text-zinc-500">
                <span>{c._count?.posts ?? 0} posts</span>
                {c.startAt && <span>início: {new Date(c.startAt).toLocaleDateString("pt-BR")}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      <CampaignDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        onSave={handleCreate}
      />
    </div>
  );
}

function CampaignDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (data: Partial<Campaign>) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [color, setColor] = useState("#10b981");
  const [status, setStatus] = useState("draft");

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    onSave({
      name,
      description: description || undefined,
      objective: objective || undefined,
      color,
      status: status as Campaign["status"],
    });
    setName("");
    setDescription("");
    setObjective("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova campanha</DialogTitle>
          <DialogDescription>
            Crie uma campanha editorial para organizar suas postagens.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nome *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Lançamento Outubro 2026"
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição da campanha"
              className="mt-1 text-sm"
              rows={2}
            />
          </div>

          <div>
            <Label className="text-xs">Objetivo</Label>
            <Input
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Ex: Aumentar bases de trial"
              className="mt-1 text-sm"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-xs">Cor</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-12 rounded border border-zinc-700 bg-transparent"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex-1">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="paused">Pausada</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="archived">Arquivada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Criar campanha</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
