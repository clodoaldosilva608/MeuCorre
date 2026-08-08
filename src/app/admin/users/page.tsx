"use client";

import { useEffect, useState, useCallback } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Trash2,
  Crown,
  Mail,
  Phone,
  MapPin,
  Clock,
  Filter,
  KeyRound,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  isPro: boolean;
  licenseKey: string | null;
  phone: string | null;
  city: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

type Filter = "all" | "pro" | "free";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?filter=${filter}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const res = await fetch(`/api/admin/users/${confirmDelete.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Usuário excluído");
      setConfirmDelete(null);
      load();
    } else {
      toast.error("Erro ao excluir");
    }
  };

  const togglePro = async (user: User) => {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPro: !user.isPro }),
    });
    if (res.ok) {
      toast.success(user.isPro ? "PRO revogado" : "PRO concedido! 🎉");
      load();
    } else {
      toast.error("Erro ao atualizar");
    }
  };

  const stats = {
    total: users.length,
    pro: users.filter((u) => u.isPro).length,
    free: users.filter((u) => !u.isPro).length,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-100">
            <Users className="h-5 w-5 text-emerald-400" />
            Usuários
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Gerencie contas de entregadores
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setCreateOpen(true);
          }}
          className="bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Novo usuário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="PRO" value={stats.pro} accent="emerald" />
        <StatCard label="Gratuitos" value={stats.free} />
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-zinc-500" />
        <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          {(["all", "pro", "free"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === f
                  ? "bg-emerald-500 text-zinc-950"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              {f === "all" ? "Todos" : f === "pro" ? "PRO" : "Gratuitos"}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <p className="py-8 text-center text-sm text-zinc-500">Carregando...</p>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <Users className="mx-auto mb-2 h-10 w-10 text-zinc-700" />
          <p className="text-sm font-medium text-zinc-300">
            Nenhum usuário {filter !== "all" ? filter : ""} ainda
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-zinc-100">
                      {u.name}
                    </span>
                    {u.isPro ? (
                      <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                        <Crown className="h-2.5 w-2.5" />
                        PRO
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-[9px] font-medium text-zinc-500">
                        Gratuito
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 space-y-0.5 text-[11px] text-zinc-500">
                    <p className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      {u.email}
                    </p>
                    {u.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" />
                        {u.phone}
                      </p>
                    )}
                    {u.city && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        {u.city}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      Cadastrado em {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                      {u.lastLoginAt && ` • Último login: ${new Date(u.lastLoginAt).toLocaleDateString("pt-BR")}`}
                    </p>
                    {u.licenseKey && (
                      <p className="flex items-center gap-1.5 truncate text-emerald-400/70">
                        <KeyRound className="h-3 w-3" />
                        <code className="font-mono text-[10px]">{u.licenseKey}</code>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500">PRO</span>
                    <Switch
                      checked={u.isPro}
                      onCheckedChange={() => togglePro(u)}
                    />
                  </div>
                  <button
                    onClick={() => setConfirmDelete(u)}
                    aria-label="Excluir usuário"
                    className="grid h-8 w-8 place-items-center rounded text-zinc-400 hover:bg-red-950/40 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog criar usuário */}
      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={load}
      />

      {/* Confirma exclusão */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Excluir <strong className="text-zinc-200">{confirmDelete?.name}</strong> ({confirmDelete?.email})?
              Esta ação não pode ser desfeita. Dados de corridas no dispositivo
              do usuário não serão afetados (ficam no IndexedDB local).
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
}: {
  label: string;
  value: number;
  accent?: "emerald";
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <p className="text-[10px] font-medium text-zinc-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-black ${
          accent === "emerald" ? "text-emerald-400" : "text-zinc-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    isPro: false,
  });
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao criar");
        return;
      }
      toast.success("Usuário criado!" + (form.isPro ? " PRO concedido 🎉" : ""));
      setForm({ name: "", email: "", password: "", phone: "", city: "", isPro: false });
      onOpenChange(false);
      onCreated();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 border-zinc-800 bg-zinc-950 p-0 text-zinc-100">
        <DialogHeader className="border-b border-zinc-800 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
            <Plus className="h-4 w-4" />
            Criar usuário
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Cadastre um entregador manualmente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-3 px-5 py-5">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Nome *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="border-zinc-800 bg-zinc-900 text-zinc-100"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="border-zinc-800 bg-zinc-900 text-zinc-100"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Senha *</Label>
            <Input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
              placeholder="Mín 6 caracteres"
              className="border-zinc-800 bg-zinc-900 text-zinc-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">WhatsApp</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="border-zinc-800 bg-zinc-900 text-zinc-100"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Cidade</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="border-zinc-800 bg-zinc-900 text-zinc-100"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3">
            <Label className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Crown className="h-3 w-3 text-emerald-400" />
              Conceder PRO (vitalício)
            </Label>
            <Switch
              checked={form.isPro}
              onCheckedChange={(v) => setForm({ ...form, isPro: v })}
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
              disabled={saving || !form.name || !form.email || form.password.length < 6}
              className="bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400"
            >
              {saving ? "Criando..." : "Criar usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
