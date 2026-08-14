"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  X,
  Copy,
  Check,
  Download,
  Calendar,
  Clock,
  Hash,
  ExternalLink,
  Bell,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  PLATFORM_COLORS,
  STATUS_COLORS,
  STATUS_LABELS,
  formatDateTime,
  type PromotionPost,
  type PromotionReminder,
} from "@/lib/promotion-types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ShareButtons } from "./share-buttons";
import { ShareToGroups } from "./share-to-groups";
import { PublishTelegramButton } from "./publish-telegram-button";

interface Props {
  post: PromotionPost | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPostUpdated?: () => void;
}

type CopyableField =
  | "title"
  | "description"
  | "hashtags"
  | "engagementText"
  | "cta"
  | "destinationUrl"
  | "complete"
  | "altText";

export function PostDetailDrawer({ post, open, onOpenChange, onPostUpdated }: Props) {
  const [copied, setCopied] = useState<CopyableField | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [markingPublished, setMarkingPublished] = useState(false);
  const [creatingReminder, setCreatingReminder] = useState(false);
  const [reminders, setReminders] = useState<PromotionReminder[]>([]);

  // Reset notes quando muda o post
  useEffect(() => {
    const t = setTimeout(() => {
      setNotes(post?.notes ?? "");
      setReminders(post?.reminders ?? []);
    }, 0);
    return () => clearTimeout(t);
  }, [post?.id, post?.notes, post?.reminders, open]);

  const buildCompleteText = (p: PromotionPost): string => {
    const parts = [
      p.title,
      "",
      p.description,
      "",
      p.hashtags ?? "",
      "",
      p.engagementText ?? "",
    ];
    if (p.cta) parts.push("", p.cta);
    if (p.destinationUrl) parts.push("", p.destinationUrl);
    return parts.filter(Boolean).join("\n");
  };

  const handleCopy = async (field: CopyableField) => {
    if (!post) return;
    let text = "";
    switch (field) {
      case "title":
        text = post.title;
        break;
      case "description":
        text = post.description;
        break;
      case "hashtags":
        text = post.hashtags ?? "";
        break;
      case "engagementText":
        text = post.engagementText ?? "";
        break;
      case "cta":
        text = post.cta ?? "";
        break;
      case "destinationUrl":
        text = post.destinationUrl ?? "";
        break;
      case "altText":
        text = post.altText ?? post.title;
        break;
      case "complete":
        text = buildCompleteText(post);
        break;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
      toast.success("Copiado para a área de transferência");
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const handleDownloadICS = () => {
    if (!post) return;
    window.open(`/api/admin/promotion/posts/${post.id}/ics`, "_blank");
  };

  const handleDownloadImage = () => {
    if (!post?.asset?.publicUrl) {
      toast.error("Esta postagem não tem imagem vinculada");
      return;
    }
    const a = document.createElement("a");
    a.href = post.asset.publicUrl;
    a.download = post.asset.name;
    a.target = "_blank";
    a.click();
  };

  const handleOpenImage = () => {
    if (!post?.asset?.publicUrl) {
      toast.error("Esta postagem não tem imagem vinculada");
      return;
    }
    window.open(post.asset.publicUrl, "_blank");
  };

  const handleSaveNotes = async () => {
    if (!post) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/promotion/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        toast.success("Notas salvas");
        onPostUpdated?.();
      }
    } finally {
      setSavingNotes(false);
    }
  };

  const handleMarkPublished = async () => {
    if (!post) return;
    setMarkingPublished(true);
    try {
      const res = await fetch(`/api/admin/promotion/posts/${post.id}/mark-published`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        toast.success("Marcada como publicada");
        onPostUpdated?.();
      }
    } finally {
      setMarkingPublished(false);
    }
  };

  const handleCreateReminder = async () => {
    if (!post) return;
    setCreatingReminder(true);
    try {
      const res = await fetch("/api/admin/promotion/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          minutesBefore: 15,
          channel: "browser",
        }),
      });
      if (res.ok) {
        const { reminder } = await res.json();
        setReminders((r) => [...r, reminder]);
        toast.success("Lembrete criado (15 min antes)");
      } else {
        toast.error("Erro ao criar lembrete");
      }
    } finally {
      setCreatingReminder(false);
    }
  };

  if (!post) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <span
              className="inline-block rounded px-2 py-0.5 text-[10px] font-bold text-white"
              style={{
                backgroundColor: PLATFORM_COLORS[post.platform] ?? "#71717a",
              }}
            >
              {post.platform}
            </span>
            <span>Dia {post.editorialDay} · P{post.sequenceNumber}</span>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${STATUS_COLORS[post.status]}20`,
                color: STATUS_COLORS[post.status],
              }}
            >
              {STATUS_LABELS[post.status]}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Metadados */}
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Calendar className="h-3 w-3" />
              <span>{formatDateTime(post.publishAt)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Clock className="h-3 w-3" />
              <span>{post.format ?? "—"}</span>
            </div>
            {post.pillar && (
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Sparkles className="h-3 w-3" />
                <span>{post.pillar}</span>
              </div>
            )}
            {post.campaign && (
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: post.campaign.color }}
                />
                <span>{post.campaign.name}</span>
              </div>
            )}
          </div>

          {/* Mídias — carrossel de múltiplas imagens (multi-midia Fase 2) */}
          <MediaCarousel post={post} onOpenImage={handleOpenImage} onDownloadImage={handleDownloadImage} />

          {/* Campos com botão de copiar */}
          <CopyableField
            label="Título"
            icon={<FileText className="h-3 w-3" />}
            value={post.title}
            onCopy={() => handleCopy("title")}
            copied={copied === "title"}
          />

          <CopyableField
            label="Descrição / Legenda"
            icon={<FileText className="h-3 w-3" />}
            value={post.description}
            multiline
            onCopy={() => handleCopy("description")}
            copied={copied === "description"}
          />

          {post.hashtags && (
            <CopyableField
              label="Hashtags"
              icon={<Hash className="h-3 w-3" />}
              value={post.hashtags}
              onCopy={() => handleCopy("hashtags")}
              copied={copied === "hashtags"}
            />
          )}

          {post.engagementText && (
            <CopyableField
              label="Texto de engajamento"
              icon={<FileText className="h-3 w-3" />}
              value={post.engagementText}
              multiline
              onCopy={() => handleCopy("engagementText")}
              copied={copied === "engagementText"}
            />
          )}

          {post.cta && (
            <CopyableField
              label="CTA"
              icon={<FileText className="h-3 w-3" />}
              value={post.cta}
              onCopy={() => handleCopy("cta")}
              copied={copied === "cta"}
            />
          )}

          {post.destinationUrl && (
            <CopyableField
              label="Link de destino"
              icon={<ExternalLink className="h-3 w-3" />}
              value={post.destinationUrl}
              onCopy={() => handleCopy("destinationUrl")}
              copied={copied === "destinationUrl"}
              link
            />
          )}

          {post.altText && (
            <CopyableField
              label="Texto alternativo (acessibilidade)"
              icon={<FileText className="h-3 w-3" />}
              value={post.altText}
              onCopy={() => handleCopy("altText")}
              copied={copied === "altText"}
            />
          )}

          {/* Copiar tudo */}
          <Button
            onClick={() => handleCopy("complete")}
            className="w-full gap-2"
            variant="secondary"
          >
            {copied === "complete" ? (
              <>
                <Check className="h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar tudo (legenda completa)
              </>
            )}
          </Button>

          {/* Botões de compartilhar direto nas redes sociais */}
          <ShareButtons post={post} />

          {/* Compartilhar em grupos (WhatsApp, Telegram, etc.) */}
          <ShareToGroups post={post} />

          {/* Publicar no Telegram automaticamente (Bot API) */}
          <PublishTelegramButton post={post} />

          {/* Notas */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-300">
              Notas internas
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas para a equipe (não aparecem na publicação)..."
              rows={3}
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="mt-2 text-xs"
            >
              {savingNotes ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : null}
              Salvar notas
            </Button>
          </div>

          {/* Lembretes */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300">
                Lembretes ({reminders.length})
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCreateReminder}
                disabled={creatingReminder}
                className="h-7 gap-1 text-[10px]"
              >
                {creatingReminder ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Bell className="h-3 w-3" />
                )}
                Criar lembrete (15min antes)
              </Button>
            </div>
            {reminders.length > 0 && (
              <div className="mt-2 space-y-1">
                {reminders.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-[10px]"
                  >
                    <span className="text-zinc-400">
                      {formatDateTime(r.remindAt)} · {r.channel}
                    </span>
                    <Badge variant="outline" className="text-[9px]">
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-3">
            <Button
              onClick={handleMarkPublished}
              disabled={markingPublished || post.status === "published"}
              className="gap-1.5"
            >
              {markingPublished ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {post.status === "published" ? "Já publicada" : "Marcar como publicada"}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadICS}
              className="gap-1.5"
            >
              <Calendar className="h-4 w-4" />
              Baixar ICS
            </Button>
            {post.destinationUrl && (
              <Button
                variant="outline"
                onClick={() => window.open(post.destinationUrl!, "_blank")}
                className="gap-1.5"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir link
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CopyableField({
  label,
  icon,
  value,
  onCopy,
  copied,
  multiline = false,
  link = false,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onCopy: () => void;
  copied: boolean;
  multiline?: boolean;
  link?: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase text-zinc-500">
          {icon}
          {label}
        </span>
        <button
          onClick={onCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copiar
            </>
          )}
        </button>
      </div>
      {link ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="block break-all text-xs text-emerald-400 hover:underline"
        >
          {value}
        </a>
      ) : multiline ? (
        <p className="whitespace-pre-wrap text-xs text-zinc-300">{value}</p>
      ) : (
        <p className="text-xs text-zinc-300">{value}</p>
      )}
    </div>
  );
}

// ===== Carrossel de Mídias (multi-midia Fase 2) =====
// Mostra a mídia principal (asset) + todas as mídias extras (postAssets)
// num carrossel navegável com setas.
function MediaCarousel({
  post,
  onOpenImage,
  onDownloadImage,
}: {
  post: PromotionPost;
  onOpenImage: () => void;
  onDownloadImage: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);

  // Consolida todas as mídias (asset principal + postAssets, sem duplicatas)
  const allMedias = useMemo(() => {
    const medias: Array<{
      id: string;
      publicUrl: string | null;
      name: string;
      altText: string | null;
    }> = [];

    if (post.asset) {
      medias.push({
        id: post.asset.id,
        publicUrl: post.asset.publicUrl,
        name: post.asset.name,
        altText: post.asset.altText,
      });
    }

    if (post.postAssets) {
      for (const pa of post.postAssets) {
        // Evita duplicar o asset principal
        if (pa.asset.id !== post.asset?.id) {
          medias.push({
            id: pa.asset.id,
            publicUrl: pa.asset.publicUrl,
            name: pa.asset.name,
            altText: pa.asset.altText,
          });
        }
      }
    }

    return medias;
  }, [post.asset, post.postAssets]);

  if (allMedias.length === 0) return null;

  const current = allMedias[currentIdx];
  const hasMultiple = allMedias.length > 1;

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
      {/* Container da imagem com navegação */}
      <div className="relative">
        {current.publicUrl ? (
          <img
            src={current.publicUrl}
            alt={current.altText ?? post.title}
            className="aspect-video w-full object-cover"
          />
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center text-zinc-600">
            <ImageIcon className="mb-2 h-8 w-8" />
            <p className="text-xs">Imagem ainda não enviada</p>
            <p className="mt-1 text-[10px] text-zinc-700">{current.name}</p>
          </div>
        )}

        {/* Setas de navegação (só se tiver múltiplas) */}
        {hasMultiple && (
          <>
            <button
              onClick={() =>
                setCurrentIdx((i) => (i - 1 + allMedias.length) % allMedias.length)
              }
              className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() =>
                setCurrentIdx((i) => (i + 1) % allMedias.length)
              }
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
              aria-label="Próxima"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Indicador */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white">
              {currentIdx + 1} / {allMedias.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbs (só se múltiplas) */}
      {hasMultiple && (
        <div className="flex gap-1 overflow-x-auto border-t border-zinc-800 p-2">
          {allMedias.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setCurrentIdx(i)}
              className={`relative h-12 w-16 shrink-0 overflow-hidden rounded border-2 transition ${
                i === currentIdx
                  ? "border-emerald-500"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {m.publicUrl ? (
                <img
                  src={m.publicUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-zinc-800">
                  <ImageIcon className="h-3 w-3 text-zinc-600" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Barra de ações */}
      <div className="flex items-center justify-between border-t border-zinc-800 p-2">
        <span
          className="truncate text-[10px] text-zinc-500"
          title={current.name}
        >
          {current.name}
          {hasMultiple && (
            <span className="ml-1 text-zinc-600">
              ({currentIdx + 1}/{allMedias.length})
            </span>
          )}
        </span>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onOpenImage}
            disabled={!current.publicUrl}
            className="h-7 gap-1 text-[10px]"
          >
            <ExternalLink className="h-3 w-3" />
            Abrir
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDownloadImage}
            disabled={!current.publicUrl}
            className="h-7 gap-1 text-[10px]"
          >
            <Download className="h-3 w-3" />
            Baixar
          </Button>
        </div>
      </div>
    </div>
  );
}
