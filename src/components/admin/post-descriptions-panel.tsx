"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Copy,
  Share2,
  Upload,
  Loader2,
  FileText,
  Search,
  Send,
} from "lucide-react";

interface PostDescription {
  id: string;
  platform: string;
  category: string;
  title: string;
  content: string;
  hashtags: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const PLATFORMS: Array<{ value: string; label: string; color: string }> = [
  { value: "all", label: "Todas", color: "#71717a" },
  { value: "instagram", label: "Instagram", color: "#E1306C" },
  { value: "tiktok", label: "TikTok", color: "#000000" },
  { value: "youtube", label: "YouTube", color: "#FF0000" },
  { value: "facebook", label: "Facebook", color: "#1877F2" },
  { value: "twitter", label: "Twitter / X", color: "#000000" },
  { value: "telegram", label: "Telegram", color: "#0088CC" },
  { value: "whatsapp", label: "WhatsApp", color: "#25D366" },
  { value: "whatsapp_vip", label: "WhatsApp VIP", color: "#25D366" },
  { value: "linkedin", label: "LinkedIn", color: "#0A66C2" },
  { value: "kwai", label: "Kwai", color: "#FF8000" },
  { value: "threads", label: "Threads", color: "#000000" },
];

const CATEGORIES = [
  { value: "geral", label: "Geral" },
  { value: "dica", label: "Dica" },
  { value: "promocional", label: "Promocional" },
  { value: "engajamento", label: "Engajamento" },
  { value: "educacional", label: "Educacional" },
  { value: "storytelling", label: "Storytelling" },
  { value: "reels", label: "Reels" },
  { value: "stories", label: "Stories" },
];

const STATUSES = [
  { value: "ready", label: "Pronto" },
  { value: "draft", label: "Rascunho" },
  { value: "posted", label: "Postado" },
  { value: "archived", label: "Arquivado" },
];

function getPlatformColor(platform: string): string {
  return PLATFORMS.find((p) => p.value === platform)?.color ?? "#71717a";
}

function getPlatformLabel(platform: string): string {
  return PLATFORMS.find((p) => p.value === platform)?.label ?? platform;
}

export function PostDescriptionsPanel() {
  const [posts, setPosts] = useState<PostDescription[]>([]);
  const [platformCounts, setPlatformCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  // Modals
  const [editingPost, setEditingPost] = useState<PostDescription | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    platform: "all",
    category: "geral",
    title: "",
    content: "",
    hashtags: "",
    status: "ready",
    notes: "",
  });

