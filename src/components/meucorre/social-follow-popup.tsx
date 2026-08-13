"use client";

import { useState, useEffect } from "react";
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
  Copy,
  CheckCheck,
  Youtube,
  Instagram,
  Users,
  ArrowRight,
} from "lucide-react";
import {
  WhatsappIcon,
  Facebook,
  Twitter,
  Telegram,
} from "./share-icons";
import { motion } from "framer-motion";
import { toast } from "sonner";

// ===== Pop-up: "Siga nossas redes + compartilhe com amigos" =====
//
// Mostra no dashboard (1x por semana) com 2 funções:
// 1. Seguir Instagram, TikTok e YouTube
// 2. Compartilhar o app com amigos colegas entregadores

const STORAGE_KEY = "meucorre_social_popup_dismissed_at";
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const APP_URL = "https://meucorre.vercel.app";
const SHARE_TEXT =
  "Ô meu parceiro, achei esse app MeuCorre que ajuda pacas quem é entregador! Controla corrida, despesa, lucro líquido... tudo num lugar só. Bora testar! 🏍️⚡";

const SOCIAL_LINKS = [
  {
    name: "Instagram",
    handle: "@meucorr",
    icon: Instagram,
    color: "#E1306C",
    bgColor: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
    url: "https://www.instagram.com/meucorr",
  },
  {
    name: "TikTok",
    handle: "@meucorr",
    icon: TikTokIcon,
    color: "#000000",
    bgColor: "bg-black",
    url: "https://www.tiktok.com/@meucorr",
  },
  {
    name: "YouTube",
    handle: "@meucorre-z4j",
    icon: Youtube,
    color: "#FF0000",
    bgColor: "bg-red-600",
    url: "https://youtube.com/@meucorre-z4j",
  },
];

function TikTokIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

const SHARE_LINKS = [
  {
    name: "WhatsApp",
    icon: WhatsappIcon,
    color: "#25D366",
    url: `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT + " " + APP_URL)}`,
  },
  {
    name: "Facebook",
    icon: Facebook,
    color: "#1877F2",
    url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(APP_URL)}&quote=${encodeURIComponent(SHARE_TEXT)}`,
  },
  {
    name: "Twitter / X",
    icon: Twitter,
    color: "#000000",
    url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(APP_URL)}`,
  },
  {
    name: "Telegram",
    icon: Telegram,
    color: "#0088CC",
    url: `https://t.me/share/url?url=${encodeURIComponent(APP_URL)}&text=${encodeURIComponent(SHARE_TEXT)}`,
  },
];

interface Props {
  forceOpen?: boolean;
  onForceClose?: () => void;
}

export function SocialFollowPopup({ forceOpen, onForceClose }: Props = {}) {
  const [autoOpen, setAutoOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [followedNetworks, setFollowedNetworks] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (forceOpen !== undefined) return;
    if (typeof window === "undefined") return;

    const last = localStorage.getItem(STORAGE_KEY);
    if (!last) {
      const t = setTimeout(() => setAutoOpen(true), 6500);
      return () => clearTimeout(t);
    }
    const lastTime = new Date(last).getTime();
    if (Date.now() - lastTime > ONE_WEEK_MS) {
      const t = setTimeout(() => setAutoOpen(true), 6500);
      return () => clearTimeout(t);
    }
  }, [forceOpen]);

  const open = forceOpen !== undefined ? forceOpen : autoOpen;

  const handleClose = () => {
    if (forceOpen !== undefined) {
      onForceClose?.();
    } else {
      setAutoOpen(false);
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(APP_URL);
    setCopied(true);
    toast.success("Link copiado!", {
      description: "Mande pra algum colega entregador 🏍️",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "MeuCorre — App pra entregador",
          text: SHARE_TEXT,
          url: APP_URL,
        });
      } catch {
        // user cancelled
      }
    } else {
      copyLink();
    }
  };

  const handleFollowClick = (name: string) => {
    setFollowedNetworks((prev) => new Set(prev).add(name));
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-md gap-0 overflow-y-auto border-zinc-800 bg-zinc-950 p-0 text-zinc-100 [&>button]:hidden">
        {/* Header com gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-purple-600 to-emerald-600 p-6 text-center">
          <button
            onClick={handleClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-black/20 text-white/80 hover:bg-black/40 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white/20 backdrop-blur"
          >
            <Heart className="h-7 w-7 fill-white text-white" />
          </motion.div>
          <h2 className="text-xl font-black text-white">
            Bora ajudar a galera! 🙏
          </h2>
          <p className="mt-1 text-sm text-white/90">
            Siga nossas redes e compartilha o MeuCorre com aquele colega que
            precisa organizar o corre.
          </p>
        </div>

        <DialogHeader className="sr-only">
          <DialogTitle>Siga nossas redes e compartilhe</DialogTitle>
          <DialogDescription>
            Pop-up convidando o usuário a seguir redes sociais e compartilhar o
            app
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-5 py-5">
          {/* ===== SEÇÃO 1: Seguir redes ===== */}
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              <p className="text-xs font-semibold text-zinc-300">
                1. Siga o MeuCorre nas redes
              </p>
            </div>
            <div className="space-y-2">
              {SOCIAL_LINKS.map((social, i) => {
                const Icon = social.icon;
                const followed = followedNetworks.has(social.name);
                return (
                  <motion.a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleFollowClick(social.name)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition-all hover:scale-[1.02] ${
                      followed
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                    }`}
                  >
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${social.bgColor}`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-zinc-100">
                        {social.name}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {social.handle}
                      </p>
                    </div>
                    {followed ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                        <CheckCheck className="h-3.5 w-3.5" />
                        Seguiu!
                      </span>
                    ) : (
                      <ArrowRight className="h-4 w-4 text-zinc-500" />
                    )}
                  </motion.a>
                );
              })}
            </div>
          </div>

          {/* Divisor */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-[10px] font-medium text-zinc-500">E</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          {/* ===== SEÇÃO 2: Compartilhar com amigos ===== */}
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5 text-emerald-400" />
              <p className="text-xs font-semibold text-zinc-300">
                2. Compartilha com um colega entregador
              </p>
            </div>

            <div className="mb-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs leading-relaxed text-zinc-300">
              <p>
                A maioria dos entregador que eu conheço tá na mesma correria:
                não sabe quanto ganhou no dia, perdendo dinheiro com gasolina
                sem ver... Compartilhar o app é <strong className="text-emerald-400">jogar junto</strong> e ajudar a
                galera a organizar a vida. 🏍️💨
              </p>
            </div>

            {/* Botões de rede social */}
            <div className="mb-3 grid grid-cols-4 gap-2">
              {SHARE_LINKS.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition-all hover:border-zinc-700 hover:bg-zinc-800"
                  >
                    <Icon className="h-6 w-6" style={{ color: s.color }} />
                    <span className="text-[10px] font-medium text-zinc-400">
                      {s.name}
                    </span>
                  </a>
                );
              })}
            </div>

            {/* Botão share nativo */}
            <Button
              onClick={nativeShare}
              className="w-full bg-emerald-500 py-3 font-bold text-zinc-950 hover:bg-emerald-400"
            >
              <Share2 className="mr-1.5 h-4 w-4" />
              Compartilhar agora
            </Button>

            {/* Copiar link */}
            <div className="mt-2 flex gap-2">
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
          </div>

          <button
            onClick={handleClose}
            className="block w-full text-center text-[11px] text-zinc-500 hover:text-zinc-400"
          >
            Depois eu faço isso
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
