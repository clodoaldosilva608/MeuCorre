"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  ShieldCheck,
  Clock,
} from "lucide-react";

// ===== AppLoadingLogo — Tela de carregamento com logo MeuCorre =====
//
// Replica o design do vídeo demonstrativo:
// - Logo oficial MeuCorre (logo-meucorre.png)
// - Slogan "FINANÇAS PARA QUEM MOVE O BRASIL"
// - Barra de progresso animada com pneu + notas de dinheiro
// - 4 cards de funcionalidades
// - Silhueta de motociclista
// - Fundo escuro com elementos neon verde
//
// Usado em:
// - Carregamento inicial do /app (substitui SplashScreen)
// - Transições de rota quando houver carregamento perceptível
//
// Arquitetura:
// - Componente reutilizável e centralizado
// - Não bloqueia navegação em transições instantâneas
// - Cancelável se usuário navegar novamente
// - Nenhuma atualização após desmontagem

interface AppLoadingLogoProps {
  /** Duração da animação de progresso em ms (default: 2000) */
  duration?: number;
  /** Controlado externamente — se false, anima saída (default: true) */
  visible?: boolean;
  /** Banner patrocinado opcional (children) */
  children?: React.ReactNode;
  /** Callback quando a animação de progresso termina */
  onComplete?: () => void;
}

const CARDS = [
  {
    icon: Wallet,
    title: "CONTROLE SUAS FINANÇAS",
    color: "#10b981",
  },
  {
    icon: TrendingUp,
    title: "AUMENTE SEU LUCRO",
    color: "#10b981",
  },
  {
    icon: ShieldCheck,
    title: "SEGURANÇA E CONFIANÇA",
    color: "#10b981",
  },
  {
    icon: Clock,
    title: "MAIS TEMPO PARA VOCÊ",
    color: "#10b981",
  },
];

// Notas de dinheiro (posições aleatórias para animação)
const MONEY_NOTES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 0.5,
  duration: 1.5 + Math.random() * 1,
  size: 12 + Math.random() * 8,
}));

export function AppLoadingLogo({
  duration = 2000,
  visible = true,
  children,
  onComplete,
}: AppLoadingLogoProps) {
  const [progress, setProgress] = useState(0);
  const [internalShow, setInternalShow] = useState(true);
  const [cancelled, setCancelled] = useState(false);

  // Anima a porcentagem de 0 → 100 durante a duração
  useEffect(() => {
    if (cancelled) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        onComplete?.();
        // Pequeno delay antes de esconder (100ms pra terminar animação)
        setTimeout(() => {
          if (!cancelled) setInternalShow(false);
        }, 100);
      }
    }, 50);

    return () => {
      clearInterval(interval);
      setCancelled(true);
    };
  }, [duration, cancelled, onComplete]);

  // Permite cancelar via ESC (acessibilidade)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setInternalShow(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Visibilidade: controlada externamente (visible) OU internamente (internalShow)
  const shouldShow = visible && internalShow;
  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between overflow-hidden bg-black"
          role="status"
          aria-live="polite"
          aria-label="Carregando MeuCorre"
        >
          {/* ===== Fundo: glow neon + cidade ===== */}
          <div className="pointer-events-none absolute inset-0">
            {/* Glow central */}
            <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-[100px]" />
            {/* Glow inferior */}
            <div className="absolute bottom-0 left-1/2 h-72 w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[80px]" />
            {/* Linhas de velocidade no asfalto */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-0.5 bg-emerald-500/30"
                  style={{
                    left: `${Math.random() * 100}%`,
                    width: `${20 + Math.random() * 60}px`,
                  }}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: [0, 0.8, 0], y: [0, -100] }}
                  transition={{
                    duration: 1 + Math.random(),
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
          </div>

          {/* ===== Notas de dinheiro voando ===== */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {MONEY_NOTES.map((note) => (
              <motion.div
                key={note.id}
                className="absolute text-emerald-500/40"
                style={{
                  left: `${note.x}%`,
                  fontSize: `${note.size}px`,
                }}
                initial={{ y: "100vh", opacity: 0, rotate: 0 }}
                animate={{ y: "-10vh", opacity: [0, 0.6, 0], rotate: 360 }}
                transition={{
                  duration: note.duration,
                  repeat: Infinity,
                  delay: note.delay,
                  ease: "linear",
                }}
              >
                💵
              </motion.div>
            ))}
          </div>

          {/* ===== Conteúdo principal ===== */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4">
            {/* Logo oficial */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mb-4"
            >
              <img
                src="/logo-meucorre.png"
                alt="MeuCorre"
                className="h-20 w-20 rounded-2xl shadow-2xl shadow-emerald-500/30 md:h-24 md:w-24"
              />
            </motion.div>

            {/* Nome + slogan */}
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-center text-2xl font-black tracking-tight text-white md:text-3xl"
            >
              <span className="text-white">Meu</span>
              <span className="text-emerald-400 text-glow-neon">Corre</span>
            </motion.h1>

            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-1 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/80 md:text-xs"
            >
              Finanças para quem move o Brasil
            </motion.p>

            {/* 4 Cards de funcionalidades */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
            >
              {CARDS.map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 + i * 0.1 }}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-center sm:p-3"
                  >
                    <Icon className="h-5 w-5 text-emerald-400 md:h-6 md:w-6" />
                    <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-300 md:text-[9px]">
                      {card.title}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* ===== Barra de progresso + silhueta ===== */}
          <div className="relative z-10 w-full max-w-md px-4 pb-8">
            {/* Barra de progresso */}
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">
                CARREGANDO...
              </span>
              <span className="text-sm font-black text-emerald-400">
                {progress}%
              </span>
            </div>

            <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-900">
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              >
                {/* Brilho na ponta da barra */}
                <div className="absolute right-0 top-0 h-full w-8 rounded-full bg-white/30 blur-sm" />
              </motion.div>

              {/* Pneu na ponta direita da barra */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `calc(${progress}% - 12px)` }}
                transition={{ duration: 0.1 }}
              >
                <div className="grid h-6 w-6 place-items-center rounded-full border-2 border-zinc-700 bg-zinc-900">
                  <div className="h-2 w-2 rounded-full bg-zinc-600" />
                </div>
              </motion.div>
            </div>

            {/* Silhueta do motociclista */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-4 flex justify-center"
            >
              <svg
                width="120"
                height="60"
                viewBox="0 0 120 60"
                fill="none"
                className="text-emerald-500/30"
              >
                {/* Motociclista estilizado */}
                <path
                  d="M10 50 L20 35 L30 30 L40 28 L50 25 L55 20 L60 15 L65 20 L70 25 L80 28 L90 32 L100 38 L110 45 L115 50"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Caixa de entrega nas costas */}
                <rect
                  x="45"
                  y="18"
                  width="15"
                  height="12"
                  rx="2"
                  className="text-emerald-500/20"
                  fill="currentColor"
                />
                {/* Rodas */}
                <circle cx="25" cy="50" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
                <circle cx="95" cy="50" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
                {/* Centro das rodas */}
                <circle cx="25" cy="50" r="2" fill="currentColor" />
                <circle cx="95" cy="50" r="2" fill="currentColor" />
              </svg>
            </motion.div>

            {/* Banner patrocinado (children) */}
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
