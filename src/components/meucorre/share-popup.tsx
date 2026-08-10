"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  X,
  Heart,
  Share2,
  WhatsappIcon,
  Facebook,
  Twitter,
  Telegram,
  Copy,
  CheckCheck,
} from "./share-icons";
import { useState } from "react";
import { toast } from "sonner";

interface SharePopupProps {
  open: boolean;
  onClose: () => void;
  referralLink?: string;
  referralReward?: number;
}

const APP_URL = "https://meucorre.vercel.app";
const SHARE_TEXT =
  "Ô meu parceiro, achei esse app MeuCorre que ajuda pacas quem é entregador! Controla corrida, despesa, lucro líquido... tudo num lugar só. Bora testar! 🏍️⚡";

export function SharePopup({ open, onClose, referralLink, referralReward }: SharePopupProps) {
  const [copied, setCopied] = useState(false);

  // Se tem referralLink, usa ele (com ?ref=CODE) em vez da URL base
  const shareUrl = referralLink || APP_URL;
  const shareText = referralLink && referralReward
    ? `${SHARE_TEXT} Se cadastra pelo meu link e quando você virar PRO eu ganho R$ ${referralReward.toFixed(2)}! 💰`
    : SHARE_TEXT;

  const shareLinks = [
    {
      name: "WhatsApp",
      icon: WhatsappIcon,
      color: "#25D366",
      url: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "#1877F2",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      name: "Twitter / X",
      icon: Twitter,
      color: "#000000",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Telegram",
      icon: Telegram,
      color: "#0088CC",
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
  ];

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copiado!", {
      description: referralLink ? "Seu link de indicação foi copiado" : undefined,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "MeuCorre — App pra entregador",
          text: shareText,
          url: shareUrl,
        });
        onClose();
      } catch {
        // user cancelled
      }
    } else {
      copyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-md gap-0 overflow-y-auto border-zinc-800 bg-zinc-950 p-0 text-zinc-100">
        <DialogHeader className="border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
              <Heart className="h-4 w-4 fill-emerald-400" />
              {referralLink ? "Indique e Ganhe!" : "Bora ajudar a galera!"}
            </DialogTitle>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="grid h-7 w-7 place-items-center rounded-full text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <DialogDescription className="mt-1 text-xs text-zinc-400">
            {referralLink && referralReward
              ? `Cada amigo que virar PRO = R$ ${referralReward.toFixed(2)} pra você via PIX 💰`
              : "Ajuda o MeuCorre a chegar em mais entregadores 🙏"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5">
          {/* Mensagem descontraída */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm leading-relaxed text-zinc-300">
            <p className="mb-2">E aí, beleza? 🤙</p>
            <p className="mb-2">
              Se o MeuCorre tá te ajudando a <strong className="text-emerald-400">controlar as corrida</strong> e saber
              quanto cê tá faturando de verdade, <strong className="text-zinc-100">bora ajudar os colega</strong> que
              também corre atrás 🏍️💨
            </p>
            <p className="mb-2">
              A maioria dos entregador que eu conheço tá <strong className="text-zinc-100">na mesma correria</strong>:
              não sabe quanto ganhou no dia, perdendo dinheiro com gasolina sem
              ver... Compartilhar o app é <strong className="text-emerald-400">jogar junto</strong> e ajudar a
              galera a organizar a vida.
            </p>
            <p>
              Bora mandar pra aquele colega que precisa muito? É só um toque 👇
            </p>
          </div>

          {/* Botões de rede social */}
          <div>
            <p className="mb-2 text-xs font-semibold text-zinc-400">
              Compartilha agora:
            </p>
            <div className="grid grid-cols-4 gap-2">
              {shareLinks.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition-all hover:border-zinc-700 hover:bg-zinc-800"
                  >
                    <Icon
                      className="h-7 w-7"
                      style={{ color: s.color }}
                    />
                    <span className="text-[10px] font-medium text-zinc-400">
                      {s.name}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Botão share nativo (mobile) */}
          <Button
            onClick={nativeShare}
            className="w-full bg-emerald-500 py-3 font-bold text-zinc-950 hover:bg-emerald-400"
          >
            <Share2 className="mr-1.5 h-4 w-4" />
            Compartilhar agora
          </Button>

          {/* Copiar link */}
          <div className="flex gap-2">
            <input
              readOnly
              value={APP_URL}
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-500"
            />
            <Button
              onClick={copyLink}
              variant="outline"
              className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            >
              {copied ? (
                <CheckCheck className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <button
            onClick={onClose}
            className="block w-full text-center text-[11px] text-zinc-500 hover:text-zinc-400"
          >
            Depois eu compartilho
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
