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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  Target,
  Lightbulb,
  CheckCircle2,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Send,
  MessageCircle,
} from "lucide-react";

interface SocialProfile {
  id: string;
  platform: string;
  handle: string;
  url: string;
  displayName: string;
  bio: string | null;
  description: string | null;
  followers: number;
  following: number;
  posts: number;
  monetization: string | null;
  monetizationNotes: string | null;
  contentStrategy: string | null;
  postFrequency: string | null;
  bestTimes: string | null;
  active: boolean;
  verified: boolean;
  brandColor: string | null;
  notes: string | null;
  lastSyncAt: string | null;
  _count?: { SocialMetric: number };
}

const PLATFORM_INFO: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bioLimit: number;
  monetizationTip: string;
}> = {
  instagram: { label: "Instagram", icon: Instagram, color: "#E1306C", bioLimit: 150, monetizationTip: "Reels com brands de moto/acessórios + selo PRO" },
  tiktok: { label: "TikTok", icon: TikTokIcon, color: "#000000", bioLimit: 80, monetizationTip: "Creator Fund + Live + afiliados Shopee/AliExpress" },
  youtube: { label: "YouTube", icon: Youtube, color: "#FF0000", bioLimit: 1000, monetizationTip: "AdSense + patrocínios + links de afiliados na descrição" },
  facebook: { label: "Facebook", icon: Facebook, color: "#1877F2", bioLimit: 255, monetizationTip: "In-stream ads + grupos pagos + marketplace" },
  twitter: { label: "Twitter / X", icon: Twitter, color: "#000000", bioLimit: 160, monetizationTip: "X Premium + revenue sharing + afiliados" },
  telegram: { label: "Telegram", icon: Send, color: "#0088CC", bioLimit: 70, monetizationTip: "Canal pago + bots pagos + vendas diretas" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, color: "#25D366", bioLimit: 139, monetizationTip: "Comunidade paga + lista VIP + vendas diretas" },
  linkedin: { label: "LinkedIn", icon: Users, color: "#0A66C2", bioLimit: 2600, monetizationTip: "B2B parcerias + consultoria + cursos" },
  kwai: { label: "Kwai", icon: TikTokIcon, color: "#FF8000", bioLimit: 80, monetizationTip: "Creator program + lives + afiliados" },
  threads: { label: "Threads", icon: Instagram, color: "#000000", bioLimit: 500, monetizationTip: "Em breve monetização nativa + afiliados" },
};

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

const MONETIZATION_LABELS: Record<string, string> = {
  none: "Nenhuma",
  ads: "Anúncios",
  affiliates: "Afiliados",
  sponsorships: "Patrocínios",
  products: "Produtos próprios",
};

const MONETIZATION_COLORS: Record<string, string> = {
  none: "#64748b",
  ads: "#10b981",
  affiliates: "#3b82f6",
  sponsorships: "#a855f7",
  products: "#f59e0b",
};