  // Bulk upload state
  const [bulkText, setBulkText] = useState("");
  const [bulkPlatform, setBulkPlatform] = useState("all");
  const [bulkCategory, setBulkCategory] = useState("geral");
  const [bulkSeparator, setBulkSeparator] = useState("---");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterPlatform !== "all") params.set("platform", filterPlatform);
      if (filterCategory !== "all") params.set("category", filterCategory);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/post-descriptions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts ?? []);
        setPlatformCounts(data.platformCounts ?? {});
      }
    } finally {
      setLoading(false);
    }
  }, [filterPlatform, filterCategory, filterStatus, search]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingPost(null);
    setForm({
      platform: filterPlatform !== "all" ? filterPlatform : "all",
      category: filterCategory !== "all" ? filterCategory : "geral",
      title: "",
      content: "",
      hashtags: "",
      status: "ready",
      notes: "",
    });
    setShowEditDialog(true);
  };

  const openEdit = (post: PostDescription) => {
    setEditingPost(post);
    setForm({
      platform: post.platform,
      category: post.category,
      title: post.title,
      content: post.content,
      hashtags: post.hashtags ?? "",
      status: post.status,
      notes: post.notes ?? "",
    });
    setShowEditDialog(true);
  };

  const savePost = async () => {
    if (!form.content.trim()) {
      toast.error("Conteúdo é obrigatório");
      return;
    }

    try {
      if (editingPost) {
        // Update
        const res = await fetch(`/api/admin/post-descriptions/${editingPost.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          toast.success("Postagem atualizada!");
          setShowEditDialog(false);
          load();
        } else {
          toast.error("Erro ao atualizar");
        }
      } else {
        // Create
        const res = await fetch("/api/admin/post-descriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          toast.success("Postagem criada!");
          setShowEditDialog(false);
          load();
        } else {
          toast.error("Erro ao criar");
        }
      }
    } catch {
      toast.error("Erro de conexão");
    }
  };

  const deletePost = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/post-descriptions/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Postagem excluída");
        setDeleteId(null);
        load();
      } else {
        toast.error("Erro ao excluir");
      }
    } catch {
      toast.error("Erro de conexão");
    }
  };

  const copyToClipboard = (content: string, hashtags?: string | null) => {
    const fullText = hashtags ? `${content}\n\n${hashtags}` : content;
    navigator.clipboard.writeText(fullText).then(() => {
      toast.success("Copiado para a área de transferência!");
    });
  };

  const sharePost = async (content: string, hashtags?: string | null) => {
    const fullText = hashtags ? `${content}\n\n${hashtags}` : content;
    if (navigator.share) {
      try {
        await navigator.share({ text: fullText });
      } catch {
        // Usuário cancelou
      }
    } else {
      // Fallback: copia
      copyToClipboard(content, hashtags);
    }
  };

  const bulkUpload = async () => {
    if (!bulkText.trim()) {
      toast.error("Cole pelo menos uma postagem");
      return;
    }

    // Divide pelo separador escolhido
    const parts = bulkText.split(bulkSeparator).map((s) => s.trim()).filter(Boolean);

    if (parts.length === 0) {
      toast.error("Nenhuma postagem encontrada");
      return;
    }

    const posts = parts.map((content) => ({
      content,
      platform: bulkPlatform,
      category: bulkCategory,
      status: "ready",
    }));

    try {
      const res = await fetch("/api/admin/post-descriptions?bulk=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.created} postagens criadas!${data.skipped ? ` (${data.skipped} puladas)` : ""}`);
        setShowBulkDialog(false);
        setBulkText("");
        load();
      } else {
        toast.error("Erro ao fazer upload em lote");
      }
    } catch {
      toast.error("Erro de conexão");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header com ações */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-100">
            <FileText className="h-5 w-5 text-emerald-400" />
            Descrições de Postagens
          </h3>
          <p className="mt-1 text-sm text-zinc-400">
            {posts.length} postagem{posts.length !== 1 ? "ns" : ""} • Textos prontos para cada rede social
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkDialog(true)}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <Upload className="mr-1.5 h-4 w-4" />
            Upload em lote
          </Button>
          <Button
            size="sm"
            onClick={openCreate}
            className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nova postagem
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Select value={filterPlatform} onValueChange={setFilterPlatform}>
          <SelectTrigger className="w-[140px] border-zinc-700 bg-zinc-900 text-sm text-zinc-300">
            <SelectValue placeholder="Plataforma" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            {PLATFORMS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
                {platformCounts[p.value] ? ` (${platformCounts[p.value]})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[130px] border-zinc-700 bg-zinc-900 text-sm text-zinc-300">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all">Todas categorias</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[120px] border-zinc-700 bg-zinc-900 text-sm text-zinc-300">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all">Todos status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar no conteúdo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-zinc-700 bg-zinc-900 pl-8 text-sm text-zinc-300"
          />
        </div>
      </div>

      {/* Lista de postagens */}
      {loading ? (
        <div className="flex h-32 items-center justify-center text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando postagens...
        </div>
      ) : posts.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-zinc-700 text-zinc-500">
          <div className="text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">Nenhuma postagem encontrada</p>
            <p className="mt-1 text-xs text-zinc-600">Crie uma nova ou faça upload em lote</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {posts.map((post) => (
            <div
              key={post.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700"
            >
              {/* Header do card */}
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {/* Badge plataforma com cor */}
                <span
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `${getPlatformColor(post.platform)}20`,
                    color: getPlatformColor(post.platform),
                  }}
                >
                  ● {getPlatformLabel(post.platform)}
                </span>

                {/* Badge categoria */}
                <Badge variant="outline" className="border-zinc-700 text-[10px] text-zinc-400">
                  {CATEGORIES.find((c) => c.value === post.category)?.label ?? post.category}
                </Badge>

                {/* Badge status */}
                <Badge
                  className={
                    post.status === "ready"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]"
                      : post.status === "posted"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px]"
                        : post.status === "archived"
                          ? "bg-zinc-700 text-zinc-400 text-[10px]"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]"
                  }
                >
                  {STATUSES.find((s) => s.value === post.status)?.label ?? post.status}
                </Badge>

                {post.title && (
                  <span className="text-xs font-medium text-zinc-300">{post.title}</span>
                )}

                <span className="ml-auto text-[10px] text-zinc-600">
                  {new Date(post.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </div>

              {/* Conteúdo */}
              <p className="whitespace-pre-wrap text-sm text-zinc-300">{post.content}</p>

              {/* Hashtags */}
              {post.hashtags && (
                <p className="mt-1 text-xs text-emerald-400/70">{post.hashtags}</p>
              )}

              {/* Ações */}
              <div className="mt-2 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(post.content, post.hashtags)}
                  className="h-7 px-2 text-xs text-zinc-400 hover:text-emerald-400"
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Copiar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => sharePost(post.content, post.hashtags)}
                  className="h-7 px-2 text-xs text-zinc-400 hover:text-blue-400"
                >
                  <Share2 className="mr-1 h-3 w-3" />
                  Compartilhar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(post)}
                  className="h-7 px-2 text-xs text-zinc-400 hover:text-amber-400"
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteId(post.id)}
                  className="h-7 px-2 text-xs text-zinc-400 hover:text-red-400"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog: Criar/Editar */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] max-w-lg gap-0 overflow-y-auto border-zinc-800 bg-zinc-950 p-0 text-zinc-100">
          <DialogHeader className="border-b border-zinc-800 px-5 py-4">
            <DialogTitle className="text-base font-bold text-emerald-400">
              {editingPost ? "Editar Postagem" : "Nova Postagem"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              {editingPost ? "Atualize os dados da postagem" : "Crie uma nova descrição de postagem"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 py-5">
            {/* Plataforma */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Plataforma</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger className="border-zinc-800 bg-zinc-900 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="border-zinc-800 bg-zinc-900 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Título */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Título (opcional)</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Dica de economia #12"
                maxLength={100}
                className="border-zinc-800 bg-zinc-900 text-sm"
              />
            </div>

            {/* Conteúdo */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Conteúdo *</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Cole aqui a legenda/descrição da postagem..."
                rows={6}
                className="border-zinc-800 bg-zinc-900 text-sm"
              />
              <p className="text-[10px] text-zinc-600">{form.content.length} caracteres</p>
            </div>

            {/* Hashtags */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Hashtags (opcional)</Label>
              <Input
                value={form.hashtags}
                onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
                placeholder="#meucorre #entregador #financas"
                className="border-zinc-800 bg-zinc-900 text-sm text-emerald-400"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="border-zinc-800 bg-zinc-900 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Notas internas (opcional)</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Ex: usar em stories, melhor horário 19h..."
                className="border-zinc-800 bg-zinc-900 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-zinc-800 px-5 py-4">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={savePost}
              className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
            >
              {editingPost ? "Salvar alterações" : "Criar postagem"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Upload em lote */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-h-[90vh] max-w-lg gap-0 overflow-y-auto border-zinc-800 bg-zinc-950 p-0 text-zinc-100">
          <DialogHeader className="border-b border-zinc-800 px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
              <Upload className="h-4 w-4" />
              Upload em Lote
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Cole várias postagens separadas por um delimitador. Cada bloco vira uma postagem.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 py-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Plataforma (todas as postagens)</Label>
                <Select value={bulkPlatform} onValueChange={setBulkPlatform}>
                  <SelectTrigger className="border-zinc-800 bg-zinc-900 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Categoria</Label>
                <Select value={bulkCategory} onValueChange={setBulkCategory}>
                  <SelectTrigger className="border-zinc-800 bg-zinc-900 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Separador entre postagens</Label>
              <div className="flex gap-2">
                <Input
                  value={bulkSeparator}
                  onChange={(e) => setBulkSeparator(e.target.value)}
                  placeholder="---"
                  className="w-32 border-zinc-800 bg-zinc-900 text-sm"
                />
              </div>
              <p className="text-[10px] text-zinc-600">
                Cada bloco separado por <code className="text-emerald-400">{bulkSeparator}</code> vira uma postagem.
                Máx 500 por lote.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Postagens (cole aqui)</Label>
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`Exemplo:\n\nPrimeira postagem aqui...\n\n---\n\nSegunda postagem aqui...\n\n---\n\nTerceira postagem...`}
                rows={10}
                className="border-zinc-800 bg-zinc-900 text-sm"
              />
              {bulkText && (
                <p className="text-[10px] text-zinc-500">
                  {bulkText.split(bulkSeparator).filter((s) => s.trim()).length} postagens detectadas
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-zinc-800 px-5 py-4">
            <Button
              variant="outline"
              onClick={() => setShowBulkDialog(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={bulkUpload}
              className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
            >
              <Send className="mr-1.5 h-4 w-4" />
              Fazer upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Confirmar exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir postagem?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta ação não pode ser desfeita. A postagem será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deletePost}
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
