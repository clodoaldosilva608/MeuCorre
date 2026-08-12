"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  Radio,
} from "lucide-react";
import { type SocialChannel } from "@/lib/promotion-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

const VALID_PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "app", label: "Aplicação" },
  { value: "quiz", label: "Quiz" },
];

export function ChannelsView() {
  const [channels, setChannels] = useState<SocialChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SocialChannel | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SocialChannel | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promotion/channels");
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (data: Partial<SocialChannel>) => {
    const method = editing ? "PATCH" : "POST";
    const url = editing
      ? `/api/admin/promotion/channels/${editing.id}`
      : "/api/admin/promotion/channels";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success(editing ? "Canal atualizado" : "Canal criado");
      setOpenDialog(false);
      setEditing(null);
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Erro ao salvar");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/promotion/channels/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Canal removido");
      setDeleteTarget(null);
      load();
    } else {
      toast.error("Erro ao remover");
    }
  };

  const toggleActive = async (ch: SocialChannel) => {
    const res = await fetch(`/api/admin/promotion/channels/${ch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !ch.active }),
    });
    if (res.ok) {
      load();
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando canais...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            Canais oficiais
          </h3>
          <p className="text-xs text-zinc-500">
            Perfis do MeuCorre em cada plataforma
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setOpenDialog(true);
          }}
          className="gap-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo canal
        </Button>
      </div>

      {channels.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <Radio className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">
            Nenhum canal cadastrado
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Crie os canais oficiais do MeuCorre (Instagram, TikTok, YouTube, Facebook, etc).
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((ch) => (
            <div
              key={ch.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-3"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-100">
                      {ch.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="border-zinc-700 text-[10px] text-zinc-400"
                    >
                      {ch.platform}
                    </Badge>
                  </div>
                  {ch.promoTitle && (
                    <p className="mt-1 text-xs text-zinc-400">{ch.promoTitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(ch);
                      setOpenDialog(true);
                    }}
                    className="h-7 w-7 p-0"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteTarget(ch)}
                    className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {ch.promoText && (
                <p className="mt-2 text-xs text-zinc-500 line-clamp-2">
                  {ch.promoText}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between">
                <a
                  href={ch.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Abrir perfil
                </a>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500">
                    {ch.active ? "Ativo" : "Inativo"}
                  </span>
                  <Switch
                    checked={ch.active}
                    onCheckedChange={() => toggleActive(ch)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de edição/criação */}
      <ChannelDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        channel={editing}
        onSave={handleSave}
      />

      {/* Confirmação de exclusão */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover canal?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o canal{" "}
              <strong>{deleteTarget?.name}</strong>? Esta ação não pode ser desfeita.
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
    </div>
  );
}

function ChannelDialog({
  open,
  onOpenChange,
  channel,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  channel: SocialChannel | null;
  onSave: (data: Partial<SocialChannel>) => void;
}) {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [profileUrl, setProfileUrl] = useState("");
  const [promoTitle, setPromoTitle] = useState("");
  const [promoText, setPromoText] = useState("");
  const [active, setActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    // Defer setState to avoid cascading renders warning
    const t = setTimeout(() => {
      if (channel) {
        setName(channel.name);
        setPlatform(channel.platform);
        setProfileUrl(channel.profileUrl);
        setPromoTitle(channel.promoTitle ?? "");
        setPromoText(channel.promoText ?? "");
        setActive(channel.active);
        setSortOrder(channel.sortOrder);
      } else {
        setName("");
        setPlatform("instagram");
        setProfileUrl("");
        setPromoTitle("");
        setPromoText("");
        setActive(true);
        setSortOrder(0);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [channel, open]);

  const handleSave = () => {
    if (!name.trim() || !profileUrl.trim()) {
      toast.error("Nome e URL do perfil são obrigatórios");
      return;
    }
    onSave({
      name,
      platform,
      profileUrl,
      promoTitle: promoTitle || undefined,
      promoText: promoText || undefined,
      active,
      sortOrder,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{channel ? "Editar canal" : "Novo canal"}</DialogTitle>
          <DialogDescription>
            Cadastre um perfil oficial do MeuCorre em uma plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nome *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Instagram"
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Plataforma *</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="mt-1 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VALID_PLATFORMS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">URL do perfil *</Label>
            <Input
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              placeholder="https://instagram.com/meucorr"
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Título promocional</Label>
            <Input
              value={promoTitle}
              onChange={(e) => setPromoTitle(e.target.value)}
              placeholder="Ex: MeuCorre no Instagram"
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Texto promocional</Label>
            <Input
              value={promoText}
              onChange={(e) => setPromoText(e.target.value)}
              placeholder="Descrição curta"
              className="mt-1 text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Ativo</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          <div>
            <Label className="text-xs">Ordem</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="mt-1 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
