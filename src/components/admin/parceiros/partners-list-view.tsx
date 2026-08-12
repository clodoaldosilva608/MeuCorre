"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Building2,
  Search,
  Loader2,
  Plus,
  MapPin,
  Tag,
  Phone,
  Mail,
  Pencil,
  Trash2,
  ChevronRight,
} from "lucide-react";
import {
  STAGE_LABELS,
  STAGE_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  STATUS_LABELS,
  CATEGORY_LABELS,
  formatBRL,
  formatDate,
  type Partner,
  type PartnerStage,
  type PartnerPriority,
  type PartnerStatus,
} from "@/lib/partner-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Props {
  onSelectPartner: (id: string) => void;
  onPartnerChanged?: () => void;
}

export function PartnersListView({ onSelectPartner, onPartnerChanged }: Props) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterCity, setFilterCity] = useState<string>("");
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStage !== "all") params.set("stage", filterStage);
      if (filterPriority !== "all") params.set("priority", filterPriority);
      if (filterCategory !== "all") params.set("category", filterCategory);
      if (filterCity) params.set("city", filterCity);
      params.set("limit", "200");
      const res = await fetch(`/api/admin/partners?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [search, filterStage, filterPriority, filterCategory, filterCity]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const handleSave = async (data: Partial<Partner>) => {
    const method = editing ? "PATCH" : "POST";
    const url = editing
      ? `/api/admin/partners/${editing.id}`
      : "/api/admin/partners";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success(editing ? "Parceiro atualizado" : "Parceiro criado");
      setOpenDialog(false);
      setEditing(null);
      load();
      onPartnerChanged?.();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Erro ao salvar");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/partners/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Parceiro removido");
      setDeleteTarget(null);
      load();
      onPartnerChanged?.();
    } else {
      toast.error("Erro ao remover");
    }
  };

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar por nome, CNPJ, email, telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-72 pl-8 text-xs"
          />
        </div>

        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Estágio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos estágios</SelectItem>
            {Object.entries(STAGE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas prioridades</SelectItem>
            {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Cidade"
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          className="h-8 w-32 text-xs"
        />

        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="border-zinc-700 text-xs">
            {total} {total === 1 ? "parceiro" : "parceiros"}
          </Badge>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setOpenDialog(true);
            }}
            className="h-8 gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo parceiro
          </Button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando parceiros...
        </div>
      ) : partners.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">
            Nenhum parceiro encontrado
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Ajuste os filtros ou crie o primeiro parceiro.
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((p) => (
            <div
              key={p.id}
              className="group rounded-lg border border-zinc-800 bg-zinc-900 p-3 transition-colors hover:border-zinc-700"
            >
              <button
                onClick={() => onSelectPartner(p.id)}
                className="block w-full text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-100">
                      {p.companyName}
                    </p>
                    {p.tradeName && p.tradeName !== p.companyName && (
                      <p className="truncate text-xs text-zinc-500">
                        {p.tradeName}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600 group-hover:text-zinc-400" />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: `${STAGE_COLORS[p.stage]}20`,
                      color: STAGE_COLORS[p.stage],
                    }}
                  >
                    {STAGE_LABELS[p.stage]}
                  </span>
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: `${PRIORITY_COLORS[p.priority]}20`,
                      color: PRIORITY_COLORS[p.priority],
                    }}
                  >
                    {PRIORITY_LABELS[p.priority]}
                  </span>
                  {p.category && (
                    <Badge variant="outline" className="border-zinc-700 text-[10px]">
                      {CATEGORY_LABELS[p.category] ?? p.category}
                    </Badge>
                  )}
                </div>

                <div className="mt-2 space-y-0.5 text-[10px] text-zinc-500">
                  {p.city && (
                    <p className="flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      {p.city}
                      {p.state ? `/${p.state}` : ""}
                    </p>
                  )}
                  {p.phone && (
                    <p className="flex items-center gap-1">
                      <Phone className="h-2.5 w-2.5" />
                      {p.phone}
                    </p>
                  )}
                  {p.email && (
                    <p className="flex items-center gap-1 truncate">
                      <Mail className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </p>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-zinc-800 pt-2 text-[10px] text-zinc-500">
                  <span>
                    {p._count?.contacts ?? 0} contatos · {p._count?.opportunities ?? 0} op.
                  </span>
                  {p.potentialValue && (
                    <span className="font-medium text-emerald-400">
                      {formatBRL(p.potentialValue)}
                    </span>
                  )}
                  {p.assignedTo && (
                    <span className="text-zinc-600">
                      {p.assignedTo}
                    </span>
                  )}
                </div>
              </button>

              <div className="mt-2 flex items-center justify-end gap-1 border-t border-zinc-800 pt-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(p);
                    setOpenDialog(true);
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteTarget(p)}
                  className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de edição/criação */}
      <PartnerDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        partner={editing}
        onSave={handleSave}
      />

      {/* Confirmação de exclusão */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover parceiro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deleteTarget?.companyName}</strong>?
              Todos os contatos, oportunidades, atividades e logs serão removidos.
              Esta ação não pode ser desfeita.
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

function PartnerDialog({
  open,
  onOpenChange,
  partner,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  partner: Partner | null;
  onSave: (data: Partial<Partner>) => void;
}) {
  const [companyName, setCompanyName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("Recife");
  const [state, setState] = useState("PE");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [assignedTo, setAssignedTo] = useState("Clodoaldo Silva");
  const [priority, setPriority] = useState<PartnerPriority>("media");
  const [stage, setStage] = useState<PartnerStage>("novo_lead");
  const [tags, setTags] = useState("");
  const [potentialValue, setPotentialValue] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      if (partner) {
        setCompanyName(partner.companyName);
        setTradeName(partner.tradeName ?? "");
        setCnpj(partner.cnpj ?? "");
        setCategory(partner.category ?? "");
        setCity(partner.city ?? "Recife");
        setState(partner.state ?? "PE");
        setAddress(partner.address ?? "");
        setWebsite(partner.website ?? "");
        setPhone(partner.phone ?? "");
        setEmail(partner.email ?? "");
        setAssignedTo(partner.assignedTo ?? "Clodoaldo Silva");
        setPriority(partner.priority);
        setStage(partner.stage);
        setTags(partner.tags ?? "");
        setPotentialValue(partner.potentialValue?.toString() ?? "");
        setNotes(partner.notes ?? "");
      } else {
        setCompanyName("");
        setTradeName("");
        setCnpj("");
        setCategory("");
        setCity("Recife");
        setState("PE");
        setAddress("");
        setWebsite("");
        setPhone("");
        setEmail("");
        setAssignedTo("Clodoaldo Silva");
        setPriority("media");
        setStage("novo_lead");
        setTags("");
        setPotentialValue("");
        setNotes("");
      }
    }, 0);
    return () => clearTimeout(t);
  }, [partner, open]);

  const handleSave = () => {
    if (!companyName.trim()) {
      toast.error("companyName é obrigatório");
      return;
    }
    onSave({
      companyName,
      tradeName: tradeName || undefined,
      cnpj: cnpj || undefined,
      category: category || undefined,
      city,
      state,
      address: address || undefined,
      website: website || undefined,
      phone: phone || undefined,
      email: email || undefined,
      assignedTo,
      priority,
      stage,
      tags: tags || undefined,
      potentialValue: potentialValue ? Number(potentialValue) : undefined,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>{partner ? "Editar parceiro" : "Novo parceiro"}</DialogTitle>
          <DialogDescription>
            {partner
              ? "Atualize os dados da empresa parceira."
              : "Cadastre uma nova empresa parceira."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="text-xs">Nome da empresa *</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Nome fantasia</Label>
            <Input
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">CNPJ</Label>
            <Input
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Categoria</Label>
            <Select value={category || "none"} onValueChange={(v) => setCategory(v === "none" ? "" : v)}>
              <SelectTrigger className="mt-1 text-sm">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Prioridade</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as PartnerPriority)}>
              <SelectTrigger className="mt-1 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Cidade</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 text-sm"
            />
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

          <div className="sm:col-span-2">
            <Label className="text-xs">Endereço</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Telefone</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="text-xs">Website</Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Responsável</Label>
            <Input
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Estágio</Label>
            <Select value={stage} onValueChange={(v) => setStage(v as PartnerStage)}>
              <SelectTrigger className="mt-1 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STAGE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Valor potencial (R$/mês)</Label>
            <Input
              type="number"
              value={potentialValue}
              onChange={(e) => setPotentialValue(e.target.value)}
              placeholder="0.00"
              className="mt-1 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="text-xs">Tags (vírgula separada)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="recife, pme, premium"
              className="mt-1 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="text-xs">Notas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {partner ? "Salvar alterações" : "Criar parceiro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
