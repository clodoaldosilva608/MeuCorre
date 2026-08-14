"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Send,
  Loader2,
  Check,
  AlertCircle,
  Users,
  Settings,
  RefreshCw,
} from "lucide-react";
import type { PromotionPost, SocialGroup } from "@/lib/promotion-types";

// ===== Botão publicar no Telegram automaticamente =====
//
// Mostra botão no drawer do post que publica diretamente nos
// grupos de Telegram cadastrados, usando a Bot API do Telegram.

interface Props {
  post: PromotionPost;
}

interface ConfigStatus {
  configured: boolean;
  valid?: boolean;
  botInfo?: { username: string; firstName: string };
  needsConfig?: boolean;
  message?: string;
  error?: string;
}

interface PublishResult {
  chatId: string;
  groupName?: string;
  success: boolean;
  messageId?: number;
  error?: string;
}

export function PublishTelegramButton({ post }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [groups, setGroups] = useState<SocialGroup[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<PublishResult[] | null>(null);

  const loadConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch("/api/admin/promotion/telegram-config");
      const data = await res.json();
      setConfig(data);
    } catch {
      setConfig({ configured: false, message: "Erro de conexão" });
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      const res = await fetch(
        "/api/admin/promotion/groups?platform=telegram&active=true&limit=200",
      );
      const data = await res.json();
      setGroups(data.groups ?? []);
    } catch {
      setGroups([]);
    }
  }, []);

  useEffect(() => {
    if (modalOpen) {
      loadConfig();
      loadGroups();
      setResults(null);
    }
  }, [modalOpen, loadConfig, loadGroups]);

  const handlePublish = async () => {
    setPublishing(true);
    setResults(null);

    try {
      const res = await fetch("/api/admin/promotion/publish-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.needsConfig) {
          toast.error("Bot não configurado", {
            description: "Configure o Telegram primeiro",
          });
          setConfigOpen(true);
        } else {
          toast.error(data.error || "Erro ao publicar");
        }
        return;
      }

      setResults(data.results || []);
      toast.success(
        `Publicado em ${data.successCount}/${data.totalTargets} grupos`,
        {
          description:
            data.failureCount > 0
              ? `${data.failureCount} falha(s)`
              : "Todas as publicações foram enviadas!",
        },
      );
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setPublishing(false);
    }
  };

  const isConfigured = config?.configured && config?.valid;

  return (
    <>
      {/* Botão no drawer */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Send className="h-3 w-3 text-[#0088CC]" />
            <span className="text-[10px] font-medium uppercase text-zinc-500">
              Publicar no Telegram
            </span>
          </div>
          {isConfigured ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-400">
              <Check className="h-2.5 w-2.5" />
              Conectado
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-zinc-700 px-1.5 py-0.5 text-[9px] font-bold uppercase text-zinc-300">
              Desconectado
            </span>
          )}
        </div>
        <p className="mb-2 text-[11px] text-zinc-400">
          Publica automaticamente em todos os grupos de Telegram cadastrados.
        </p>
        <div className="flex gap-1.5">
          <Button
            onClick={() => setModalOpen(true)}
            className="flex-1 gap-1.5 text-xs"
            size="sm"
            style={{ backgroundColor: "#0088CC" }}
          >
            <Send className="h-3.5 w-3.5" />
            Publicar agora
          </Button>
          <Button
            onClick={() => setConfigOpen(true)}
            variant="outline"
            size="sm"
            className="border-zinc-700 bg-zinc-950 text-zinc-400 hover:bg-zinc-800"
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Modal de confirmação + resultados */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg gap-0 border-zinc-800 bg-zinc-900 p-0 text-zinc-100">
          <DialogHeader className="border-b border-zinc-800 px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-[#0088CC]">
              <Send className="h-4 w-4" />
              Publicar no Telegram
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              {post.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 py-5">
            {loadingConfig ? (
              <div className="flex h-20 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
              </div>
            ) : !isConfigured ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-center">
                <AlertCircle className="mx-auto mb-2 h-8 w-8 text-amber-400" />
                <p className="text-sm font-bold text-amber-400">
                  Bot não configurado
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Configure o bot do Telegram primeiro pra habilitar a publicação
                  automática.
                </p>
                <Button
                  onClick={() => {
                    setModalOpen(false);
                    setConfigOpen(true);
                  }}
                  className="mt-3 bg-amber-500 text-zinc-950 hover:bg-amber-400"
                  size="sm"
                >
                  <Settings className="mr-1.5 h-3.5 w-3.5" />
                  Configurar bot
                </Button>
              </div>
            ) : results ? (
              // Mostra resultados da publicação
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-zinc-100">
                    {results.filter((r) => r.success).length} / {results.length}{" "}
                    grupos publicados
                  </span>
                </div>
                <div className="max-h-60 space-y-1.5 overflow-y-auto">
                  {results.map((r, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 rounded border p-2 text-xs ${
                        r.success
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-red-500/30 bg-red-500/5"
                      }`}
                    >
                      {r.success ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-zinc-200">
                          {r.groupName || r.chatId}
                        </p>
                        {!r.success && r.error && (
                          <p className="truncate text-[10px] text-red-400">
                            {r.error}
                          </p>
                        )}
                      </div>
                      {r.messageId && (
                        <span className="text-[10px] text-zinc-500">
                          #{r.messageId}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Confirmação antes de publicar
              <>
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                  <p className="flex items-center gap-1.5 text-xs text-zinc-300">
                    <Users className="h-3 w-3 text-[#0088CC]" />
                    <strong>{groups.length}</strong> grupo(s) serão notificados
                  </p>
                  {config?.botInfo && (
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Bot: @{config.botInfo.username}
                    </p>
                  )}
                </div>

                {groups.length === 0 ? (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-center">
                    <p className="text-xs text-amber-400">
                      Nenhum grupo de Telegram cadastrado.
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Cadastre grupos na aba <strong>Grupos</strong> com links
                      no formato <code className="text-emerald-400">t.me/c/123...</code>
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                    <p className="mb-1.5 text-[10px] font-medium uppercase text-zinc-500">
                      Grupos:
                    </p>
                    <div className="max-h-32 space-y-1 overflow-y-auto">
                      {groups.map((g) => (
                        <div
                          key={g.id}
                          className="truncate text-[11px] text-zinc-300"
                        >
                          • {g.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-lg bg-zinc-800/50 p-2.5 text-[11px] text-zinc-400">
                  <p>
                    📤 A publicação envia:{" "}
                    <strong className="text-zinc-300">título + descrição + hashtags + CTA + link</strong>
                    {post.asset?.publicUrl && (
                      <> + <strong className="text-zinc-300">imagem de capa</strong></>
                    )}
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="border-t border-zinc-800 px-5 py-4">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
            >
              {results ? "Fechar" : "Cancelar"}
            </Button>
            {!results && isConfigured && groups.length > 0 && (
              <Button
                onClick={handlePublish}
                disabled={publishing}
                style={{ backgroundColor: "#0088CC" }}
                className="text-white hover:opacity-90"
              >
                {publishing ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-4 w-4" />
                    Publicar em {groups.length} grupo(s)
                  </>
                )}
              </Button>
            )}
            {results && (
              <Button
                onClick={handlePublish}
                disabled={publishing}
                variant="outline"
                className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Repetir
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de configuração */}
      <TelegramConfigLazy
        open={configOpen}
        onOpenChange={setConfigOpen}
        onSaved={() => loadConfig()}
      />
    </>
  );
}

// Lazy import do TelegramConfig (evita carregar se não usado)
import { TelegramConfig } from "./telegram-config";

function TelegramConfigLazy({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  if (!open) return null;
  return <TelegramConfig open={open} onOpenChange={onOpenChange} onSaved={onSaved} />;
}
