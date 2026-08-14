"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Share2,
  X,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import type { PromotionPost } from "@/lib/promotion-types";

// ===== Botões de Compartilhar via Deep Links =====
//
// Adiciona 5 botões no post-detail-drawer pra compartilhar diretamente:
// - WhatsApp (wa.me)
// - Telegram (t.me/share/url)
// - Facebook (sharer.php)
// - Twitter/X (intent/tweet)
// - Email (mailto)
//
// Funciona com web share APIs — sem OAuth, sem tokens, sem configuração.
// Cada botão abre um modal de preview do texto formatado antes de compartilhar.

interface Props {
  post: PromotionPost;
}

type ShareTarget = "whatsapp" | "telegram" | "facebook" | "twitter" | "email";

const SHARE_TARGETS: Array<{
  id: ShareTarget;
  label: string;
  color: string;
  bgColor: string;
}> = [
  { id: "whatsapp", label: "WhatsApp", color: "#25D366", bgColor: "#25D366" },
  { id: "telegram", label: "Telegram", color: "#0088CC", bgColor: "#0088CC" },
  { id: "facebook", label: "Facebook", color: "#1877F2", bgColor: "#1877F2" },
  { id: "twitter", label: "Twitter / X", color: "#000000", bgColor: "#1d1d1d" },
  { id: "email", label: "Email", color: "#6b7280", bgColor: "#6b7280" },
];

function buildShareText(post: PromotionPost): string {
  const parts: string[] = [];

  // Título
  if (post.title) parts.push(post.title);

  // Descrição
  if (post.description) {
    parts.push(""); // linha em branco
    parts.push(post.description);
  }

  // Hashtags
  if (post.hashtags) {
    parts.push("");
    parts.push(post.hashtags);
  }

  // Texto de engajamento
  if (post.engagementText) {
    parts.push("");
    parts.push(post.engagementText);
  }

  // CTA
  if (post.cta) {
    parts.push("");
    parts.push(post.cta);
  }

  // Link de destino
  if (post.destinationUrl) {
    parts.push("");
    parts.push(post.destinationUrl);
  }

  return parts.filter(Boolean).join("\n");
}

