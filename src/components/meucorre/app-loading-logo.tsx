"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, TrendingUp, ShieldCheck, Clock } from "lucide-react";

// ===== AppLoadingLogo — Splash screen com logo MeuCorre =====
//
// Replica EXATAMENTE o vídeo demonstrativo:
// - Logo oficial no topo
// - Slogan "FINANÇAS PARA QUEM MOVE O BRASIL"
// - Texto "CARREGANDO..." + porcentagem (visíveis desde o início)
// - Barra de progresso com PNEU REALISTA na ponta + notas de dinheiro voando
// - 4 cards de funcionalidades (APARECEM TARDIAMENTE — só após 70% do progresso)
// - Silhueta COMPLETA de motociclista com caixa de entrega
// - Fundo preto com glow neon verde + linhas de velocidade no asfalto

interface AppLoadingLogoProps {
  duration?: number;
  visible?: boolean;
  children?: React.ReactNode;
  onComplete?: () => void;
}

const CARDS = [
  { icon: Wallet, title: "CONTROLE SUAS FINANÇAS" },
  { icon: TrendingUp, title: "AUMENTE SEU LUCRO" },
  { icon: ShieldCheck, title: "SEGURANÇA E CONFIANÇA" },
  { icon: Clock, title: "MAIS TEMPO PARA VOCÊ" },
];

// Notas de dinheiro animadas (posições aleatórias)
const MONEY_NOTES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  x: 5 + Math.random() * 90,
  delay: Math.random() * 1.5,
  duration: 2 + Math.random() * 1.5,
  size: 10 + Math.random() * 8,
}));

export function AppLoadingLogo({
  duration = 2500,
  visible = true,
  children,
  onComplete,
}: AppLoadingLogoProps) {
  const [progress, setProgress] = useState(0);
  const [internalShow, setInternalShow] = useState(true);
  const [cancelled, setCancelled] = useState(false);

  // Anima a porcentagem de 0 → 100
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
        setTimeout(() => {
          if (!cancelled) setInternalShow(false);
        }, 150);
      }
    }, 50);
    return () => {
      clearInterval(interval);
      setCancelled(true);
    };
  }, [duration, cancelled, onComplete]);

  // ESC para cancelar (acessibilidade)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInternalShow(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const shouldShow = visible && internalShow;
  // Cards só aparecem após 70% do progresso (como no vídeo)
  const showCards = progress >= 70;

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
          {/* ===== Fundo: glow + cidade + asfalto ===== */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[100px]" />
            <div className="absolute bottom-0 left-1/2 h-72 w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[80px]" />
            {/* Linhas de velocidade no asfalto */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3">
              {Array.from({ length: 15 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-0.5 bg-emerald-500/25"
                  style={{
                    left: `${Math.random() * 100}%`,
                    width: `${20 + Math.random() * 60}px`,
                  }}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: [0, 0.8, 0], y: [0, -120] }}
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
                className="absolute"
                style={{
                  left: `${note.x}%`,
                  fontSize: `${note.size}px`,
                }}
                initial={{ y: "110vh", opacity: 0, rotate: 0 }}
                animate={{ y: "-15vh", opacity: [0, 0.5, 0], rotate: 360 }}
                transition={{
                  duration: note.duration,
                  repeat: Infinity,
                  delay: note.delay,
                  ease: "linear",
                }}
              >
                <DollarNote />
              </motion.div>
            ))}
          </div>

          {/* ===== Conteúdo principal ===== */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pt-12">
            {/* Logo oficial */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mb-3"
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
              <span className="text-emerald-400">Corre</span>
            </motion.h1>

            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-1 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/80 md:text-xs"
            >
              Finanças para quem move o Brasil
            </motion.p>

            {/* 4 Cards — APARECEM TARDIAMENTE (após 70% do progresso) */}
            <AnimatePresence>
              {showCards && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
                >
                  {CARDS.map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, delay: i * 0.1 }}
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
              )}
            </AnimatePresence>
          </div>

          {/* ===== Barra de progresso + silhueta ===== */}
          <div className="relative z-10 w-full max-w-md px-4 pb-8">
            {/* Texto CARREGANDO + porcentagem (sempre visíveis) */}
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">
                CARREGANDO...
              </span>
              <span className="text-sm font-black text-emerald-400">
                {progress}%
              </span>
            </div>

            {/* Barra de progresso com PNEU REALISTA na ponta */}
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-900">
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              >
                <div className="absolute right-0 top-0 h-full w-8 rounded-full bg-white/30 blur-sm" />
              </motion.div>

              {/* Pneu realista na ponta da barra */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `calc(${progress}% - 14px)` }}
                transition={{ duration: 0.1 }}
              >
                <TireIcon />
              </motion.div>
            </div>

            {/* Silhueta COMPLETA do motociclista */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-4 flex justify-center"
            >
              <MotorcycleRider />
            </motion.div>

            {/* Banner patrocinado (children) */}
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ===== Pneu realista (SVG) =====
function TireIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      className="drop-shadow-lg"
    >
      {/* Pneu externo (borracha) */}
      <circle cx="14" cy="14" r="13" fill="#1a1a1a" stroke="#333" strokeWidth="1" />
      {/* Pneu interno (aro) */}
      <circle cx="14" cy="14" r="9" fill="#0a0a0a" stroke="#444" strokeWidth="1" />
      {/* Centro (hub) */}
      <circle cx="14" cy="14" r="3" fill="#555" />
      <circle cx="14" cy="14" r="1.5" fill="#333" />
      {/* Raios (5) */}
      {[0, 72, 144, 216, 288].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 14 + Math.cos(rad) * 3.5;
        const y1 = 14 + Math.sin(rad) * 3.5;
        const x2 = 14 + Math.cos(rad) * 8.5;
        const y2 = 14 + Math.sin(rad) * 8.5;
        return (
          <line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#555"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        );
      })}
      {/* Brilho no pneu */}
      <circle cx="14" cy="14" r="13" fill="none" stroke="#10b981" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
}

