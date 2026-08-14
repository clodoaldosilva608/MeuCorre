"use client";

import { useEffect, useState, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Users,
  Share2,
  Search,
  ExternalLink,
  Loader2,
  Check,
  Filter,
  X,
} from "lucide-react";
import type { PromotionPost, SocialGroup } from "@/lib/promotion-types";

// ===== Compartilhar post em grupos =====
//
// Lista grupos de WhatsApp/Telegram/Facebook/etc. e permite compartilhar
// o post diretamente em cada grupo via deep links.
// Funcionalidade da Fase 2 — atende ao requisito do rascunho manuscrito:
// "botão de compartilhar a publicação que irá direto para as redes sociais correspondentes"

interface Props {
  post: PromotionPost;
}

const PLATFORM_META: Record<
  string,
  { label: string; color: string }
> = {
  whatsapp: { label: "WhatsApp", color: "#25D366" },
  telegram: { label: "Telegram", color: "#0088CC" },
  facebook: { label: "Facebook", color: "#1877F2" },
  instagram: { label: "Instagram", color: "#E1306C" },
  tiktok: { label: "TikTok", color: "#00F2EA" },
  youtube: { label: "YouTube", color: "#FF0000" },
};

// Converte platform do post (ex: "WhatsApp") para a chave do SocialGroup (ex: "whatsapp")
function platformToGroupKey(platform: string): string {
  return platform.toLowerCase();
}

