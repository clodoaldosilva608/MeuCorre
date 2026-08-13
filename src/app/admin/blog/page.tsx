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
  AlertCircle,
  KeyRound,
  RefreshCw,
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
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<{
    configured?: boolean;
    hasToken?: boolean;
    expired?: boolean;
    needsEnvVars?: boolean;
    authUrl?: string;
  } | null>(null);
  const [oauthCode, setOauthCode] = useState("");
  const [exchangingCode, setExchangingCode] = useState(false);

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

  const loadTokenStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/blog/blogger-token");
      if (res.ok) {
        const data = await res.json();
        setTokenStatus(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    load();
    loadTokenStatus();
  }, [load, loadTokenStatus]);

  // Escuta postMessage do callback OAuth do Blogger
  // (quando o callback abre em popup/nova aba e envia o code de volta)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "blogger-oauth-code" && e.data.code) {
        setOauthCode(e.data.code);
        setTokenModalOpen(true);
        toast.success("Código recebido! Clique em 'Salvar token'");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

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
        if (data.needsEnvVars) {
          toast.error("Variáveis de ambiente faltando", {
            description:
              "Configure BLOGGER_CLIENT_ID e BLOGGER_CLIENT_SECRET na Vercel",
          });
          return;
        }
        if (data.needsAuth) {
          // Abre modal com instruções de autorização
          await loadTokenStatus();
          setBloggerConfirm(null);
          setTokenModalOpen(true);
          toast.info("Autorização necessária", {
            description: "Veja as instruções no modal aberto",
          });
          return;
        }
        toast.error(data.error || "Erro ao publicar no Blogger");
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

  const handleExchangeCode = async () => {
    if (!oauthCode.trim()) {
      toast.error("Cole o código de autorização");
      return;
    }
    setExchangingCode(true);
    try {
      const res = await fetch("/api/admin/blog/blogger-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: oauthCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao trocar código por token");
        return;
      }
      toast.success("Token salvo com sucesso!");
      setOauthCode("");
      setTokenModalOpen(false);
      loadTokenStatus();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setExchangingCode(false);
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setTokenModalOpen(true)}
            className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
          >
            <KeyRound className="mr-1.5 h-4 w-4" />
            Blogger
            {tokenStatus?.needsEnvVars ? (
              <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-400">
                <AlertCircle className="h-2.5 w-2.5" />
                Sem env
              </span>
            ) : tokenStatus?.hasToken ? (
              tokenStatus?.expired ? (
                <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-400">
                  <AlertCircle className="h-2.5 w-2.5" />
                  Expirado
                </span>
              ) : (
                <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-400">
                  <Check className="h-2.5 w-2.5" />
                  Conectado
                </span>
              )
            ) : (
              <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-zinc-700 px-1.5 py-0.5 text-[9px] font-bold uppercase text-zinc-300">
                Desconectado
              </span>
            )}
          </Button>
          <Button
            onClick={() => { setEditing(null); setDialogOpen(true); }}
            className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nova postagem
          </Button>
        </div>
      </div>

      {/* Status do Blogger — banner de aviso quando não configurado */}
      {tokenStatus?.needsEnvVars && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-400">
              Blogger não configurado
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Configure as variáveis de ambiente na Vercel:
              <code className="mx-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300">
                BLOGGER_CLIENT_ID
              </code>
              e
              <code className="mx-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300">
                BLOGGER_CLIENT_SECRET
              </code>
              . Depois clique em "Blogger" acima para autorizar o acesso.
            </p>
          </div>
        </div>
      )}
      {tokenStatus?.hasToken === false && !tokenStatus?.needsEnvVars && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-400">
              Blogger precisa de autorização
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Clique no botão "Blogger" acima para autorizar o acesso à sua
              conta do Google e habilitar a publicação externa.
            </p>
          </div>
        </div>
      )}
      {tokenStatus?.expired && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-400">
              Token do Blogger expirado
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Clique no botão "Blogger" acima para reautorizar. O refresh
              automático falhou ou não há refresh_token salvo.
            </p>
          </div>
        </div>
      )}

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

      {/* Modal de configuração do token do Blogger */}
      <Dialog open={tokenModalOpen} onOpenChange={setTokenModalOpen}>
        <DialogContent className="max-w-lg gap-0 overflow-y-auto border-zinc-800 bg-zinc-900 p-0 text-zinc-100">
          <DialogHeader className="border-b border-zinc-800 px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
              <KeyRound className="h-4 w-4" />
              Configurar Blogger
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Autorize o MeuCorre a publicar no seu blog do Blogger
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 py-5">
            {tokenStatus?.needsEnvVars ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-zinc-300">
                <p className="font-bold text-red-400">
                  Variáveis de ambiente faltando
                </p>
                <p className="mt-2 text-xs">
                  Configure na Vercel → Settings → Environment Variables:
                </p>
                <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                  <li>
                    <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-[11px] text-emerald-400">
                      BLOGGER_CLIENT_ID
                    </code>
                  </li>
                  <li>
                    <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-[11px] text-emerald-400">
                      BLOGGER_CLIENT_SECRET
                    </code>
                  </li>
                  <li>
                    <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-[11px] text-emerald-400">
                      BLOGGER_REDIRECT_URI
                    </code>
                    <span className="ml-1 text-zinc-500">
                      = https://meucorre.vercel.app/api/blogger-callback
                    </span>
                  </li>
                  <li>
                    <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-[11px] text-emerald-400">
                      BLOGGER_BLOG_ID
                    </code>
                  </li>
                </ul>
                <p className="mt-3 text-xs text-zinc-500">
                  Crie as credenciais OAuth em:
                  <br />
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline"
                  >
                    console.cloud.google.com/apis/credentials
                  </a>
                </p>
              </div>
            ) : tokenStatus?.hasToken && !tokenStatus?.expired ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
                <Check className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
                <p className="text-sm font-bold text-emerald-400">
                  Blogger conectado!
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Você já pode publicar posts no Blogger externo.
                </p>
              </div>
            ) : (
              <>
                {/* Passo 1: autorizar */}
                <div>
                  <p className="mb-2 text-xs font-semibold text-zinc-300">
                    Passo 1: Autorize o acesso
                  </p>
                  <a
                    href={tokenStatus?.authUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-500"
                  >
                    <ExternalLink className="mr-1.5 inline h-4 w-4" />
                    Abrir página de autorização do Google
                  </a>
                  <p className="mt-2 text-[11px] text-zinc-500">
                    Você será redirecionado para o Google. Após autorizar, você
                    verá um código na tela.
                  </p>
                </div>

                {/* Passo 2: colar código */}
                <div>
                  <p className="mb-2 text-xs font-semibold text-zinc-300">
                    Passo 2: Cole o código de autorização
                  </p>
                  <Textarea
                    value={oauthCode}
                    onChange={(e) => setOauthCode(e.target.value)}
                    placeholder="Cole aqui o código 4/0A..."
                    rows={4}
                    className="border-zinc-700 bg-zinc-950 font-mono text-xs text-zinc-100 focus:border-emerald-500"
                  />
                  <Button
                    onClick={handleExchangeCode}
                    disabled={exchangingCode || !oauthCode.trim()}
                    className="mt-2 w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                  >
                    {exchangingCode ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        Trocando código por token...
                      </>
                    ) : (
                      <>
                        <Check className="mr-1.5 h-4 w-4" />
                        Salvar token
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {/* Ações adicionais */}
            <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
              <Button
                variant="ghost"
                onClick={loadTokenStatus}
                className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Atualizar status
              </Button>
              {tokenStatus?.hasToken && (
                <Button
                  variant="ghost"
                  onClick={async () => {
                    if (!confirm("Remover token do Blogger?")) return;
                    await fetch("/api/admin/blog/blogger-token", {
                      method: "DELETE",
                    });
                    toast.success("Token removido");
                    loadTokenStatus();
                  }}
                  className="text-red-400 hover:bg-red-950/40 hover:text-red-300"
                >
                  Remover token
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
