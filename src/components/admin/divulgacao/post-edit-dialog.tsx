"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileText, Hash, Link2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { MediaUploader } from "./media-uploader";
import type { PromotionPost, PromotionAsset, Campaign } from "@/lib/promotion-types";
import { PLATFORMS, PLATFORM_COLORS } from "@/lib/promotion-types";

// ===== Dialog de criação/edição de post =====
//
// Permite criar/editar um post com:
// - Multi-rede: checkboxes pra selecionar 1+ plataformas (campo 'platforms')
// - Multi-mídia: upload de 1+ imagens (vira postAssets)
// - Todos os campos: título, descrição, hashtags, CTA, link, etc.

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: PromotionPost | null;
  campaigns: Campaign[];
  onSaved: () => void;
}

const FORMATS = [
  { value: "", label: "—" },
  { value: "Reels", label: "Reels" },
  { value: "Carrossel", label: "Carrossel" },
  { value: "Short", label: "Short" },
  { value: "Feed", label: "Feed" },
  { value: "Story", label: "Story" },
];

const PILLARS = [
  { value: "", label: "—" },
  { value: "Lucro real", label: "Lucro real" },
  { value: "Despesas", label: "Despesas" },
  { value: "Comunidade", label: "Comunidade" },
  { value: "Dicas", label: "Dicas" },
  { value: "Motivação", label: "Motivação" },
];