// ===== Nota de dólar (SVG) =====
function DollarNote() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
      <rect x="0.5" y="0.5" width="19" height="13" rx="1.5" fill="#10b981" opacity="0.6" />
      <rect x="0.5" y="0.5" width="19" height="13" rx="1.5" stroke="#10b981" strokeWidth="0.5" opacity="0.8" />
      <circle cx="10" cy="7" r="3.5" fill="none" stroke="#fff" strokeWidth="0.6" opacity="0.5" />
      <text
        x="10"
        y="9.5"
        textAnchor="middle"
        fontSize="6"
        fontWeight="bold"
        fill="#fff"
        opacity="0.7"
      >
        $
      </text>
    </svg>
  );
}

// ===== Silhueta COMPLETA de motociclista com caixa de entrega =====
function MotorcycleRider() {
  return (
    <svg
      width="160"
      height="70"
      viewBox="0 0 160 70"
      fill="none"
      className="text-emerald-500"
    >
      {/* Corpo do motocicleta */}
      <path
        d="M5 60 L15 45 L25 40 L35 35 L45 30 L50 25 L55 20 L60 18 L65 20 L70 25 L75 30 L85 33 L95 36 L105 40 L115 45 L125 50 L135 55 L145 58 L155 60"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.6"
      />
      {/* Tanque */}
      <path
        d="M50 28 Q55 22 65 22 Q72 22 75 28"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />
      {/* Motociclista (corpo) */}
      <path
        d="M55 18 L53 12 L57 8 L62 10 L65 16 L67 22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      {/* Capacete */}
      <ellipse cx="57" cy="7" rx="5" ry="4" fill="currentColor" opacity="0.4" />
      {/* Caixa de entrega nas costas */}
      <rect
        x="48"
        y="10"
        width="12"
        height="14"
        rx="2"
        fill="currentColor"
        opacity="0.2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Rodas */}
      <circle cx="25" cy="60" r="9" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.5" />
      <circle cx="130" cy="60" r="9" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.5" />
      {/* Centro das rodas */}
      <circle cx="25" cy="60" r="2.5" fill="currentColor" opacity="0.5" />
      <circle cx="130" cy="60" r="2.5" fill="currentColor" opacity="0.5" />
      {/* Raios das rodas */}
      {[0, 90, 180, 270].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <line key={`l${angle}`} x1={25 + Math.cos(rad) * 2.5} y1={60 + Math.sin(rad) * 2.5} x2={25 + Math.cos(rad) * 8} y2={60 + Math.sin(rad) * 8} stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
        );
      })}
      {[0, 90, 180, 270].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <line key={`r${angle}`} x1={130 + Math.cos(rad) * 2.5} y1={60 + Math.sin(rad) * 2.5} x2={130 + Math.cos(rad) * 8} y2={60 + Math.sin(rad) * 8} stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
        );
      })}
    </svg>
  );
}
