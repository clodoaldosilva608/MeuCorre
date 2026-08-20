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
  BookOpen,
  TrendingUp,
  Bike,
  Wallet,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

// ===== Pop-up: "Confira o blog do MeuCorre" =====
//
// Mostra no dashboard (1x por semana) chamando o usuário pra ler o blog.
// Persiste último dismiss em localStorage pra não encher o saco.

const STORAGE_KEY = "meucorre_blog_popup_dismissed_at";
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const HIGHLIGHTS = [
  {
    icon: TrendingUp,
    title: "Calcular lucro real",
    desc: "Saiba quanto você ganha de verdade após despesas",
  },
  {
    icon: Bike,
    title: "Manutenção da moto",
    desc: "Checklist completo pra não quebrar no meio da rua",
  },
  {
    icon: Wallet,
    title: "Planejamento financeiro",
    desc: "Orçamento, reserva de emergência e metas",
  },
];

interface Props {
  forceOpen?: boolean;
  onForceClose?: () => void;
  /** Quando true, NÃO abre automaticamente (outro dialog crítico está ativo). */
  suppress?: boolean;
}

export function BlogPromoPopup({ forceOpen, onForceClose, suppress }: Props = {}) {
  const [autoOpen, setAutoOpen] = useState(false);

  useEffect(() => {
    if (forceOpen !== undefined) return;
    if (typeof window === "undefined") return;
    // Não dispara timer se houver dialog crítico ativo (ex: Nova Corrida)
    if (suppress) return;

    const last = localStorage.getItem(STORAGE_KEY);
    if (!last) {
      const t = setTimeout(() => setAutoOpen(true), 3500);
      return () => clearTimeout(t);
    }
    const lastTime = new Date(last).getTime();
    if (Date.now() - lastTime > ONE_WEEK_MS) {
      const t = setTimeout(() => setAutoOpen(true), 3500);
      return () => clearTimeout(t);
    }
  }, [forceOpen, suppress]);

  // Se suppress ficar true depois do pop-up já estar aberto, fecha ele
  // para liberar a tela pro dialog crítico (ex: DeliveryForm)
  useEffect(() => {
    if (suppress && autoOpen) {
      setAutoOpen(false);
    }
  }, [suppress, autoOpen]);

  const open = forceOpen !== undefined ? forceOpen : autoOpen;

  const handleClose = () => {
    if (forceOpen !== undefined) {
      onForceClose?.();
    } else {
      setAutoOpen(false);
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md gap-0 overflow-hidden border-zinc-800 bg-zinc-950 p-0 text-zinc-100 [&>button]:hidden">
        {/* Header com gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-center">
          <button
            onClick={handleClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-black/20 text-white/80 hover:bg-black/40 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white/20 backdrop-blur"
          >
            <BookOpen className="h-7 w-7 text-white" />
          </motion.div>
          <h2 className="text-xl font-black text-white">
            Fique por dentro das novidades! 📰
          </h2>
          <p className="mt-1 text-sm text-white/90">
            Dicas diárias pra entregador de app — finanças, moto, economia e
            muito mais.
          </p>
        </div>

        <DialogHeader className="sr-only">
          <DialogTitle>Blog MeuCorre — confira os artigos</DialogTitle>
          <DialogDescription>
            Pop-up convidando o usuário a visitar o blog
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5">
          {/* Highlights */}
          <div className="space-y-2">
            {HIGHLIGHTS.map((h, i) => {
              const Icon = h.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-500/10">
                    <Icon className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-100">
                      {h.title}
                    </p>
                    <p className="text-[11px] text-zinc-400">{h.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Novos artigos badge */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-center">
            <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              Novo artigo todo dia!
            </p>
            <p className="mt-0.5 text-[10px] text-zinc-500">
              Já são mais de 90 posts publicados pra te ajudar
            </p>
          </div>

          {/* CTA */}
          <a
            href="/blog"
            className="block w-full rounded-xl bg-emerald-500 py-3.5 text-center text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400"
          >
            Ver todos os artigos
            <ArrowRight className="ml-1.5 inline h-4 w-4" />
          </a>

          <button
            onClick={handleClose}
            className="block w-full text-center text-[11px] text-zinc-500 hover:text-zinc-400"
          >
            Talvez mais tarde
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
