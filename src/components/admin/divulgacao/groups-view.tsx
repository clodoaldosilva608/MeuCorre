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
  Users,
  ExternalLink,
  Loader2,
  Search,
  Filter,
  Share2,
  AlertCircle,
} from "lucide-react";

interface SocialGroup {
  id: string;
  name: string;
  platform: string;
  inviteUrl: string;
  memberCount: number | null;
  category: string | null;
  city: string | null;
  notes: string | null;
  active: boolean;
  lastPostedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const PLATFORMS = [
  { value: "whatsapp", label: "WhatsApp", color: "#25D366" },
  { value: "telegram", label: "Telegram", color: "#0088CC" },
  { value: "facebook", label: "Facebook", color: "#1877F2" },
  { value: "instagram", label: "Instagram", color: "#E1306C" },
  { value: "tiktok", label: "TikTok", color: "#00F2EA" },
  { value: "youtube", label: "YouTube", color: "#FF0000" },
];

const CATEGORIES = [
  { value: "entregadores", label: "Entregadores" },
  { value: "moto", label: "Moto / Manutenção" },
  { value: "financas", label: "Finanças" },
  { value: "cidade", label: "Cidade / Regional" },
  { value: "geral", label: "Geral" },
];

function platformLabel(value: string): string {
  return PLATFORMS.find((p) => p.value === value)?.label ?? value;
}

function platformColor(value: string): string {
  return PLATFORMS.find((p) => p.value === value)?.color ?? "#71717a";
}

export function GroupsView() {
  const [groups, setGroups] = useState<SocialGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SocialGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SocialGroup | null>(null);
  const [saving, setSaving] = useState(false);

  // Filtros
  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterActive, setFilterActive] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterPlatform) params.set("platform", filterPlatform);
      if (filterCategory) params.set("category", filterCategory);
      if (filterActive) params.set("active", filterActive);

      const res = await fetch(
        `/api/admin/promotion/groups?${params.toString()}`,
      );
      const data = await res.json();
      if (data.needsMigration) {
        setNeedsMigration(true);
        setGroups([]);
      } else if (res.ok) {
        setGroups(data.groups ?? []);
        setNeedsMigration(false);
      } else {
        toast.error(data.error || "Erro ao carregar grupos");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }, [search, filterPlatform, filterCategory, filterActive]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (groupData: Partial<SocialGroup>) => {
    setSaving(true);
    try {
      const url = editing
        ? `/api/admin/promotion/groups/${editing.id}`
        : "/api/admin/promotion/groups";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupData),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar");
        return;
      }
      toast.success(editing ? "Grupo atualizado" : "Grupo criado");
      setDialogOpen(false);
      load();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(
        `/api/admin/promotion/groups/${deleteTarget.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error();
      toast.success("Grupo removido");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Erro ao remover");
    }
  };

  const handleRunMigration = async () => {
    try {
      const res = await fetch("/api/admin/promotion/migrate", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success > 0) {
        toast.success("Migração aplicada com sucesso!");
        setNeedsMigration(false);
        load();
      } else {
        toast.error("Erro na migração", {
          description: JSON.stringify(data.errors),
        });
      }
    } catch {
      toast.error("Erro de conexão");
    }
  };

  // Stats
  const stats = {
    total: groups.length,
    active: groups.filter((g) => g.active).length,
    byPlatform: PLATFORMS.map((p) => ({
      ...p,
      count: groups.filter((g) => g.platform === p.value).length,
    })).filter((p) => p.count > 0),
    totalMembers: groups.reduce(
      (sum, g) => sum + (g.memberCount ?? 0),
      0,
    ),
  };

  if (needsMigration) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-400">
              Migração necessária
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              A tabela <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-emerald-400">SocialGroup</code> ainda
              não existe no banco de produção. Clique no botão abaixo para
              aplicar a migração (cria tabelas e colunas da Fase 2).
            </p>
            <Button
              onClick={handleRunMigration}
              className="mt-3 bg-amber-500 text-zinc-950 hover:bg-amber-400"
              size="sm"
            >
              Aplicar migração agora
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Ativos" value={stats.active} icon={<Users className="h-4 w-4 text-emerald-400" />} />
        <StatCard
          label="Membros"
          value={stats.totalMembers}
          icon={<Users className="h-4 w-4 text-blue-400" />}
        />
        <StatCard
          label="Plataformas"
          value={stats.byPlatform.length}
          icon={<Filter className="h-4 w-4 text-purple-400" />}
        />
      </div>

      {/* Filtros + botão novo */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar por nome, URL ou notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-zinc-700 bg-zinc-900 text-zinc-100"
          />
        </div>
        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="w-[140px] border-zinc-700 bg-zinc-900 text-zinc-100">
            <SelectValue placeholder="Plataforma" />
          </SelectTrigger>
          <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
            <SelectItem value="">Todas</SelectItem>
            {PLATFORMS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[140px] border-zinc-700 bg-zinc-900 text-zinc-100">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
            <SelectItem value="">Todas</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-[120px] border-zinc-700 bg-zinc-900 text-zinc-100">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="true">Ativos</SelectItem>
            <SelectItem value="false">Inativos</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Novo grupo
        </Button>
      </div>

      {/* Lista de grupos */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando...
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">
            Nenhum grupo cadastrado
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Cadastre grupos de WhatsApp, Telegram, Facebook, etc. para
            compartilhar publicações diretamente.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <GroupRow
              key={group.id}
              group={group}
              onEdit={() => {
                setEditing(group);
                setDialogOpen(true);
              }}
              onDelete={() => setDeleteTarget(group)}
            />
          ))}
        </div>
      )}

      {/* Dialog de criação/edição */}
      <GroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={handleSave}
        saving={saving}
      />

      {/* Confirmação de delete */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover grupo?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta ação não pode ser desfeita. O grupo{" "}
              <strong className="text-zinc-200">{deleteTarget?.name}</strong>{" "}
              será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Remover
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
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase text-zinc-500">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-xl font-bold text-zinc-100">{value}</p>
    </div>
  );
}

function GroupRow({
  group,
  onEdit,
  onDelete,
}: {
  group: SocialGroup;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      {/* Badge da plataforma */}
      <div
        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
        style={{ backgroundColor: `${platformColor(group.platform)}20` }}
      >
        <span
          className="text-[10px] font-bold uppercase"
          style={{ color: platformColor(group.platform) }}
        >
          {platformLabel(group.platform).slice(0, 2)}
        </span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-zinc-100">
            {group.name}
          </p>
          {!group.active && (
            <span className="rounded-full bg-zinc-700 px-1.5 py-0.5 text-[9px] font-bold uppercase text-zinc-300">
              Inativo
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
          <span>{platformLabel(group.platform)}</span>
          {group.category && (
            <>
              <span className="text-zinc-600">•</span>
              <span>{group.category}</span>
            </>
          )}
          {group.city && (
            <>
              <span className="text-zinc-600">•</span>
              <span>{group.city}</span>
            </>
          )}
          {group.memberCount !== null && (
            <>
              <span className="text-zinc-600">•</span>
              <span>{group.memberCount} membros</span>
            </>
          )}
        </div>
        {group.notes && (
          <p className="mt-0.5 truncate text-[11px] text-zinc-500">
            {group.notes}
          </p>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1">
        <a
          href={group.inviteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400"
          title="Abrir grupo"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        <button
          onClick={onEdit}
          className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-blue-400"
          title="Editar"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 hover:bg-red-950/40 hover:text-red-400"
          title="Remover"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function GroupDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
  saving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: SocialGroup | null;
  onSaved: (data: Partial<SocialGroup>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    name: "",
    platform: "whatsapp",
    inviteUrl: "",
    memberCount: "",
    category: "",
    city: "",
    notes: "",
    active: true,
  });

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      if (editing) {
        setForm({
          name: editing.name,
          platform: editing.platform,
          inviteUrl: editing.inviteUrl,
          memberCount: editing.memberCount?.toString() ?? "",
          category: editing.category ?? "",
          city: editing.city ?? "",
          notes: editing.notes ?? "",
          active: editing.active,
        });
      } else {
        setForm({
          name: "",
          platform: "whatsapp",
          inviteUrl: "",
          memberCount: "",
          category: "",
          city: "",
          notes: "",
          active: true,
        });
      }
    }, 0);
    return () => clearTimeout(t);
  }, [open, editing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaved({
      ...form,
      memberCount: form.memberCount ? parseInt(form.memberCount) : null,
      category: form.category || null,
      city: form.city || null,
      notes: form.notes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-y-auto border-zinc-800 bg-zinc-900 p-0 text-zinc-100">
        <DialogHeader className="border-b border-zinc-800 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
            <Users className="h-4 w-4" />
            {editing ? "Editar grupo" : "Novo grupo"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Cadastre grupos de WhatsApp, Telegram, Facebook, etc. para
            compartilhar publicações.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Nome do grupo *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              maxLength={100}
              placeholder="Ex: Galera do iFood SP"
              className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Plataforma *</Label>
              <Select
                value={form.platform}
                onValueChange={(v) => setForm({ ...form, platform: v })}
              >
                <SelectTrigger className="border-zinc-700 bg-zinc-950 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">
                Membros (opcional)
              </Label>
              <Input
                type="number"
                value={form.memberCount}
                onChange={(e) =>
                  setForm({ ...form, memberCount: e.target.value })
                }
                min={0}
                placeholder="Ex: 250"
                className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">
              Link de convite / URL *
            </Label>
            <Input
              value={form.inviteUrl}
              onChange={(e) => setForm({ ...form, inviteUrl: e.target.value })}
              required
              maxLength={500}
              placeholder="Ex: https://chat.whatsapp.com/abc123"
              className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger className="border-zinc-700 bg-zinc-950 text-zinc-100">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
                  <SelectItem value="">—</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Cidade</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                maxLength={100}
                placeholder="Ex: São Paulo"
                className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Notas internas</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              maxLength={500}
              rows={2}
              placeholder="Anotações sobre o grupo (regras, horários, etc.)"
              className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
            />
            Ativo
          </label>

          <DialogFooter className="border-t border-zinc-800 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : editing ? (
                "Salvar alterações"
              ) : (
                "Criar grupo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