// Gera a URL de share para um grupo específico
function buildGroupShareUrl(
  groupPlatform: string,
  inviteUrl: string,
  text: string,
): string {
  // Extrai o ID/telefone do inviteUrl conforme a plataforma
  const encodedText = encodeURIComponent(text);

  switch (groupPlatform) {
    case "whatsapp": {
      // inviteUrl pode ser https://chat.whatsapp.com/ABC123 ou https://wa.me/5581...
      if (inviteUrl.includes("chat.whatsapp.com")) {
        // Grupo do WhatsApp — não dá pra enviar direto, só abrir o grupo
        return inviteUrl;
      }
      // Número direto
      return `https://wa.me/?text=${encodedText}`;
    }
    case "telegram": {
      // inviteUrl pode ser https://t.me/+abc123 ou https://t.me/share/url?...
      if (inviteUrl.includes("t.me/+") || inviteUrl.includes("t.me/joinchat")) {
        // Link de convite — só abre o grupo
        return inviteUrl;
      }
      // Compartilhar via t.me/share/url
      return `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodedText}`;
    }
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        inviteUrl,
      )}&quote=${encodedText}`;
    case "instagram":
      // Instagram não suporta deep link de share — só abre o perfil
      return inviteUrl;
    case "tiktok":
      // TikTok não suporta deep link de share — só abre o perfil
      return inviteUrl;
    case "youtube":
      // YouTube não suporta deep link de share — só abre o canal
      return inviteUrl;
    default:
      return inviteUrl;
  }
}

function buildShareText(post: PromotionPost): string {
  const parts: string[] = [];
  if (post.title) parts.push(post.title);
  if (post.description) {
    parts.push("");
    parts.push(post.description);
  }
  if (post.hashtags) {
    parts.push("");
    parts.push(post.hashtags);
  }
  if (post.engagementText) {
    parts.push("");
    parts.push(post.engagementText);
  }
  if (post.cta) {
    parts.push("");
    parts.push(post.cta);
  }
  if (post.destinationUrl) {
    parts.push("");
    parts.push(post.destinationUrl);
  }
  return parts.filter(Boolean).join("\n");
}

export function ShareToGroups({ post }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [groups, setGroups] = useState<SocialGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [editText, setEditText] = useState("");
  const [sharedGroups, setSharedGroups] = useState<Set<string>>(new Set());

  // Plataformas-alvo: usa 'platforms' (multi-rede) se existir, senão 'platform' (singular)
  const targetPlatforms = useMemo(() => {
    if (post.platforms) {
      return post.platforms
        .split(",")
        .map((p) => p.trim().toLowerCase())
        .filter(Boolean);
    }
    return [platformToGroupKey(post.platform)];
  }, [post.platform, post.platforms]);

  const defaultText = useMemo(() => buildShareText(post), [post]);

  // Carrega grupos ao abrir modal
  useEffect(() => {
    if (!modalOpen) return;
    setEditText(defaultText);
    setSharedGroups(new Set());
    loadGroups();
  }, [modalOpen, defaultText]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      // Busca grupos de todas as plataformas-alvo
      const params = new URLSearchParams();
      params.set("active", "true");
      params.set("limit", "200");
      const res = await fetch(
        `/api/admin/promotion/groups?${params.toString()}`,
      );
      const data = await res.json();
      if (res.ok) {
        // Filtra só grupos das plataformas-alvo
        const filtered = (data.groups ?? []).filter((g: SocialGroup) =>
          targetPlatforms.includes(g.platform.toLowerCase()),
        );
        setGroups(filtered);
      } else {
        toast.error(data.error || "Erro ao carregar grupos");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  // Filtros aplicados localmente
  const filteredGroups = useMemo(() => {
    let result = groups;
    if (filterPlatform) {
      result = result.filter((g) => g.platform === filterPlatform);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(s) ||
          g.notes?.toLowerCase().includes(s) ||
          g.city?.toLowerCase().includes(s),
      );
    }
    return result;
  }, [groups, filterPlatform, search]);

  // Stats por plataforma
  const platformStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const g of groups) {
      stats[g.platform] = (stats[g.platform] ?? 0) + 1;
    }
    return stats;
  }, [groups]);

  const handleShareToGroup = async (group: SocialGroup) => {
    const url = buildGroupShareUrl(group.platform, group.inviteUrl, editText);
    window.open(url, "_blank", "noopener,noreferrer");

    // Marca como compartilhado
    setSharedGroups((prev) => new Set(prev).add(group.id));

    // Atualiza lastPostedAt no banco
    try {
      await fetch(`/api/admin/promotion/groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastPostedAt: new Date().toISOString() }),
      });
    } catch {
      // erro silencioso — não bloqueia o fluxo
    }

    toast.success(`Abrindo ${group.name}...`, {
      description: "Confirme o envio na janela aberta.",
    });
  };

  const handleShareAll = async () => {
    if (filteredGroups.length === 0) {
      toast.error("Nenhum grupo para compartilhar");
      return;
    }
    toast.info(`Compartilhando em ${filteredGroups.length} grupos...`, {
      description: "As janelas vão abrir uma a uma (aguarde).",
    });

    // Abre um por um com 1.5s de delay pra não bloquear o navegador
    for (let i = 0; i < filteredGroups.length; i++) {
      const group = filteredGroups[i];
      setTimeout(() => {
        handleShareToGroup(group);
      }, i * 1500);
    }
  };

  const availablePlatforms = Object.keys(platformStats);

  return (
    <>
      {/* Botão para abrir o modal */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <Users className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] font-medium uppercase text-zinc-500">
            Compartilhar em grupos
          </span>
        </div>
        <p className="mb-2 text-[11px] text-zinc-400">
          Compartilhe este post diretamente nos grupos de WhatsApp, Telegram,
          Facebook, etc.
        </p>
        <div className="mb-2 flex flex-wrap gap-1">
          {targetPlatforms.map((p) => {
            const meta = PLATFORM_META[p];
            const count = platformStats[p] ?? 0;
            return (
              <span
                key={p}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold"
                style={{
                  backgroundColor: `${meta?.color ?? "#71717a"}20`,
                  color: meta?.color ?? "#71717a",
                }}
              >
                {meta?.label ?? p}: {count}
              </span>
            );
          })}
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="w-full gap-1.5 text-xs"
          size="sm"
        >
          <Users className="h-3.5 w-3.5" />
          Abrir grupos ({groups.length || "..."})
        </Button>
      </div>

      {/* Modal de seleção de grupos */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl gap-0 overflow-hidden border-zinc-800 bg-zinc-900 p-0 text-zinc-100">
          <DialogHeader className="border-b border-zinc-800 px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
              <Users className="h-4 w-4" />
              Compartilhar em grupos
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              {groups.length} grupo(s) disponível(is) para as plataformas:{" "}
              {targetPlatforms
                .map((p) => PLATFORM_META[p]?.label ?? p)
                .join(", ")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {/* Preview do texto editável */}
            <div className="border-b border-zinc-800 p-4">
              <label className="mb-1.5 block text-[10px] font-medium uppercase text-zinc-500">
                Texto da publicação (editável)
              </label>
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={5}
                className="border-zinc-700 bg-zinc-950 text-xs text-zinc-100 focus:border-emerald-500"
              />
              <p className="mt-1 text-[10px] text-zinc-500">
                {editText.length} caracteres
              </p>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 p-3">
              <div className="relative flex-1 min-w-[150px]">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                <Input
                  placeholder="Buscar grupo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs border-zinc-700 bg-zinc-950 text-zinc-100"
                />
              </div>
              {availablePlatforms.length > 1 && (
                <select
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                  className="h-8 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100"
                >
                  <option value="">Todas plataformas</option>
                  {availablePlatforms.map((p) => (
                    <option key={p} value={p}>
                      {PLATFORM_META[p]?.label ?? p} ({platformStats[p]})
                    </option>
                  ))}
                </select>
              )}
              <Button
                onClick={handleShareAll}
                disabled={filteredGroups.length === 0}
                size="sm"
                className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
              >
                <Share2 className="mr-1.5 h-3.5 w-3.5" />
                Compartilhar em todos ({filteredGroups.length})
              </Button>
            </div>

            {/* Lista de grupos */}
            <div className="max-h-[400px] overflow-y-auto p-3">
              {loading ? (
                <div className="flex h-32 items-center justify-center text-zinc-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Carregando grupos...
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
                  <Users className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
                  <p className="text-xs text-zinc-400">
                    Nenhum grupo encontrado para as plataformas-alvo.
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Cadastre grupos na aba <strong>Grupos</strong> primeiro.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredGroups.map((group) => {
                    const meta = PLATFORM_META[group.platform] ?? {
                      label: group.platform,
                      color: "#71717a",
                    };
                    const shared = sharedGroups.has(group.id);
                    return (
                      <div
                        key={group.id}
                        className={`flex items-center gap-2 rounded-lg border p-2 transition ${
                          shared
                            ? "border-emerald-500/40 bg-emerald-500/5"
                            : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                        }`}
                      >
                        <div
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[9px] font-bold uppercase"
                          style={{
                            backgroundColor: `${meta.color}20`,
                            color: meta.color,
                          }}
                        >
                          {meta.label.slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-zinc-100">
                            {group.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-400">
                            <span>{meta.label}</span>
                            {group.memberCount !== null && (
                              <>
                                <span className="text-zinc-600">•</span>
                                <span>{group.memberCount} membros</span>
                              </>
                            )}
                            {group.city && (
                              <>
                                <span className="text-zinc-600">•</span>
                                <span>{group.city}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {shared && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-400">
                            <Check className="h-3 w-3" />
                            Enviado
                          </span>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleShareToGroup(group)}
                          className={`h-7 gap-1 text-[10px] ${
                            shared
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                          }`}
                          variant={shared ? "outline" : "default"}
                        >
                          <ExternalLink className="h-3 w-3" />
                          {shared ? "Reenviar" : "Compartilhar"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-zinc-800 px-5 py-3">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
