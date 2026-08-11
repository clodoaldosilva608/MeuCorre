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
  ShoppingBag,
  MousePointerClick,
  ExternalLink,
  Loader2,
  Crown,
} from "lucide-react";

interface Offer {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  imageUrl: string;
  videoUrl: string | null;
  productUrl: string;
  category: string;
  proOnly: boolean;
  active: boolean;
  startsAt: string;
  endsAt: string | null;
  clicks: number;
  createdAt: string;
}

const CATEGORIES = [
  { value: "equipamentos", label: "Equipamentos" },
  { value: "combustivel", label: "Combustível" },
  { value: "seguro", label: "Seguro" },
  { value: "ferramentas", label: "Ferramentas" },
  { value: "vestuario", label: "Vestuário" },
  { value: "outros", label: "Outros" },
];

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
);

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/offers");
      if (!res.ok) throw new Error("Falha ao carregar");
      const data = await res.json();
      setOffers(data.offers ?? []);
    } catch {
      toast.error("Erro ao carregar ofertas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (offer: Offer) => {
    setEditing(offer);
    setDialogOpen(true);
  };

  const handleToggleActive = async (offer: Offer) => {
    try {
      const res = await fetch(`/api/admin/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !offer.active }),
      });
      if (!res.ok) throw new Error();
      toast.success(offer.active ? "Oferta desativada" : "Oferta ativada");
      load();
    } catch {
      toast.error("Erro ao alterar status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/offers/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Oferta removida");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Erro ao remover oferta");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <ShoppingBag className="h-6 w-6 text-emerald-400" />
            Ofertas da Loja
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Cadastre produtos com desconto para os entregadores. Links de
            afiliado com tracking automático.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Nova oferta
        </Button>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total" value={offers.length} />
        <StatCard
          label="Ativas"
          value={offers.filter((o) => o.active).length}
          accent="emerald"
        />
        <StatCard
          label="PRO-only"
          value={offers.filter((o) => o.proOnly).length}
          accent="gold"
        />
        <StatCard
          label="Cliques totais"
          value={offers.reduce((s, o) => s + o.clicks, 0)}
          accent="blue"
        />
      </div>

      {/* Lista de ofertas */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando...
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">
            Nenhuma oferta cadastrada
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Clique em &ldquo;Nova oferta&rdquo; para criar a primeira
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {offers.map((offer) => (
            <OfferRow
              key={offer.id}
              offer={offer}
              onEdit={() => openEdit(offer)}
              onToggle={() => handleToggleActive(offer)}
              onDelete={() => setDeleteTarget(offer)}
            />
          ))}
        </div>
      )}

      {/* Dialog de criação/edição */}
      <OfferDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={() => {
          setDialogOpen(false);
          load();
        }}
        saving={saving}
        setSaving={setSaving}
      />

      {/* Confirmação de delete */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover oferta?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta ação não pode ser desfeita. A oferta{" "}
              <strong className="text-zinc-200">{deleteTarget?.title}</strong>{" "}
              será permanentemente removida do banco de dados.
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
  accent = "zinc",
}: {
  label: string;
  value: number;
  accent?: "zinc" | "emerald" | "gold" | "blue";
}) {
  const colors: Record<string, string> = {
    zinc: "text-zinc-100",
    emerald: "text-emerald-400",
    gold: "text-yellow-400",
    blue: "text-blue-400",
  };
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold ${colors[accent]}`}>{value}</p>
    </div>
  );
}

function OfferRow({
  offer,
  onEdit,
  onToggle,
  onDelete,
}: {
  offer: Offer;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      {/* Imagem */}
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-zinc-800">
        { }
        <img
          src={offer.imageUrl}
          alt={offer.title}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-zinc-100">
            {offer.title}
          </p>
          {offer.proOnly && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-yellow-400">
              <Crown className="h-2.5 w-2.5" />
              PRO
            </span>
          )}
          {!offer.active && (
            <span className="rounded-full bg-zinc-700 px-1.5 py-0.5 text-[9px] font-bold uppercase text-zinc-300">
              Inativa
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-400">
          <span className="font-medium text-emerald-400">
            {formatBRL(offer.price)}
          </span>
          {offer.originalPrice && (
            <span className="line-through">{formatBRL(offer.originalPrice)}</span>
          )}
          <span className="text-zinc-600">•</span>
          <span>{CATEGORY_LABEL[offer.category] ?? offer.category}</span>
          <span className="text-zinc-600">•</span>
          <span className="inline-flex items-center gap-0.5">
            <MousePointerClick className="h-3 w-3" />
            {offer.clicks}
          </span>
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1">
        <a
          href={offer.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          title="Abrir link do produto"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        <button
          onClick={onToggle}
          className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400"
          title={offer.active ? "Desativar" : "Ativar"}
        >
          <Switch checked={offer.active} />
        </button>
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

function OfferDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
  saving,
  setSaving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Offer | null;
  onSaved: () => void;
  saving: boolean;
  setSaving: (s: boolean) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    originalPrice: "",
    imageUrl: "",
    videoUrl: "",
    productUrl: "",
    category: "equipamentos",
    proOnly: false,
    active: true,
    endsAt: "",
  });
  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          title: editing.title,
          description: editing.description,
          price: String(editing.price),
          originalPrice: editing.originalPrice
            ? String(editing.originalPrice)
            : "",
          imageUrl: editing.imageUrl,
          videoUrl: editing.videoUrl ?? "",
          productUrl: editing.productUrl,
          category: editing.category,
          proOnly: editing.proOnly,
          active: editing.active,
          endsAt: editing.endsAt
            ? new Date(editing.endsAt).toISOString().slice(0, 16)
            : "",
        });
        // Detecta se é data URL (upload) ou URL externa
        setImageMode(editing.imageUrl.startsWith("data:") ? "upload" : "url");
      } else {
        setForm({
          title: "",
          description: "",
          price: "",
          originalPrice: "",
          imageUrl: "",
          videoUrl: "",
          productUrl: "",
          category: "equipamentos",
          proOnly: false,
          active: true,
          endsAt: "",
        });
        setImageMode("url");
      }
    }
  }, [open, editing]);

  // Converte arquivo de imagem para base64 data URL
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validações
    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo deve ser uma imagem");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande (máximo 2MB)");
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setForm((prev) => ({ ...prev, imageUrl: base64 }));
        setUploadingImage(false);
        toast.success("Imagem carregada");
      };
      reader.onerror = () => {
        setUploadingImage(false);
        toast.error("Erro ao ler imagem");
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingImage(false);
      toast.error("Erro ao processar imagem");
    }
  };

  // Extrai ID do YouTube para embed
  function getYouTubeEmbedUrl(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return `https://www.youtube.com/embed/${match[1]}`;
    }
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Limpa preço — remove R$, espaços, e converte vírgula para ponto
    const cleanPrice = form.price
      .replace(/R\$\s*/gi, "")
      .replace(/\s/g, "")
      .replace(",", ".");
    const priceNum = parseFloat(cleanPrice);

    const cleanOrigPrice = form.originalPrice
      ? form.originalPrice
          .replace(/R\$\s*/gi, "")
          .replace(/\s/g, "")
          .replace(",", ".")
      : "";
    const origNum = cleanOrigPrice ? parseFloat(cleanOrigPrice) : null;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: priceNum,
      originalPrice: origNum,
      imageUrl: form.imageUrl.trim(),
      videoUrl: form.videoUrl.trim() || null,
      productUrl: form.productUrl.trim(),
      category: form.category,
      proOnly: form.proOnly,
      active: form.active,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    };

    try {
      const url = editing
        ? `/api/admin/offers/${editing.id}`
        : "/api/admin/offers";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar");
        return;
      }
      toast.success(editing ? "Oferta atualizada" : "Oferta criada");
      onSaved();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  // Preview do desconto
  const priceNum = parseFloat(form.price.replace(",", ".")) || 0;
  const origNum = parseFloat(form.originalPrice.replace(",", ".")) || 0;
  const discount =
    origNum > priceNum && priceNum > 0
      ? Math.round(((origNum - priceNum) / origNum) * 100)
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl gap-0 overflow-y-auto border-zinc-800 bg-zinc-900 p-0 text-zinc-100">
        <DialogHeader className="border-b border-zinc-800 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
            <ShoppingBag className="h-4 w-4" />
            {editing ? "Editar oferta" : "Nova oferta"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            {editing
              ? "Atualize os dados da oferta"
              : "Cadastre um novo produto com desconto para a loja"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {/* Preview ao vivo */}
          {(form.imageUrl || form.title) && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Preview do card
              </p>
              <div className="flex gap-3">
                {form.imageUrl && (
                   
                  <img
                    src={form.imageUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-md object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.opacity = "0";
                    }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-zinc-100">
                    {form.title || "Título da oferta"}
                  </p>
                  <p className="truncate text-xs text-zinc-400">
                    {form.description || "Descrição aparecerá aqui"}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {priceNum > 0 && (
                      <span className="text-sm font-bold text-emerald-400">
                        {formatBRL(priceNum)}
                      </span>
                    )}
                    {origNum > priceNum && (
                      <span className="text-xs line-through text-zinc-500">
                        {formatBRL(origNum)}
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                        -{discount}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs text-zinc-400">Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Mochila térmica premium 25L"
                required
                maxLength={120}
                className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs text-zinc-400">Descrição *</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Descrição do produto e do desconto"
                required
                maxLength={1000}
                rows={4}
                className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
              />
              <p className="text-[10px] text-zinc-500">
                {form.description.length}/1000 caracteres
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Preço com desconto *</Label>
              <Input
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="19.90"
                required
                inputMode="decimal"
                className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
              />
              <p className="text-[10px] text-zinc-500">
                Digite apenas números (ex: 19.90 ou 19,90)
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">
                Preço original (opcional)
              </Label>
              <Input
                value={form.originalPrice}
                onChange={(e) =>
                  setForm({ ...form, originalPrice: e.target.value })
                }
                placeholder="39.90"
                inputMode="decimal"
                className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
              />
            </div>

            {/* Imagem — URL ou Upload */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs text-zinc-400">Imagem do produto *</Label>
              {/* Tabs URL / Upload */}
              <div className="flex gap-1 rounded-lg border border-zinc-700 bg-zinc-950 p-1">
                <button
                  type="button"
                  onClick={() => setImageMode("url")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    imageMode === "url"
                      ? "bg-emerald-500 text-zinc-950"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Link da imagem
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode("upload")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    imageMode === "upload"
                      ? "bg-emerald-500 text-zinc-950"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Upload de imagem
                </button>
              </div>

              {imageMode === "url" ? (
                <Input
                  value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://m.media-amazon.com/images/I/..."
                  required={imageMode === "url"}
                  className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
                />
              ) : (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="block w-full text-xs text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-zinc-950 hover:file:bg-emerald-400"
                  />
                  {uploadingImage && (
                    <p className="text-[10px] text-zinc-500">
                      <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                      Carregando imagem...
                    </p>
                  )}
                  {form.imageUrl.startsWith("data:") && (
                    <p className="text-[10px] text-emerald-400">
                      ✓ Imagem carregada ({(form.imageUrl.length / 1024).toFixed(0)}KB base64)
                    </p>
                  )}
                </div>
              )}
              <p className="text-[10px] text-zinc-500">
                {imageMode === "url"
                  ? "URL externa HTTPS com extensão .jpg/.png/.webp/.gif/.svg"
                  : "Máximo 2MB. Formatos: JPG, PNG, WebP, GIF, SVG."}
              </p>
            </div>

            {/* Vídeo do produto (opcional) */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs text-zinc-400">
                Vídeo do produto (opcional)
              </Label>
              <Input
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
              />
              <p className="text-[10px] text-zinc-500">
                Link do YouTube ou Vimeo. Será exibido como preview no card da oferta.
              </p>
              {form.videoUrl && getYouTubeEmbedUrl(form.videoUrl) && (
                <div className="mt-2 overflow-hidden rounded-lg border border-zinc-700">
                  <div className="aspect-video bg-zinc-950">
                    <iframe
                      src={getYouTubeEmbedUrl(form.videoUrl)!}
                      className="h-full w-full"
                      title="Preview do vídeo"
                      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs text-zinc-400">
                URL do produto (link de afiliado) *
              </Label>
              <Input
                value={form.productUrl}
                onChange={(e) =>
                  setForm({ ...form, productUrl: e.target.value })
                }
                placeholder="https://meli.la/2TBA26a ou https://www.amazon.com.br/dp/B0XXX"
                required
                className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
              />
              <p className="text-[10px] text-zinc-500">
                Link de afiliado. O MeuCorre anexa UTM tracking automaticamente.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger className="border-zinc-700 bg-zinc-950 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">
                Expira em (opcional)
              </Label>
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-6 md:col-span-2">
              <label className="flex items-center gap-2 text-xs text-zinc-300">
                <Switch
                  checked={form.proOnly}
                  onCheckedChange={(v) => setForm({ ...form, proOnly: v })}
                />
                Apenas para PRO
              </label>
              <label className="flex items-center gap-2 text-xs text-zinc-300">
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v })}
                />
                Ativa
              </label>
            </div>
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
                "Criar oferta"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