export default function AdminRedesSociaisPage() {
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SocialProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SocialProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/social-profiles");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProfiles(data.profiles ?? []);
    } catch {
      toast.error("Erro ao carregar redes sociais");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: Partial<SocialProfile>) => {
    setSaving(true);
    try {
      const isEditing = !!editing;
      const res = await fetch(
        isEditing
          ? `/api/admin/social-profiles/${editing!.id}`
          : "/api/admin/social-profiles",
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
      toast.success(isEditing ? "Perfil atualizado!" : "Perfil criado!");
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
      const res = await fetch(`/api/admin/social-profiles/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Perfil removido");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Erro ao remover");
    }
  };

  const totalFollowers = profiles.reduce((sum, p) => sum + p.followers, 0);
  const activeProfiles = profiles.filter((p) => p.active).length;
  const monetizedProfiles = profiles.filter((p) => p.monetization && p.monetization !== "none").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Redes Sociais</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Gerencie bios, descrições, métricas e estratégia de monetização
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowInsights(!showInsights)}
            className="gap-1.5"
          >
            <Lightbulb className="h-4 w-4" />
            {showInsights ? "Ocultar" : "Ver"} sugestões
          </Button>
          <Button
            onClick={() => { setEditing(null); setDialogOpen(true); }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Nova rede
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <Users className="h-4 w-4" />
            <span className="text-xs">Total seguidores</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-100">
            {totalFollowers.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Redes ativas</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-100">
            {activeProfiles}
            <span className="ml-1 text-sm text-zinc-500">/ {profiles.length}</span>
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">Monetizadas</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {monetizedProfiles}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <Target className="h-4 w-4" />
            <span className="text-xs">Verificadas</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-400">
            {profiles.filter((p) => p.verified).length}
          </p>
        </div>
      </div>

      {showInsights && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-400" />
            <h2 className="text-sm font-bold text-amber-400">
              Análise e oportunidades de monetização
            </h2>
          </div>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <InsightItem
              title="1. Diversifique além do AdSense"
              text="Hoje você depende apenas do AdSense (R$18,90). Adicione afiliados Shopee/Magalu (mochilas, capacetes, suportes de celular) — ticket médio R$30-200, comissão 4-12%. Para 10k seguidores, projeção: R$500-1500/mês."
            />
            <InsightItem
              title="2. Crie um curso/e-book premium"
              text="&lsquo;Gestão financeira para entregadores&rsquo; — preço R$47-97. Conversão esperada: 1-2% da audiência. Para 5k engajados: 50-100 vendas = R$2.350-9.700 de receita one-time."
            />
            <InsightItem
              title="3. Patrocínios diretos com marcas"
              text="Marcas de motos, acessórios, seguro moto, fintech. Com 10k+ seguidores engajados, cobre R$500-2.000 por post patrocinado. 2-4 posts/mês = R$1.000-8.000/mês."
            />
            <InsightItem
              title="4. WhatsApp/Telegram VIP pago"
              text="Lista VIP com sinais de horários bons p/ corrida, alertas de promoções, suporte prioritário. R$9,90/mês. 100 assinantes = R$990/mês recorrente."
            />
            <InsightItem
              title="5. Toolkit para entregadores"
              text="Planilhas Excel, PDF de dedução fiscal, calculadora de lucro por km. Bundle R$27-47. Conversão 0.5-1% = R$675-2.350."
            />
            <InsightItem
              title="6. Live de mentoria mensal"
              text="Live no Instagram/YouTube cobrando R$19,90 por participante. 50 participantes = R$995/mês. Grave e venda a gravação por R$27."
            />
            <div className="mt-4 rounded-lg bg-zinc-900 p-3">
              <p className="text-xs text-zinc-400">
                <strong className="text-emerald-400">Projeção total (12 meses):</strong> Com 
                execução consistente, pode passar de <strong className="text-zinc-300">R$226/ano</strong> (apenas AdSense) 
                para <strong className="text-emerald-400">R$5.000-15.000/mês</strong> com 
                diversificação de receitas.
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando...
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">Nenhuma rede cadastrada</p>
          <p className="mt-1 text-xs text-zinc-500">
            Clique em &quot;Nova rede&quot; para começar
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {profiles.map((profile) => {
            const info = PLATFORM_INFO[profile.platform] ?? {
              label: profile.platform,
              icon: Users,
              color: "#64748b",
              bioLimit: 500,
              monetizationTip: "",
            };
            const Icon = info.icon;
            return (
              <ProfileCard
                key={profile.id}
                profile={profile}
                info={info}
                Icon={Icon}
                onEdit={() => { setEditing(profile); setDialogOpen(true); }}
                onDelete={() => setDeleteTarget(profile)}
              />
            );
          })}
        </div>
      )}

      <ProfileDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSave={handleSave}
        saving={saving}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {deleteTarget?.platform}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O perfil de{" "}
              <strong>{deleteTarget?.handle}</strong> será removido permanentemente.
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

function InsightItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg bg-zinc-900/50 p-3">
      <p className="font-semibold text-zinc-100">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-400">{text}</p>
    </div>
  );
}

function ProfileCard({
  profile,
  info,
  Icon,
  onEdit,
  onDelete,
}: {
  profile: SocialProfile;
  info: { label: string; color: string; bioLimit: number; monetizationTip: string };
  Icon: React.ComponentType<{ className?: string }>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`rounded-xl border ${profile.active ? "border-zinc-800 bg-zinc-900" : "border-zinc-800/50 bg-zinc-900/50"} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
            style={{ backgroundColor: `${info.color}20`, color: info.color }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-zinc-100">
                {info.label}
              </p>
              {profile.verified && (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-blue-400" />
              )}
              {!profile.active && (
                <Badge variant="outline" className="border-zinc-700 text-[10px] text-zinc-500">
                  Inativo
                </Badge>
              )}
            </div>
            <a
              href={profile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
            >
              <span className="truncate">{profile.handle}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit} className="h-7 w-7 p-0">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="h-7 w-7 p-0 text-red-400 hover:text-red-300">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {profile.bio && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Bio</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-300">{profile.bio}</p>
          <p className="mt-1 text-[10px] text-zinc-600">
            {profile.bio.length}/{info.bioLimit} caracteres
          </p>
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded bg-zinc-950 p-2">
          <p className="text-[10px] text-zinc-500">Seguidores</p>
          <p className="text-sm font-semibold text-zinc-100">
            {profile.followers.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded bg-zinc-950 p-2">
          <p className="text-[10px] text-zinc-500">Seguindo</p>
          <p className="text-sm font-semibold text-zinc-100">
            {profile.following.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="rounded bg-zinc-950 p-2">
          <p className="text-[10px] text-zinc-500">Posts</p>
          <p className="text-sm font-semibold text-zinc-100">
            {profile.posts.toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      {profile.monetization && profile.monetization !== "none" && (
        <div className="mt-3 flex items-center gap-2">
          <DollarSign className="h-3.5 w-3.5" style={{ color: MONETIZATION_COLORS[profile.monetization] }} />
          <span className="text-xs font-medium" style={{ color: MONETIZATION_COLORS[profile.monetization] }}>
            {MONETIZATION_LABELS[profile.monetization]}
          </span>
        </div>
      )}

      {profile.contentStrategy && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Estratégia</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">{profile.contentStrategy}</p>
        </div>
      )}

      {(profile.postFrequency || profile.bestTimes) && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          {profile.postFrequency && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {profile.postFrequency}
            </span>
          )}
          {profile.bestTimes && (
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {profile.bestTimes}
            </span>
          )}
        </div>
      )}

      {info.monetizationTip && (
        <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2">
          <p className="text-[10px] font-semibold text-emerald-400">💡 Dica de monetização</p>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">{info.monetizationTip}</p>
        </div>
      )}
    </div>
  );
}

function ProfileDialog({
  open,
  onOpenChange,
  editing,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: SocialProfile | null;
  onSave: (data: Partial<SocialProfile>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<SocialProfile>>({});

  useEffect(() => {
    if (open) {
      setForm(
        editing ?? {
          platform: "",
          handle: "",
          url: "",
          displayName: "MeuCorre",
          bio: "",
          description: "",
          followers: 0,
          following: 0,
          posts: 0,
          monetization: "none",
          active: true,
          verified: false,
        },
      );
    }
  }, [open, editing]);

  const update = (field: keyof SocialProfile, value: unknown) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const bioLimit =
    form.platform && PLATFORM_INFO[form.platform]
      ? PLATFORM_INFO[form.platform].bioLimit
      : 500;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? `Editar ${editing.platform}` : "Nova rede social"}
          </DialogTitle>
          <DialogDescription>
            Gerencie bio, métricas, estratégia e monetização
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Plataforma *</Label>
              <Select
                value={form.platform}
                onValueChange={(v) => update("platform", v)}
                disabled={!!editing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLATFORM_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Handle *</Label>
              <Input
                value={form.handle ?? ""}
                onChange={(e) => update("handle", e.target.value)}
                placeholder="@meucorr"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">URL do perfil *</Label>
            <Input
              value={form.url ?? ""}
              onChange={(e) => update("url", e.target.value)}
              placeholder="https://instagram.com/meucorr"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Bio (max {bioLimit} caracteres)
            </Label>
            <Textarea
              value={form.bio ?? ""}
              onChange={(e) => update("bio", e.target.value)}
              placeholder="Bio da rede social..."
              maxLength={bioLimit}
              rows={3}
            />
            <p className="text-[10px] text-zinc-500">
              {(form.bio ?? "").length}/{bioLimit} caracteres
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Descrição interna (não exibida publicamente)</Label>
            <Textarea
              value={form.description ?? ""}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Objetivos, posicionamento, observações..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Seguidores</Label>
              <Input
                type="number"
                value={form.followers ?? 0}
                onChange={(e) => update("followers", parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Seguindo</Label>
              <Input
                type="number"
                value={form.following ?? 0}
                onChange={(e) => update("following", parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Posts</Label>
              <Input
                type="number"
                value={form.posts ?? 0}
                onChange={(e) => update("posts", parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Estratégia de conteúdo</Label>
            <Textarea
              value={form.contentStrategy ?? ""}
              onChange={(e) => update("contentStrategy", e.target.value)}
              placeholder="Ex: Carrosséis educativos + Reels de dicas + Stories bastidores"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Frequência de posts</Label>
              <Input
                value={form.postFrequency ?? ""}
                onChange={(e) => update("postFrequency", e.target.value)}
                placeholder="Ex: 2x/dia, 3x/semana"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Melhores horários</Label>
              <Input
                value={form.bestTimes ?? ""}
                onChange={(e) => update("bestTimes", e.target.value)}
                placeholder="Ex: 12h, 19h, 21h"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Estratégia de monetização</Label>
            <Select
              value={form.monetization ?? "none"}
              onValueChange={(v) => update("monetization", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MONETIZATION_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notas de monetização</Label>
            <Textarea
              value={form.monetizationNotes ?? ""}
              onChange={(e) => update("monetizationNotes", e.target.value)}
              placeholder="Detalhes sobre contratos, valores, marcas parceiras..."
              rows={2}
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.active ?? true}
                onCheckedChange={(v) => update("active", v)}
              />
              <Label className="text-xs">Ativa</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.verified ?? false}
                onCheckedChange={(v) => update("verified", v)}
              />
              <Label className="text-xs">Verificada (selo)</Label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notas internas</Label>
            <Textarea
              value={form.notes ?? ""}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Notas privadas do admin..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : editing ? (
                "Salvar alterações"
              ) : (
                "Criar perfil"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
