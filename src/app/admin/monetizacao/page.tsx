"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, ExternalLink, Loader2, DollarSign, TrendingUp,
  ShoppingCart, BookOpen, Wrench, Video, Users, Target, Lightbulb,
  CheckCircle2, Clock, ArrowRight,
} from "lucide-react";

interface AffiliateProduct {
  id: string;
  type: string;
  name: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  price: number | null;
  commission: number | null;
  category: string | null;
  platform: string | null;
  active: boolean;
  featured: boolean;
  clicks: number;
  conversions: number;
  revenue: number;
  sortOrder: number;
  notes: string | null;
}

interface RevenueStats {
  total: number;
  totalAmount: number;
  totalCost: number;
  totalProfit: number;
  bySource: Record<string, { total: number; count: number; cost: number; profit: number }>;
}

const TYPE_INFO: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  affiliate: { label: "Afiliado", icon: ShoppingCart, color: "#3b82f6" },
  course: { label: "Curso", icon: BookOpen, color: "#a855f7" },
  ebook: { label: "E-book", icon: BookOpen, color: "#ec4899" },
  toolkit: { label: "Toolkit", icon: Wrench, color: "#f59e0b" },
  live: { label: "Live", icon: Video, color: "#ef4444" },
  subscription: { label: "Assinatura", icon: Users, color: "#10b981" },
};

const SOURCE_LABELS: Record<string, string> = {
  adsense: "AdSense",
  affiliates: "Afiliados",
  sponsorships: "Patrocínios",
  products: "Produtos",
  subscription: "Assinaturas",
  live: "Lives",
  toolkit: "Toolkits",
  course: "Cursos",
  ebook: "E-books",
  other: "Outros",
};

const ROADMAP_STEPS = [
  {
    id: 1,
    title: "Diversifique além do AdSense",
    description: "Adicione afiliados Shopee/Magalu (mochilas, capacetes, suportes de celular)",
    projection: "R$500-1.500/mês",
    eta: "30 dias",
    icon: ShoppingCart,
    color: "#3b82f6",
    action: "Cadastrar produtos de afiliado abaixo",
  },
  {
    id: 2,
    title: "Curso/e-book premium",
    description: "'Gestão financeira para entregadores' — preço R$47-97",
    projection: "R$2.350-9.700",
    eta: "60 dias",
    icon: BookOpen,
    color: "#a855f7",
    action: "Criar produto digital abaixo",
  },
  {
    id: 3,
    title: "Patrocínios diretos com marcas",
    description: "Marcas de motos, acessórios, seguro moto, fintech",
    projection: "R$1.000-8.000/mês",
    eta: "60 dias",
    icon: Target,
    color: "#10b981",
    action: "Abordar marcas — registrar em receita",
  },
  {
    id: 4,
    title: "WhatsApp/Telegram VIP pago",
    description: "Lista VIP com sinais, alertas, suporte prioritário",
    projection: "R$990/mês (100 assinantes)",
    eta: "60 dias",
    icon: Users,
    color: "#10b981",
    action: "Criar produto de assinatura",
  },
  {
    id: 5,
    title: "Toolkit para entregadores",
    description: "Planilhas Excel, PDF dedução fiscal, calculadora de lucro por km",
    projection: "R$675-2.350",
    eta: "60 dias",
    icon: Wrench,
    color: "#f59e0b",
    action: "Criar produto toolkit abaixo",
  },
  {
    id: 6,
    title: "Live de mentoria mensal",
    description: "Live no Instagram/YouTube cobrando R$19,90 por participante",
    projection: "R$995/mês (50 participantes)",
    eta: "90 dias",
    icon: Video,
    color: "#ef4444",
    action: "Criar produto de live abaixo",
  },
];

