"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Power,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Team {
  id: string;
  name: string;
  description: string | null;
  companyName: string | null;
  cnpj: string | null;
  managerName: string | null;
  managerEmail: string | null;
  managerPhone: string | null;
  active: boolean;
  maxMembers: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { members: number; invites: number };
}

interface TeamMember {
  id: string;
  teamId: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  joinedAt: string;
}

interface TeamInvite {
  id: string;
  teamId: string;
  email: string;
  name: string | null;
  phone: string | null;
  token: string;
  role: string;
  status: string;
  invitedAt: string;
  expiresAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  member: "Membro",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "#10b981",
  admin: "#3b82f6",
  member: "#71717a",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  suspended: "Suspenso",
  removed: "Removido",
};

export function TeamsView() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterActive !== "all") params.set("active", filterActive);
      params.set("limit", "200");
      const res = await fetch(`/api/admin/teams?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams);
      }
    } finally {
      setLoading(false);
    }
  }, [search, filterActive]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team);
    setDrawerOpen(true);
  };

  const handleSave = async (data: Partial<Team>) => {
    const res = await fetch("/api/admin/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("Time criado");
      setOpenDialog(false);
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Erro");
    }
  };

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar time..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-56 pl-8 text-xs"
          />
        </div>
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Ativos</SelectItem>
            <SelectItem value="false">Inativos</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button
            size="sm"
            onClick={() => setOpenDialog(true)}
            className="h-8 gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo time
          </Button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando times...
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">Nenhum time encontrado</p>
          <p className="mt-1 text-xs text-zinc-500">Crie o primeiro time B2B.</p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelectTeam(t)}
              className={`group rounded-lg border p-3 text-left transition-colors ${
                t.active
                  ? "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                  : "border-zinc-800 bg-zinc-950 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-100">{t.name}</p>
                  {t.companyName && (
                    <p className="truncate text-xs text-zinc-500">{t.companyName}</p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={
                    t.active
                      ? "border-emerald-500/30 text-emerald-400 text-[10px]"
                      : "border-zinc-700 text-zinc-500 text-[10px]"
                  }
                >
                  {t.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              {t.description && (
                <p className="mt-1 line-clamp-2 text-[10px] text-zinc-500">{t.description}</p>
              )}

              <div className="mt-2 flex items-center gap-3 text-[10px] text-zinc-500">
                <span>{t._count?.members ?? 0} membros</span>
                <span>{t._count?.invites ?? 0} convites</span>
                <span>limite: {t.maxMembers}</span>
              </div>

              {t.managerEmail && (
                <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-zinc-600">
                  <Mail className="h-2.5 w-2.5" />
                  {t.managerEmail}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Dialog de criação */}
      <CreateTeamDialog open={openDialog} onOpenChange={setOpenDialog} onSave={handleSave} />

      {/* Drawer de detalhe */}
      <TeamDetailDrawer
        team={selectedTeam}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onChanged={load}
      />
    </div>
  );
}

function CreateTeamDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (data: Partial<Team>) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [maxMembers, setMaxMembers] = useState("50");

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    onSave({
      name,
      description: description || undefined,
      companyName: companyName || undefined,
      managerName: managerName || undefined,
      managerEmail: managerEmail || undefined,
      managerPhone: managerPhone || undefined,
      maxMembers: Number(maxMembers) || 50,
    });
    setName("");
    setDescription("");
    setCompanyName("");
    setManagerName("");
    setManagerEmail("");
    setManagerPhone("");
    setMaxMembers("50");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo time</DialogTitle>
          <DialogDescription>
            Crie um time B2B para organizar entregadores de uma empresa.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nome do time *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Empresa</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Gestor</Label>
              <Input value={managerName} onChange={(e) => setManagerName(e.target.value)} className="mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Telefone</Label>
              <Input value={managerPhone} onChange={(e) => setManagerPhone(e.target.value)} className="mt-1 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Email gestor</Label>
              <Input type="email" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} className="mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Limite de membros</Label>
              <Input type="number" value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} className="mt-1 text-sm" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Criar time</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TeamDetailDrawer({
  team,
  open,
  onOpenChange,
  onChanged,
}: {
  team: Team | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChanged: () => void;
}) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"members" | "invites" | "details">("members");

  const load = useCallback(async () => {
    if (!team) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/teams/${team.id}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.team?.members ?? []);
        setInvites(data.team?.invites ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [team]);

  useEffect(() => {
    if (open && team) {
      load();
    }
  }, [open, team, load]);

  const handleInvite = async () => {
    if (!team || !inviteEmail.trim()) {
      toast.error("Email é obrigatório");
      return;
    }
    const res = await fetch(`/api/admin/teams/${team.id}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        name: inviteName || undefined,
        role: inviteRole,
      }),
    });
    if (res.ok) {
      toast.success("Convite criado");
      setInviteEmail("");
      setInviteName("");
      setInviteRole("member");
      setInviteDialog(false);
      load();
      onChanged();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Erro");
    }
  };

  const handleCopyInviteUrl = async (token: string) => {
    const url = `${window.location.origin}/equipes/convite/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
      toast.success("Link de convite copiado");
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const handleMemberRoleChange = async (member: TeamMember, newRole: string) => {
    const res = await fetch(`/api/admin/teams/${team!.id}/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      toast.success("Role atualizada");
      load();
    }
  };

  const handleMemberRemove = async (member: TeamMember) => {
    if (!confirm(`Remover ${member.name} do time?`)) return;
    const res = await fetch(`/api/admin/teams/${team!.id}/members/${member.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Membro removido");
      load();
    }
  };

  const handleCancelInvite = async (invite: TeamInvite) => {
    if (!confirm(`Cancelar convite para ${invite.email}?`)) return;
    const res = await fetch(`/api/admin/teams/${team!.id}/invites/${invite.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (res.ok) {
      toast.success("Convite cancelado");
      load();
    }
  };

  const handleToggleActive = async () => {
    if (!team) return;
    const res = await fetch(`/api/admin/teams/${team.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !team.active }),
    });
    if (res.ok) {
      toast.success(team.active ? "Time desativado" : "Time ativado");
      onChanged();
      onOpenChange(false);
    }
  };

  if (!team) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-zinc-500" />
            {team.name}
            <Badge
              variant="outline"
              className={
                team.active
                  ? "border-emerald-500/30 text-emerald-400 text-[10px]"
                  : "border-zinc-700 text-zinc-500 text-[10px]"
              }
            >
              {team.active ? "Ativo" : "Inativo"}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-zinc-800">
            {[
              { id: "members", label: `Membros (${members.length})` },
              { id: "invites", label: `Convites (${invites.length})` },
              { id: "details", label: "Detalhes" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                className={`border-b-2 px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === t.id
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex h-20 items-center justify-center text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <>
              {/* Tab Membros */}
              {activeTab === "members" && (
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => setInviteDialog(true)} className="h-7 gap-1 text-xs">
                      <UserPlus className="h-3 w-3" />
                      Convidar membro
                    </Button>
                  </div>
                  {members.length === 0 ? (
                    <p className="py-4 text-center text-xs text-zinc-500">Nenhum membro ainda</p>
                  ) : (
                    members.map((m) => (
                      <div key={m.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-2">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-zinc-100">{m.name}</p>
                            <p className="truncate text-[10px] text-zinc-500">{m.email}</p>
                            {m.phone && <p className="text-[10px] text-zinc-600">{m.phone}</p>}
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[9px] ${
                              m.status === "active"
                                ? "border-emerald-500/30 text-emerald-400"
                                : "border-zinc-700 text-zinc-500"
                            }`}
                          >
                            {STATUS_LABELS[m.status] ?? m.status}
                          </Badge>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <Select
                            value={m.role}
                            onValueChange={(v) => handleMemberRoleChange(m, v)}
                          >
                            <SelectTrigger className="h-6 w-32 text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ROLE_LABELS).map(([v, l]) => (
                                <SelectItem key={v} value={v}>
                                  {l}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <button
                            onClick={() => handleMemberRemove(m)}
                            className="text-zinc-600 hover:text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab Convites */}
              {activeTab === "invites" && (
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => setInviteDialog(true)} className="h-7 gap-1 text-xs">
                      <UserPlus className="h-3 w-3" />
                      Novo convite
                    </Button>
                  </div>
                  {invites.length === 0 ? (
                    <p className="py-4 text-center text-xs text-zinc-500">Nenhum convite pendente</p>
                  ) : (
                    invites.map((inv) => (
                      <div key={inv.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-2">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-zinc-100">{inv.email}</p>
                            {inv.name && <p className="text-[10px] text-zinc-500">{inv.name}</p>}
                            <p className="text-[10px] text-zinc-600">
                              Expira em {new Date(inv.expiresAt).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[9px]">
                            {ROLE_LABELS[inv.role] ?? inv.role}
                          </Badge>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <button
                            onClick={() => handleCopyInviteUrl(inv.token)}
                            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-emerald-400 hover:bg-emerald-500/10"
                          >
                            {copiedToken === inv.token ? (
                              <>
                                <Check className="h-3 w-3" />
                                Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Copiar link
                              </>
                            )}
                          </button>
                          <a
                            href={`/equipes/convite/${inv.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-zinc-400 hover:bg-zinc-800"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Abrir
                          </a>
                          <button
                            onClick={() => handleCancelInvite(inv)}
                            className="text-zinc-600 hover:text-red-400"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab Detalhes */}
              {activeTab === "details" && (
                <div className="space-y-2 text-xs">
                  <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
                    <p className="text-[10px] text-zinc-500">Empresa</p>
                    <p className="text-zinc-300">{team.companyName ?? "—"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
                      <p className="text-[10px] text-zinc-500">Gestor</p>
                      <p className="text-zinc-300">{team.managerName ?? "—"}</p>
                    </div>
                    <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
                      <p className="text-[10px] text-zinc-500">Email gestor</p>
                      <p className="truncate text-zinc-300">{team.managerEmail ?? "—"}</p>
                    </div>
                  </div>
                  <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
                    <p className="text-[10px] text-zinc-500">Descrição</p>
                    <p className="text-zinc-300">{team.description ?? "—"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
                      <p className="text-[10px] text-zinc-500">Limite membros</p>
                      <p className="text-zinc-300">{team.maxMembers}</p>
                    </div>
                    <div className="rounded border border-zinc-800 bg-zinc-900 p-2">
                      <p className="text-[10px] text-zinc-500">Criado em</p>
                      <p className="text-zinc-300">
                        {new Date(team.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleToggleActive}
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                  >
                    <Power className="h-3.5 w-3.5" />
                    {team.active ? "Desativar time" : "Reativar time"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Dialog de convite */}
        <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Convidar membro</DialogTitle>
              <DialogDescription>
                O convidado receberá um link único para aceitar o convite.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Email *</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Nome (opcional)</Label>
                <Input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="mt-1 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialog(false)}>Cancelar</Button>
              <Button onClick={handleInvite}>Criar convite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