function buildShareUrl(target: ShareTarget, text: string, url: string): string {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  const encodedTextAndUrl = encodeURIComponent(`${text}\n\n${url}`);

  switch (target) {
    case "whatsapp":
      // WhatsApp aceita só text (pode incluir URL dentro do text)
      return `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`;

    case "telegram":
      // Telegram aceita url + text separados
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;

    case "facebook":
      // Facebook sharer aceita u (URL) + quote (texto)
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;

    case "twitter":
      // Twitter/X aceita text + url separados
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;

    case "email":
      // Email: subject + body
      const subject = text.split("\n")[0] || "Confira o MeuCorre";
      const body = `${text}\n\n${url}`;
      return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
}

export function ShareButtons({ post }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<ShareTarget | null>(null);
  const [editText, setEditText] = useState("");
  const [copied, setCopied] = useState(false);

  const defaultText = useMemo(() => buildShareText(post), [post]);
  const shareUrl = post.destinationUrl || "https://meucorre.vercel.app";

  const handleOpenModal = (target: ShareTarget) => {
    setSelectedTarget(target);
    setEditText(defaultText);
    setModalOpen(true);
  };

  const handleShare = () => {
    if (!selectedTarget) return;
    const url = buildShareUrl(selectedTarget, editText, shareUrl);
    window.open(url, "_blank", "noopener,noreferrer");
    setModalOpen(false);
    toast.success("Abrindo rede social...", {
      description: "Confirme a publicação na janela que foi aberta.",
    });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: defaultText,
          url: shareUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleOpenModal("whatsapp");
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(`${editText}\n\n${shareUrl}`);
      setCopied(true);
      toast.success("Texto copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const selectedTargetInfo = SHARE_TARGETS.find((t) => t.id === selectedTarget);

  return (
    <>
      {/* Botões de share — grid de 5 */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <Share2 className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] font-medium uppercase text-zinc-500">
            Compartilhar direto
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {SHARE_TARGETS.map((target) => (
            <button
              key={target.id}
              onClick={() => handleOpenModal(target.id)}
              className="group flex flex-col items-center gap-1 rounded-md border border-zinc-800 bg-zinc-950 p-2 transition-all hover:border-zinc-700 hover:bg-zinc-800"
              title={`Compartilhar no ${target.label}`}
            >
              <ShareIcon target={target.id} color={target.color} />
              <span className="text-[9px] font-medium text-zinc-400 group-hover:text-zinc-200">
                {target.label}
              </span>
            </button>
          ))}
        </div>

        {/* Botão share nativo (mobile) */}
        <Button
          onClick={handleNativeShare}
          variant="outline"
          size="sm"
          className="mt-2 w-full gap-1.5 text-[11px]"
        >
          <Share2 className="h-3 w-3" />
          Compartilhar (nativo)
        </Button>
      </div>

      {/* Modal de preview do texto */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg gap-0 overflow-y-auto border-zinc-800 bg-zinc-900 p-0 text-zinc-100">
          <DialogHeader className="border-b border-zinc-800 px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
              <ShareIcon target={selectedTarget} color={selectedTargetInfo?.color} />
              Compartilhar no {selectedTargetInfo?.label}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Revise o texto antes de compartilhar. Você pode editar livremente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 px-5 py-4">
            {/* Preview da imagem (se houver) */}
            {post.asset?.publicUrl && (
              <div className="overflow-hidden rounded-lg border border-zinc-800">
                <img
                  src={post.asset.publicUrl}
                  alt={post.title}
                  className="aspect-video w-full object-cover"
                />
              </div>
            )}

            {/* Texto editável */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300">
                  Texto da publicação
                </label>
                <button
                  onClick={handleCopyText}
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
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={8}
                className="border-zinc-700 bg-zinc-950 text-xs text-zinc-100 focus:border-emerald-500"
              />
              <p className="mt-1 text-[10px] text-zinc-500">
                {editText.length} caracteres
                {selectedTarget === "twitter" && editText.length > 280 && (
                  <span className="ml-2 text-red-400">
                    ⚠️ Twitter limita a 280 caracteres
                  </span>
                )}
              </p>
            </div>

            {/* URL que será anexada */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2">
              <p className="text-[10px] font-medium uppercase text-zinc-500">
                Link anexado
              </p>
              <p className="mt-0.5 truncate text-xs text-emerald-400">{shareUrl}</p>
            </div>

            {/* Aviso */}
            <div className="rounded-lg bg-zinc-800/50 p-2.5 text-[11px] text-zinc-400">
              <p className="flex items-start gap-1.5">
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                <span>
                  Ao clicar em &ldquo;Compartilhar&rdquo;, uma nova aba abrirá no{" "}
                  {selectedTargetInfo?.label} com o texto pré-preenchido. Você
                  precisa confirmar a publicação manualmente.
                </span>
              </p>
            </div>
          </div>

          <DialogFooter className="border-t border-zinc-800 px-5 py-4">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleShare}
              className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
            >
              <Share2 className="mr-1.5 h-4 w-4" />
              Compartilhar agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Ícones SVG inline de cada rede social
function ShareIcon({
  target,
  color,
}: {
  target: ShareTarget | null;
  color?: string;
}) {
  if (!target) return null;
  const c = color || "#71717a";

  switch (target) {
    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" fill={c} className="h-5 w-5">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      );

    case "telegram":
      return (
        <svg viewBox="0 0 24 24" fill={c} className="h-5 w-5">
          <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.324-.437.891-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      );

    case "facebook":
      return (
        <svg viewBox="0 0 24 24" fill={c} className="h-5 w-5">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );

    case "twitter":
      return (
        <svg viewBox="0 0 24 24" fill={c} className="h-5 w-5">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );

    case "email":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" className="h-5 w-5">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      );
  }
}