export default function AdminMonetizacaoPage() {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AffiliateProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AffiliateProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, revRes] = await Promise.all([
        fetch("/api/admin/affiliate-products"),
        fetch("/api/admin/revenue?days=365"),
      ]);
      if (prodRes.ok) {
        const data = await prodRes.json();
        setProducts(data.products ?? []);
      }
      if (revRes.ok) {
        const data = await revRes.json();
        setRevenueStats(data.stats);
      }
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: Partial<AffiliateProduct>) => {
    setSaving(true);
    try {
      const isEditing = !!editing;
      const res = await fetch(
        isEditing
          ? `/api/admin/affiliate-products/${editing!.id}`
          : "/api/admin/affiliate-products",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar");
      }
      toast.success(isEditing ? "Produto atualizado!" : "Produto criado!");
      setDialogOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      toast.error("Erro ao salvar", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/affiliate-products/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Produto removido");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Erro ao remover");
    }
  };

  const totalClicks = products.reduce((s, p) => s + p.clicks, 0);
  const totalConversions = products.reduce((s, p) => s + p.conversions, 0);
  const totalRevenueProducts = products.reduce((s, p) => s + p.revenue, 0);
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Monetização</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Roadmap executável para sair de R$226/ano e chegar a R$5k-15k/mês
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setRevenueDialogOpen(true)} className="gap-1.5">
            <DollarSign className="h-4 w-4" />
            Registrar receita
          </Button>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Novo produto
          </Button>
        </div>
      </div>

      {/* Stats principais */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Receita total (12 meses)"
          value={revenueStats ? `R$ ${revenueStats.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
          color="#10b981"
        />
        <StatCard
          icon={TrendingUp}
          label="Lucro líquido"
          value={revenueStats ? `R$ ${revenueStats.totalProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
          color="#3b82f6"
        />
        <StatCard
          icon={Target}
          label="Conversão"
          value={`${conversionRate}%`}
          sub={`${totalConversions}/${totalClicks} cliques`}
          color="#a855f7"
        />
        <StatCard
          icon={ShoppingCart}
          label="Produtos ativos"
          value={String(products.filter((p) => p.active).length)}
          sub={`${products.length} total`}
          color="#f59e0b"
        />
      </div>

      {/* Roadmap visual */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-400" />
          <h2 className="text-sm font-bold text-zinc-100">Roadmap de monetização (90 dias)</h2>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Projeção total: R$226/ano (atual) → R$5.000-15.000/mês com execução consistente
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {ROADMAP_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex items-start gap-2">
                  <div
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                    style={{ backgroundColor: `${step.color}20`, color: step.color }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-100">{step.id}. {step.title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">{step.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                        💰 {step.projection}
                      </Badge>
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                        <Clock className="mr-1 h-2.5 w-2.5" />
                        {step.eta}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Receita por fonte */}
      {revenueStats && Object.keys(revenueStats.bySource).length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-bold text-zinc-100">Receita por fonte (12 meses)</h2>
          <div className="mt-3 space-y-2">
            {Object.entries(revenueStats.bySource)
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([source, data]) => (
                <div key={source} className="flex items-center justify-between rounded bg-zinc-950 p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-200">
                      {SOURCE_LABELS[source] ?? source}
                    </span>
                    <span className="text-[10px] text-zinc-500">{data.count} entradas</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">
                      R$ {data.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      Lucro: R$ {data.profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Lista de produtos */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-zinc-100">Produtos e afiliados</h2>
        {loading ? (
          <div className="flex h-40 items-center justify-center text-zinc-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando...
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
            <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
            <p className="text-sm font-medium text-zinc-300">Nenhum produto cadastrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const info = TYPE_INFO[product.type] ?? { label: product.type, icon: ShoppingCart, color: "#64748b" };
              const Icon = info.icon;
              return (
                <div key={product.id} className={`rounded-xl border ${product.active ? "border-zinc-800 bg-zinc-900" : "border-zinc-800/50 bg-zinc-900/50"} p-4`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                        style={{ backgroundColor: `${info.color}20`, color: info.color }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-100">{product.name}</p>
                        <p className="text-[10px] text-zinc-500">{info.label}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(product); setDialogOpen(true); }} className="h-6 w-6 p-0">
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(product)} className="h-6 w-6 p-0 text-red-400">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {product.description && (
                    <p className="mt-2 text-xs leading-relaxed text-zinc-400 line-clamp-2">{product.description}</p>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {product.price !== null && (
                        <span className="text-sm font-bold text-emerald-400">
                          R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      )}
                      {product.commission !== null && (
                        <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-[10px]">
                          {product.commission}% comissão
                        </Badge>
                      )}
                    </div>
                    {product.featured && (
                      <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px]">
                        ⭐ Destaque
                      </Badge>
                    )}
                  </div>

                  {product.clicks > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded bg-zinc-950 p-1.5">
                        <p className="text-[9px] text-zinc-500">Cliques</p>
                        <p className="text-xs font-semibold text-zinc-100">{product.clicks}</p>
                      </div>
                      <div className="rounded bg-zinc-950 p-1.5">
                        <p className="text-[9px] text-zinc-500">Conv.</p>
                        <p className="text-xs font-semibold text-zinc-100">{product.conversions}</p>
                      </div>
                      <div className="rounded bg-zinc-950 p-1.5">
                        <p className="text-[9px] text-zinc-500">Receita</p>
                        <p className="text-xs font-semibold text-emerald-400">R$ {product.revenue.toFixed(0)}</p>
                      </div>
                    </div>
                  )}

                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Abrir link
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog de produto */}
      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSave={handleSave}
        saving={saving}
      />

      {/* Dialog de receita */}
      <RevenueDialog
        open={revenueDialogOpen}
        onOpenChange={setRevenueDialogOpen}
        onSaved={() => { setRevenueDialogOpen(false); load(); }}
      />

      {/* Confirmação de delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover produto?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, sub, color,
}: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center gap-2 text-zinc-500">
        <Icon className="h-4 w-4" style={{ color }} />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-zinc-100">{value}</p>
      {sub && <p className="mt-1 text-[10px] text-zinc-500">{sub}</p>}
    </div>
  );
}

function ProductDialog({
  open, onOpenChange, editing, onSave, saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: AffiliateProduct | null;
  onSave: (data: Partial<AffiliateProduct>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<AffiliateProduct>>({});

  useEffect(() => {
    if (open) {
      setForm(editing ?? {
        type: "affiliate",
        name: "",
        description: "",
        url: "",
        price: null,
        commission: null,
        category: "moto_acessorios",
        platform: "shopee",
        active: true,
        featured: false,
        sortOrder: 0,
        notes: "",
      });
    }
  }, [open, editing]);

  const update = (field: keyof AffiliateProduct, value: unknown) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>Afiliado, curso, e-book, toolkit, live ou assinatura</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo *</Label>
              <Select value={form.type} onValueChange={(v) => update("type", v)} disabled={!!editing}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_INFO).map(([k, i]) => (
                    <SelectItem key={k} value={k}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Plataforma</Label>
              <Select value={form.platform ?? "manual"} onValueChange={(v) => update("platform", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="shopee">Shopee</SelectItem>
                  <SelectItem value="magalu">Magalu</SelectItem>
                  <SelectItem value="amazon">Amazon</SelectItem>
                  <SelectItem value="kiwify">Kiwify</SelectItem>
                  <SelectItem value="hotmart">Hotmart</SelectItem>
                  <SelectItem value="eduzz">Eduzz</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Nome *</Label>
            <Input value={form.name ?? ""} onChange={(e) => update("name", e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Descrição</Label>
            <Textarea value={form.description ?? ""} onChange={(e) => update("description", e.target.value)} rows={2} maxLength={500} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">URL *</Label>
            <Input value={form.url ?? ""} onChange={(e) => update("url", e.target.value)} placeholder="https://..." required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Preço (R$)</Label>
              <Input
                type="number" step="0.01" min="0"
                value={form.price ?? ""}
                onChange={(e) => update("price", e.target.value ? parseFloat(e.target.value) : null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Comissão (%)</Label>
              <Input
                type="number" step="0.1" min="0" max="100"
                value={form.commission ?? ""}
                onChange={(e) => update("commission", e.target.value ? parseFloat(e.target.value) : null)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Categoria</Label>
            <Select value={form.category ?? "moto_acessorios"} onValueChange={(v) => update("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="moto_acessorios">Moto e Acessórios</SelectItem>
                <SelectItem value="cursos">Cursos</SelectItem>
                <SelectItem value="ebooks">E-books</SelectItem>
                <SelectItem value="toolkits">Toolkits</SelectItem>
                <SelectItem value="lives">Lives</SelectItem>
                <SelectItem value="assinaturas">Assinaturas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.active ?? true} onCheckedChange={(v) => update("active", v)} />
              <Label className="text-xs">Ativo</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.featured ?? false} onCheckedChange={(v) => update("featured", v)} />
              <Label className="text-xs">Destaque</Label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notas internas</Label>
            <Textarea value={form.notes ?? ""} onChange={(e) => update("notes", e.target.value)} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RevenueDialog({
  open, onOpenChange, onSaved,
}: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    source: "affiliates",
    description: "",
    amount: 0,
    cost: 0,
    date: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar");
      }
      toast.success("Receita registrada!");
      onSaved();
    } catch (err) {
      toast.error("Erro", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar receita</DialogTitle>
          <DialogDescription>Adicione uma entrada de receita manualmente</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Fonte</Label>
            <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descrição</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Valor (R$) *</Label>
              <Input type="number" step="0.01" min="0" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Custo (R$)</Label>
              <Input type="number" step="0.01" min="0" value={form.cost || ""} onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Data</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