export function PostEditDialog({
  open,
  onOpenChange,
  editing,
  campaigns,
  onSaved,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    campaignId: "",
    editorialDay: "1",
    sequenceNumber: "1",
    platform: "Instagram" as string,
    platforms: [] as string[], // multi-rede
    format: "",
    pillar: "",
    title: "",
    description: "",
    hashtags: "",
    engagementText: "",
    cta: "",
    destinationUrl: "",
    altText: "",
    notes: "",
  });
  const [assets, setAssets] = useState<PromotionAsset[]>([]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      if (editing) {
        // Modo edição — preenche form com dados do post
        const platformsCsv = editing.platforms
          ? editing.platforms.split(",").map((p) => p.trim()).filter(Boolean)
          : [editing.platform];
        setForm({
          campaignId: editing.campaignId,
          editorialDay: String(editing.editorialDay),
          sequenceNumber: String(editing.sequenceNumber),
          platform: editing.platform,
          platforms: platformsCsv,
          format: editing.format ?? "",
          pillar: editing.pillar ?? "",
          title: editing.title,
          description: editing.description,
          hashtags: editing.hashtags ?? "",
          engagementText: editing.engagementText ?? "",
          cta: editing.cta ?? "",
          destinationUrl: editing.destinationUrl ?? "",
          altText: editing.altText ?? "",
          notes: editing.notes ?? "",
        });
        // Mídias existentes
        const existingAssets: PromotionAsset[] = [];
        if (editing.asset) existingAssets.push(editing.asset);
        if (editing.postAssets) {
          for (const pa of editing.postAssets) {
            if (pa.asset.id !== editing.asset?.id) {
              existingAssets.push(pa.asset);
            }
          }
        }
        setAssets(existingAssets);
      } else {
        // Modo criação — form vazio
        setForm({
          campaignId: campaigns[0]?.id ?? "",
          editorialDay: "1",
          sequenceNumber: "1",
          platform: "Instagram",
          platforms: ["Instagram"],
          format: "",
          pillar: "",
          title: "",
          description: "",
          hashtags: "",
          engagementText: "",
          cta: "",
          destinationUrl: "",
          altText: "",
          notes: "",
        });
        setAssets([]);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [open, editing, campaigns]);

  const togglePlatform = (platform: string) => {
    setForm((prev) => {
      const current = prev.platforms;
      const newPlatforms = current.includes(platform)
        ? current.filter((p) => p !== platform)
        : [...current, platform];
      return {
        ...prev,
        platforms: newPlatforms,
        // 'platform' (singular) usa a primeira selecionada (pra compat)
        platform: newPlatforms[0] ?? prev.platform,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.campaignId) {
      toast.error("Selecione uma campanha");
      return;
    }
    if (form.platforms.length === 0) {
      toast.error("Selecione pelo menos 1 plataforma");
      return;
    }
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Título e descrição são obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const body = {
        campaignId: form.campaignId,
        editorialDay: parseInt(form.editorialDay) || 1,
        sequenceNumber: parseInt(form.sequenceNumber) || 1,
        platform: form.platforms[0], // primeira plataforma (pra compat)
        platforms: form.platforms.join(","), // CSV multi-rede
        format: form.format || undefined,
        pillar: form.pillar || undefined,
        title: form.title,
        description: form.description,
        hashtags: form.hashtags || undefined,
        engagementText: form.engagementText || undefined,
        cta: form.cta || undefined,
        destinationUrl: form.destinationUrl || undefined,
        altText: form.altText || undefined,
        notes: form.notes || undefined,
        // Se tem asset, vincula o primeiro como assetId principal
        assetId: assets[0]?.id,
      };

      const url = editing
        ? `/api/admin/promotion/posts/${editing.id}`
        : "/api/admin/promotion/posts";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar");
        return;
      }

      const postId = data.post?.id ?? editing?.id;

      // Se tem mais de 1 asset, vincula os extras via API de postAssets
      if (postId && assets.length > 1) {
        for (let i = 1; i < assets.length; i++) {
          try {
            await fetch(`/api/admin/promotion/posts/${postId}/assets`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                assetId: assets[i].id,
                sortOrder: i,
              }),
            });
          } catch {
            // erro silencioso — não bloqueia
          }
        }
      }

      toast.success(editing ? "Post atualizado!" : "Post criado!");
      onSaved();
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error((e as Error).message || "Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl gap-0 overflow-y-auto border-zinc-800 bg-zinc-900 p-0 text-zinc-100">
        <DialogHeader className="border-b border-zinc-800 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
            <FileText className="h-4 w-4" />
            {editing ? "Editar postagem" : "Nova postagem"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            {editing
              ? "Edite os campos abaixo e salve"
              : "Crie uma nova postagem multi-rede com múltiplas mídias"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {/* Mídias (multi-mídia) */}
          <div>
            <Label className="mb-1.5 block text-xs text-zinc-400">
              Mídias (imagens para carrossel)
            </Label>
            <MediaUploader
              onAssetsChange={setAssets}
              initialAssets={assets}
              maxFiles={10}
            />
          </div>

          {/* Plataformas (multi-rede) */}
          <div>
            <Label className="mb-1.5 block text-xs text-zinc-400">
              Plataformas * (multi-rede)
            </Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => {
                const selected = form.platforms.includes(platform);
                const color = PLATFORM_COLORS[platform];
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      selected
                        ? "border-transparent text-white"
                        : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600"
                    }`}
                    style={
                      selected
                        ? { backgroundColor: color }
                        : undefined
                    }
                  >
                    {selected && <span>✓</span>}
                    {platform}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[10px] text-zinc-500">
              {form.platforms.length} plataforma(s) selecionada(s) — o post será
              compartilhável em todas
            </p>
          </div>

          {/* Campanha + dia + sequência */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <Label className="mb-1.5 block text-xs text-zinc-400">
                Campanha *
              </Label>
              <Select
                value={form.campaignId}
                onValueChange={(v) => setForm({ ...form, campaignId: v })}
              >
                <SelectTrigger className="border-zinc-700 bg-zinc-950 text-zinc-100">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-zinc-400">
                Dia (1-90)
              </Label>
              <Input
                type="number"
                min={1}
                max={90}
                value={form.editorialDay}
                onChange={(e) =>
                  setForm({ ...form, editorialDay: e.target.value })
                }
                className="border-zinc-700 bg-zinc-950 text-zinc-100"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-zinc-400">
                Seq. (1-5)
              </Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={form.sequenceNumber}
                onChange={(e) =>
                  setForm({ ...form, sequenceNumber: e.target.value })
                }
                className="border-zinc-700 bg-zinc-950 text-zinc-100"
              />
            </div>
          </div>

          {/* Título */}
          <div>
            <Label className="mb-1.5 block text-xs text-zinc-400">
              Título *
            </Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              maxLength={200}
              placeholder="Ex: Como calcular seu lucro real"
              className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
            />
          </div>

          {/* Descrição */}
          <div>
            <Label className="mb-1.5 block text-xs text-zinc-400">
              Descrição / Legenda *
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={4}
              placeholder="Legenda completa da publicação..."
              className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
            />
          </div>

          {/* Hashtags */}
          <div>
            <Label className="mb-1.5 flex items-center gap-1 text-xs text-zinc-400">
              <Hash className="h-3 w-3" />
              Hashtags
            </Label>
            <Input
              value={form.hashtags}
              onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
              placeholder="#meucorre #entregador #dicas"
              className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
            />
          </div>

          {/* CTA + Link */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 flex items-center gap-1 text-xs text-zinc-400">
                <MessageSquare className="h-3 w-3" />
                CTA (chamada para ação)
              </Label>
              <Input
                value={form.cta}
                onChange={(e) => setForm({ ...form, cta: e.target.value })}
                placeholder="Ex: Baixe grátis agora"
                className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
              />
            </div>
            <div>
              <Label className="mb-1.5 flex items-center gap-1 text-xs text-zinc-400">
                <Link2 className="h-3 w-3" />
                Link de destino
              </Label>
              <Input
                value={form.destinationUrl}
                onChange={(e) =>
                  setForm({ ...form, destinationUrl: e.target.value })
                }
                placeholder="https://meucorre.vercel.app"
                className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Formato + Pilar */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-xs text-zinc-400">
                Formato
              </Label>
              <Select
                value={form.format}
                onValueChange={(v) => setForm({ ...form, format: v })}
              >
                <SelectTrigger className="border-zinc-700 bg-zinc-950 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
                  {FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-zinc-400">
                Pilar
              </Label>
              <Select
                value={form.pillar}
                onValueChange={(v) => setForm({ ...form, pillar: v })}
              >
                <SelectTrigger className="border-zinc-700 bg-zinc-950 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
                  {PILLARS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Texto de engajamento */}
          <div>
            <Label className="mb-1.5 block text-xs text-zinc-400">
              Texto de engajamento (final da legenda)
            </Label>
            <Textarea
              value={form.engagementText}
              onChange={(e) =>
                setForm({ ...form, engagementText: e.target.value })
              }
              rows={2}
              placeholder="Ex: Comenta aqui se você já calculou seu lucro hoje!"
              className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
            />
          </div>

          {/* Notas internas */}
          <div>
            <Label className="mb-1.5 block text-xs text-zinc-400">
              Notas internas (não aparecem na publicação)
            </Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Anotações para a equipe..."
              className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
            />
          </div>

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
                "Criar postagem"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
