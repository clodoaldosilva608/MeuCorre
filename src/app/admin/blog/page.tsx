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
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  ExternalLink,
  Loader2,
  Send,
  Check,
} from "lucide-react";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  coverUrl: string | null;
  category: string;
  labels: string | null;
  published: boolean;
  bloggerPostId: string | null;
  bloggerUrl: string | null;
  createdAt: string;
}

const CATEGORIES = [
  { value: "financas", label: "Finanças" },
  { value: "moto", label: "Moto" },
  { value: "economia", label: "Economia" },
  { value: "estrategia", label: "Estratégia" },
  { value: "equipamentos", label: "Equipamentos" },
  { value: "produtividade", label: "Produtividade" },
  { value: "impostos", label: "Impostos" },
  { value: "dicas", label: "Dicas" },
];

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [bloggerConfirm, setBloggerConfirm] = useState<BlogPost | null>(null);
  const [publishingBlogger, setPublishingBlogger] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      toast.error("Erro ao carregar posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (postData: Partial<BlogPost>) => {
    setSaving(true);
    try {
      const url = editing ? `/api/admin/blog/${editing.id}` : "/api/admin/blog";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar");
        return;
      }
      toast.success(editing ? "Post atualizado" : "Post criado");

      // Se for um post novo, pergunta se quer publicar no Blogger
      if (!editing) {
        setDialogOpen(false);
        setBloggerConfirm(data.post);
      } else {
        setDialogOpen(false);
      }
      load();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  const handlePublishBlogger = async (postId: string) => {
    setPublishingBlogger(true);
    try {
      const res = await fetch("/api/admin/blog/publish-blogger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsAuth) {
          toast.error("Token expirado", {
            description: "Abra a URL de autorização no console",
          });
          console.log("Autorize:", data.authUrl);
        } else {
          toast.error(data.error || "Erro ao publicar no Blogger");
        }
        return;
      }
      toast.success("Publicado no Blogger!", {
        description: data.bloggerUrl,
      });
      setBloggerConfirm(null);
      load();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setPublishingBlogger(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/blog/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Post removido");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Erro ao remover");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-100">
            <FileText className="h-6 w-6 text-emerald-400" />
            Blog
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Crie e gerencie postagens. Publique no blog interno e no Blogger externo.
          </p>
        </div>
        <Button
          onClick={() => { setEditing(null); setDialogOpen(true); }}
          className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Nova postagem
        </Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-zinc-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando...
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-300">Nenhuma postagem</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <PostRow
              key={post.id}
              post={post}
              onEdit={() => { setEditing(post); setDialogOpen(true); }}
              onDelete={() => setDeleteTarget(post)}
              onPublishBlogger={() => setBloggerConfirm(post)}
            />
          ))}
        </div>
      )}

      {/* Dialog de criação/edição */}
      <PostDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={handleSave}
        saving={saving}
      />

      {/* POP-UP DE APROVAÇÃO PARA BLOGGER */}
      <Dialog open={!!bloggerConfirm} onOpenChange={(o) => !o && setBloggerConfirm(null)}>
        <DialogContent className="max-w-md border-zinc-800 bg-zinc-900 p-0 text-zinc-100">
          <DialogHeader className="border-b border-zinc-800 px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
              <Send className="h-4 w-4" />
              Publicar no Blogger externo?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              O post será publicado em meucorre.blogspot.com
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 px-5 py-5">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              <p className="text-xs font-semibold text-zinc-300">{bloggerConfirm?.title}</p>
              <p className="mt-1 text-[11px] text-zinc-500">{bloggerConfirm?.description}</p>
            </div>

            {bloggerConfirm?.bloggerUrl && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-center">
                <p className="flex items-center justify-center gap-1 text-xs text-emerald-400">
                  <Check className="h-3 w-3" />
                  Já publicado no Blogger
                </p>
                <a
                  href={bloggerConfirm.bloggerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-[10px] text-emerald-400 hover:underline"
                >
                  {bloggerConfirm.bloggerUrl}
                </a>
              </div>
            )}

            <div className="rounded-lg bg-zinc-800/50 p-3 text-[11px] text-zinc-400">
              <p className="font-semibold text-zinc-300">O que será publicado:</p>
              <ul className="mt-1 space-y-0.5">
                <li>• Título e conteúdo completo</li>
                <li>• Imagem de capa (se houver)</li>
                <li>• Tags/categorias</li>
                <li>• Link para o app MeuCorre</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="border-t border-zinc-800 px-5 py-4">
            <Button
              variant="outline"
              onClick={() => setBloggerConfirm(null)}
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
            >
              Não publicar
            </Button>
            <Button
              onClick={() => bloggerConfirm && handlePublishBlogger(bloggerConfirm.id)}
              disabled={publishingBlogger}
              className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
            >
              {publishingBlogger ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Publicando...
                </>
              ) : bloggerConfirm?.bloggerUrl ? (
                "Atualizar no Blogger"
              ) : (
                "Sim, publicar no Blogger"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover postagem?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta ação não pode ser desfeita. A postagem será permanentemente removida.
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

function PostRow({
  post,
  onEdit,
  onDelete,
  onPublishBlogger,
}: {
  post: BlogPost;
  onEdit: () => void;
  onDelete: () => void;
  onPublishBlogger: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      {/* Capa */}
      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-800">
        {post.coverUrl && (
          <img src={post.coverUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-zinc-100">{post.title}</p>
          {!post.published && (
            <span className="rounded-full bg-zinc-700 px-1.5 py-0.5 text-[9px] font-bold uppercase text-zinc-300">
              Rascunho
            </span>
          )}
          {post.bloggerUrl && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-400">
              <Check className="h-2.5 w-2.5" />
              Blogger
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-400">
          <span>{post.category}</span>
          <span className="text-zinc-600">•</span>
          <a
            href={`/blog/${post.slug}`}
            target="_blank"
            className="text-emerald-400 hover:underline"
          >
            /blog/{post.slug.slice(0, 20)}...
          </a>
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1">
        {/* Publicar no Blogger */}
        <button
          onClick={onPublishBlogger}
          className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400"
          title="Publicar no Blogger externo"
        >
          <Send className="h-4 w-4" />
        </button>

        {post.bloggerUrl && (
          <a
            href={post.bloggerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="grid h-8 w-8 place-items-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-blue-400"
            title="Ver no Blogger"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}

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

function PostDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
  saving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: BlogPost | null;
  onSaved: (data: Partial<BlogPost>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    coverUrl: "",
    category: "dicas",
    labels: "",
    published: true,
  });

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      if (editing) {
        setForm({
          title: editing.title,
          description: editing.description,
          content: editing.content,
          coverUrl: editing.coverUrl || "",
          category: editing.category,
          labels: editing.labels || "",
          published: editing.published,
        });
      } else {
        setForm({
          title: "",
          description: "",
          content: "",
          coverUrl: "",
          category: "dicas",
          labels: "",
          published: true,
        });
      }
    }, 0);
    return () => clearTimeout(t);
  }, [open, editing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaved(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl gap-0 overflow-y-auto border-zinc-800 bg-zinc-900 p-0 text-zinc-100">
        <DialogHeader className="border-b border-zinc-800 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
            <FileText className="h-4 w-4" />
            {editing ? "Editar postagem" : "Nova postagem"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Título *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              maxLength={200}
              className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Descrição (resumo) *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              maxLength={300}
              rows={2}
              className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Conteúdo (HTML) *</Label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              rows={12}
              className="border-zinc-700 bg-zinc-950 font-mono text-xs text-zinc-100 focus:border-emerald-500"
              placeholder="<h2>Título da seção</h2><p>Conteúdo...</p>"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">URL da capa</Label>
              <Input
                value={form.coverUrl}
                onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
                placeholder="https://..."
                className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Categoria</Label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Tags (separadas por vírgula)</Label>
            <Input
              value={form.labels}
              onChange={(e) => setForm({ ...form, labels: e.target.value })}
              placeholder="entregador, meucorre, dicas"
              className="border-zinc-700 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <Switch
              checked={form.published}
              onCheckedChange={(v) => setForm({ ...form, published: v })}
            />
            Publicado
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
              ) : editing ? "Salvar alterações" : "Criar postagem"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
