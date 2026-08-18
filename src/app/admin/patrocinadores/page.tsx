"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink, Loader2, Megaphone, Image as ImageIcon, Globe, MapPin, Phone, Mail, Instagram, Facebook, MessageCircle } from "lucide-react";

interface Sponsor {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  website: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  bannerLink: string | null;
  instagram: string | null;
  facebook: string | null;
  whatsapp: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  active: boolean;
  showInCarousel: boolean;
  showBanner: boolean;
  sortOrder: number;
  notes: string | null;
}

export default function AdminPatrocinadoresPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sponsor | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Sponsor>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sponsors");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSponsors(data.sponsors ?? []);
    } catch {
      toast.error("Erro ao carregar patrocinadores");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ active: true, showInCarousel: true, showBanner: false, sortOrder: 0 });
    setDialogOpen(true);
  };

  const openEdit = (s: Sponsor) => {
    setEditing(s);
    setForm(s);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const isEditing = !!editing;
      const res = await fetch(
        isEditing ? `/api/admin/sponsors/${editing!.id}` : "/api/admin/sponsors",
        { method: isEditing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }
      );
      if (!res.ok) throw new Error();
      toast.success(isEditing ? "Patrocinador atualizado!" : "Patrocinador criado!");
      setDialogOpen(false);
      load();
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/admin/sponsors/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Patrocinador removido");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Erro ao remover");
    }
  };

  const update = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Patrocinadores</h1>
          <p className="mt-1 text-sm text-zinc-500">Gerencie marcas patrocinadas que aparecem na landing page e na dashboard</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo patrocinador
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={sponsors.length} icon={Megaphone} color="#10b981" />
        <StatCard label="No carrossel" value={sponsors.filter(s => s.active && s.showInCarousel).length} icon={ImageIcon} color="#3b82f6" />
        <StatCard label="Com banner" value={sponsors.filter(s => s.active && s.showBanner).length} icon={Megaphone} color="#f59e0b" />
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-zinc-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Carregando...</div>
      ) : sponsors.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <Megaphone className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">Nenhum patrocinador cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((s) => (
            <div key={s.id} className={`rounded-xl border ${s.active ? "border-zinc-800 bg-zinc-900" : "border-zinc-800/50 bg-zinc-900/50"} p-4`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-zinc-800">
                    {s.logoUrl ? <img src={s.logoUrl} alt={s.name} className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-zinc-600" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-100">{s.name}</p>
                    {s.category && <p className="text-[10px] text-zinc-500">{s.category}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(s)} className="h-7 w-7 p-0"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(s)} className="h-7 w-7 p-0 text-red-400"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>

              {s.description && <p className="mt-2 text-xs text-zinc-400 line-clamp-2">{s.description}</p>}

              <div className="mt-3 flex flex-wrap gap-1">
                {s.active && <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[9px]">Ativo</Badge>}
                {s.showInCarousel && <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-[9px]">Carrossel</Badge>}
                {s.showBanner && <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[9px]">Banner</Badge>}
                {s.logoUrl && <Badge variant="outline" className="border-zinc-700 text-[9px]">✓ Logo</Badge>}
                {s.bannerUrl && <Badge variant="outline" className="border-zinc-700 text-[9px]">✓ Banner</Badge>}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-zinc-500">
                {s.website && <a href={s.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-zinc-300"><Globe className="h-3 w-3" /> Site</a>}
                {s.instagram && <a href={s.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-zinc-300"><Instagram className="h-3 w-3" /> IG</a>}
                {s.facebook && <a href={s.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-zinc-300"><Facebook className="h-3 w-3" /> FB</a>}
                {s.whatsapp && <a href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-zinc-300"><MessageCircle className="h-3 w-3" /> Zap</a>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar patrocinador" : "Novo patrocinador"}</DialogTitle>
            <DialogDescription>Configure os dados de exibição da marca patrocinada</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome da marca *</Label>
                <Input value={form.name ?? ""} onChange={(e) => update("name", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Categoria</Label>
                <Input value={form.category ?? ""} onChange={(e) => update("category", e.target.value)} placeholder="Ex: Acessórios" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Descrição curta (para carrossel)</Label>
              <Textarea value={form.description ?? ""} onChange={(e) => update("description", e.target.value)} rows={2} maxLength={150} placeholder="Peças e acessórios para moto com desconto exclusivo" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">URL do logo (link da imagem)</Label>
              <Input value={form.logoUrl ?? ""} onChange={(e) => update("logoUrl", e.target.value)} placeholder="https://exemplo.com/logo.png" />
              <p className="text-[10px] text-zinc-500">Cole aqui o link da imagem do logo. Aparece no carrossel da landing page.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">URL do banner (para pop-up na dashboard)</Label>
              <Input value={form.bannerUrl ?? ""} onChange={(e) => update("bannerUrl", e.target.value)} placeholder="https://exemplo.com/banner.jpg" />
              <p className="text-[10px] text-zinc-500">Banner que aparece como pop-up na dashboard dos usuários.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Link de destino do banner</Label>
              <Input value={form.bannerLink ?? ""} onChange={(e) => update("bannerLink", e.target.value)} placeholder="https://exemplo.com/promo" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Site do patrocinador</Label>
              <Input value={form.website ?? ""} onChange={(e) => update("website", e.target.value)} placeholder="https://site.com" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Instagram</Label>
                <Input value={form.instagram ?? ""} onChange={(e) => update("instagram", e.target.value)} placeholder="https://instagram.com/..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Facebook</Label>
                <Input value={form.facebook ?? ""} onChange={(e) => update("facebook", e.target.value)} placeholder="https://facebook.com/..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">WhatsApp</Label>
                <Input value={form.whatsapp ?? ""} onChange={(e) => update("whatsapp", e.target.value)} placeholder="+55 11 99999-9999" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Contato (nome)</Label>
                <Input value={form.contactName ?? ""} onChange={(e) => update("contactName", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input value={form.contactEmail ?? ""} onChange={(e) => update("contactEmail", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Telefone</Label>
                <Input value={form.contactPhone ?? ""} onChange={(e) => update("contactPhone", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Endereço</Label>
                <Input value={form.address ?? ""} onChange={(e) => update("address", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cidade</Label>
                <Input value={form.city ?? ""} onChange={(e) => update("city", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Estado</Label>
                <Input value={form.state ?? ""} onChange={(e) => update("state", e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.active ?? true} onCheckedChange={(v) => update("active", v)} />
                <Label className="text-xs">Ativo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.showInCarousel ?? true} onCheckedChange={(v) => update("showInCarousel", v)} />
                <Label className="text-xs">No carrossel</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.showBanner ?? false} onCheckedChange={(v) => update("showBanner", v)} />
                <Label className="text-xs">Banner pop-up</Label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Ordem no carrossel</Label>
              <Input type="number" value={form.sortOrder ?? 0} onChange={(e) => update("sortOrder", parseInt(e.target.value) || 0)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Notas internas</Label>
              <Textarea value={form.notes ?? ""} onChange={(e) => update("notes", e.target.value)} rows={2} placeholder="Notas privadas do admin..." />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center gap-2 text-zinc-500"><Icon className="h-4 w-4" style={{ color }} /><span className="text-xs">{label}</span></div>
      <p className="mt-2 text-2xl font-bold text-zinc-100">{value}</p>
    </div>
  );
}
