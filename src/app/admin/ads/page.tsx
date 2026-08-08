"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Megaphone,
  Eye,
  MousePointerClick,
  ExternalLink,
} from "lucide-react";

interface Ad {
  id: string;
  title: string;
  description: string | null;
  cta: string;
  url: string | null;
  imageUrl: string | null;
  bgColor: string;
  textColor: string;
  placement: string;
  active: boolean;
  startsAt: Date;
  endsAt: Date | null;
  clicks: number;
  views: number;
  createdAt: Date;
}

const PLACEMENTS = [
  { value: "banner_top", label: "Banner no topo", desc: "Faixa horizontal no topo do app" },
  { value: "card_list", label: "Card entre listas", desc: "Card patrocinado entre as corridas" },
  { value: "splash", label: "Splash patrocinado", desc: "Banner na tela de carregamento" },
];

const PLACEMENT_LABELS: Record<string, string> = {
  banner_top: "Banner topo",
  card_list: "Card lista",
  splash: "Splash",
};

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Ad | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Ad | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/ads");
    if (res.ok) {
      const data = await res.json();
      setAds(data.ads);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Fetch inicial dos dados (padrão legítimo de carregamento).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleSave = async (data: Partial<Ad>) => {
    if (editing) {
      const res = await fetch(`/api/admin/ads/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Anúncio atualizado");
        setDialogOpen(false);
        load();
      } else {
        toast.error("Erro ao atualizar");
      }
    } else {
      const res = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Anúncio criado");
        setDialogOpen(false);
        load();
      } else {
        const err = await res.json();
        toast.error("Erro ao criar", { description: err.error });
      }
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const res = await fetch(`/api/admin/ads/${confirmDelete.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Anúncio excluído");
      setConfirmDelete(null);
      load();
    }
  };

  const toggleActive = async (ad: Ad) => {
    await fetch(`/api/admin/ads/${ad.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !ad.active }),
    });
    load();
  };

  const stats = {
    total: ads.length,
    active: ads.filter((a) => a.active).length,
    views: ads.reduce((s, a) => s + a.views, 0),
    clicks: ads.reduce((s, a) => s + a.clicks, 0),
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-100">
            <Megaphone className="h-5 w-5 text-emerald-400" />
            Anúncios
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Gerencie anúncios de parceiros exibidos no app
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Novo anúncio
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Ativos" value={stats.active} accent="emerald" />
        <StatCard
          label="Visualizações"
          value={stats.views}
          icon={<Eye className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="Cliques"
          value={stats.clicks}
          icon={<MousePointerClick className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Lista */}
      {loading ? (
        <p className="py-8 text-center text-sm text-zinc-500">Carregando...</p>
      ) : ads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <Megaphone className="mx-auto mb-2 h-10 w-10 text-zinc-700" />
          <p className="text-sm font-medium text-zinc-300">
            Nenhum anúncio cadastrado
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Clique em &ldquo;Novo anúncio&rdquo; para começar
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            >
              {/* Preview thumbnail */}
              <div
                className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg text-xs font-bold"
                style={{
                  backgroundColor: ad.bgColor,
                  color: ad.textColor,
                }}
              >
                {ad.imageUrl ? (
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  ad.title.charAt(0).toUpperCase()
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-zinc-100">
                    {ad.title}
                  </span>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium ${
                      ad.active
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {ad.active ? "ativo" : "inativo"}
                  </span>
                  <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400">
                    {PLACEMENT_LABELS[ad.placement] ?? ad.placement}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {ad.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointerClick className="h-3 w-3" />
                    {ad.clicks}
                  </span>
                  {ad.url && (
                    <span className="flex items-center gap-1 truncate">
                      <ExternalLink className="h-3 w-3" />
                      {ad.url}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Switch
                  checked={ad.active}
                  onCheckedChange={() => toggleActive(ad)}
                  aria-label="Ativar/desativar"
                />
                <button
                  onClick={() => {
                    setEditing(ad);
                    setDialogOpen(true);
                  }}
                  className="grid h-8 w-8 place-items-center rounded text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setConfirmDelete(ad)}
                  className="grid h-8 w-8 place-items-center rounded text-zinc-400 hover:bg-red-950/40 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      <AdForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSave={handleSave}
      />

      {/* Delete confirm */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anúncio?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Excluir <strong className="text-zinc-200">{confirmDelete?.title}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-800 text-zinc-300 hover:bg-zinc-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent?: "emerald";
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500">
        {icon}
        {label}
      </div>
      <p
        className={`mt-1 text-2xl font-black ${
          accent === "emerald" ? "text-emerald-400" : "text-zinc-100"
        }`}
      >
        {value.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}

// ===== Form =====

function AdForm({
  open,
  onOpenChange,
  editing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Ad | null;
  onSave: (data: Partial<Ad>) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    cta: "Saiba mais",
    url: "",
    imageUrl: "",
    bgColor: "#10b981",
    textColor: "#09090b",
    placement: "banner_top",
    active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Reset do form quando abre (padrão legítimo de sync com prop open).
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    if (editing) {
      setForm({
        title: editing.title,
        description: editing.description ?? "",
        cta: editing.cta,
        url: editing.url ?? "",
        imageUrl: editing.imageUrl ?? "",
        bgColor: editing.bgColor,
        textColor: editing.textColor,
        placement: editing.placement,
        active: editing.active,
      });
    } else {
      setForm({
        title: "",
        description: "",
        cta: "Saiba mais",
        url: "",
        imageUrl: "",
        bgColor: "#10b981",
        textColor: "#09090b",
        placement: "banner_top",
        active: true,
      });
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      url: form.url || undefined,
      imageUrl: form.imageUrl || undefined,
      description: form.description || undefined,
    });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md gap-0 overflow-y-auto border-zinc-800 bg-zinc-950 p-0 text-zinc-100">
        <DialogHeader className="border-b border-zinc-800 px-5 py-4">
          <DialogTitle className="text-base font-bold text-emerald-400">
            {editing ? "Editar anúncio" : "Novo anúncio"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Configure o conteúdo e onde ele aparece no app
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {/* Placement */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Posição no app</Label>
            <Select
              value={form.placement}
              onValueChange={(v) => setForm({ ...form, placement: v })}
            >
              <SelectTrigger className="border-zinc-800 bg-zinc-900 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                {PLACEMENTS.map((p) => (
                  <SelectItem
                    key={p.value}
                    value={p.value}
                    className="focus:bg-zinc-800"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{p.label}</span>
                      <span className="text-[10px] text-zinc-500">{p.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Título *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Oficina do João - 10% off"
              required
              maxLength={80}
              className="border-zinc-800 bg-zinc-900 text-zinc-100 focus:border-emerald-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Ex: Troca de óleo com 10% de desconto para entregadores"
              rows={2}
              maxLength={150}
              className="resize-none border-zinc-800 bg-zinc-900 text-zinc-100 focus:border-emerald-500"
            />
          </div>

          {/* CTA + URL */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Texto do botão</Label>
              <Input
                value={form.cta}
                onChange={(e) => setForm({ ...form, cta: e.target.value })}
                placeholder="Saiba mais"
                maxLength={20}
                className="border-zinc-800 bg-zinc-900 text-zinc-100 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">URL de destino</Label>
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
                type="url"
                className="border-zinc-800 bg-zinc-900 text-zinc-100 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">
              URL da imagem (opcional)
            </Label>
            <Input
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://.../logo.png"
              type="url"
              className="border-zinc-800 bg-zinc-900 text-zinc-100 focus:border-emerald-500"
            />
          </div>

          {/* Cores */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Cor de fundo</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.bgColor}
                  onChange={(e) =>
                    setForm({ ...form, bgColor: e.target.value })
                  }
                  className="h-9 w-12 cursor-pointer rounded border border-zinc-800 bg-zinc-900"
                />
                <Input
                  value={form.bgColor}
                  onChange={(e) =>
                    setForm({ ...form, bgColor: e.target.value })
                  }
                  className="border-zinc-800 bg-zinc-900 text-zinc-100"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Cor do texto</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.textColor}
                  onChange={(e) =>
                    setForm({ ...form, textColor: e.target.value })
                  }
                  className="h-9 w-12 cursor-pointer rounded border border-zinc-800 bg-zinc-900"
                />
                <Input
                  value={form.textColor}
                  onChange={(e) =>
                    setForm({ ...form, textColor: e.target.value })
                  }
                  className="border-zinc-800 bg-zinc-900 text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Preview</Label>
            <div
              className="flex items-center gap-3 rounded-xl p-3"
              style={{
                backgroundColor: form.bgColor,
                color: form.textColor,
              }}
            >
              {form.imageUrl ? (
                <img
                  src={form.imageUrl}
                  alt=""
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <div
                  className="grid h-10 w-10 place-items-center rounded-lg text-base font-bold"
                  style={{
                    backgroundColor: `${form.textColor}22`,
                  }}
                >
                  {form.title.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {form.title || "Título do anúncio"}
                </p>
                <p className="truncate text-[11px] opacity-80">
                  {form.description || "Descrição do anúncio"}
                </p>
              </div>
              <span
                className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold"
                style={{
                  backgroundColor: form.textColor,
                  color: form.bgColor,
                }}
              >
                {form.cta}
              </span>
            </div>
          </div>

          {/* Active */}
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3">
            <Label className="text-xs text-zinc-400">
              Anúncio ativo (visível no app)
            </Label>
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || !form.title}
              className="bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400"
            >
              {saving ? "Salvando..." : editing ? "Salvar" : "Criar anúncio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
