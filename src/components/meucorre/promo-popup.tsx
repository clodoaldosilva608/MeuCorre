"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  X,
  Sparkles,
  TrendingDown,
  Bell,
  FileText,
  Cloud,
  Target,
  Wrench,
  ArrowRight,
  Infinity as InfinityIcon,
} from "lucide-react";

interface PromoPopupProps {
  open: boolean;
  onClose: () => void;
  trialDaysLeft?: number;
  isTrialExpired?: boolean;
  remainingLaunches?: number;
}

const PRO_FEATURES = [
  { icon: TrendingDown, label: "Tirar todos os anúncios do app" },
  { icon: FileText, label: "Relatórios PDF mensais com gráficos" },
  { icon: Cloud, label: "Backup em nuvem entre dispositivos" },
  { icon: Target, label: "Metas diárias e semanais com progresso" },
  { icon: Wrench, label: "Lembretes de manutenção (óleo, IPVA)" },
  { icon: Bell, label: "Captura por notificação ilimitada" },
];

export function PromoPopup({
  open,
  onClose,
  trialDaysLeft,
  isTrialExpired,
  remainingLaunches,
}: PromoPopupProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-md gap-0 overflow-y-auto border-zinc-800 bg-zinc-950 p-0 text-zinc-100">
        {/* Header com gradient */}
        <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-center">
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-black/20 text-white/80 hover:bg-black/40 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-2xl bg-white/20 backdrop-blur"
          >
            <Sparkles className="h-7 w-7 text-white" />
          </motion.div>
          <h2 className="text-xl font-black text-white">
            {isTrialExpired
              ? "Seu período grátis acabou 😢"
              : trialDaysLeft !== undefined && trialDaysLeft > 0
                ? `Faltam ${trialDaysLeft} dias do seu teste grátis`
                : "Bora estourar esse limite? 🚀"}
          </h2>
          {isTrialExpired && (
            <p className="mt-1 text-sm text-white/90">
              Você fez {5 - (remainingLaunches ?? 0)} de 5 lançamentos hoje.
            </p>
          )}
        </div>

        <DialogHeader className="sr-only">
          <DialogTitle>Upgrade para MeuCorre PRO</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5">
          {/* Preço */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Oferta de lançamento
            </p>
            <div className="mt-1 flex items-end justify-center gap-2">
              <span className="text-lg font-medium text-zinc-500 line-through">
                R$ 97
              </span>
              <span className="text-4xl font-black text-emerald-400">R$ 18,90</span>
            </div>
            <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-zinc-500">
              <InfinityIcon className="h-3 w-3" />
              Pagamento único • usa pra sempre
            </p>
          </div>

          {/* Features */}
          <div>
            <p className="mb-2 text-xs font-semibold text-zinc-400">
              Com o PRO você desbloqueia:
            </p>
            <ul className="space-y-2">
              {PRO_FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <li key={i} className="flex items-center gap-2.5 text-sm">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-500/10">
                      <Icon className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <span className="text-zinc-300">{f.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* CTA */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-xl bg-emerald-500 py-3.5 text-center text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400"
          >
            Bora ser PRO — R$ 18,90
            <ArrowRight className="ml-1.5 inline h-4 w-4" />
          </a>
          <button
            onClick={onClose}
            className="block w-full text-center text-[11px] text-zinc-500 hover:text-zinc-400"
          >
            {isTrialExpired
              ? "Continuar com 5 lançamentos por dia"
              : "Talvez mais tarde"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
