"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, TrendingUp, ShieldCheck, Clock } from "lucide-react";

// ===== AppLoadingLogo — Splash screen idêntico ao vídeo =====
//
// Layout EXATO do vídeo (de cima para baixo):
// 1. Logo vetorial (raio + pneu) — NÃO é PNG quadrado
// 2. "MeuCorre" (branco + verde neon)
// 3. "FINANÇAS PARA QUEM MOVE O BRASIL" (verde neon, uppercase)
// 4. Barra de progresso horizontal com PNEU REALISTA na ponta direita
//    + notas de dinheiro ($) voando ao redor
// 5. Porcentagem GRANDE BRANCA ABAIXO da barra (centralizada)
// 6. Container ÚNICO com 4 cards lado a lado (borda verde neon)
// 7. Motociclista de costas com caixa de entrega sobre estrada neon
// 8. Skyline de cidade ao fundo + estrada com linhas de neon em perspectiva

interface AppLoadingLogoProps {
  duration?: number;
  visible?: boolean;
  children?: React.ReactNode;
  onComplete?: () => void;
}

export function AppLoadingLogo({
  duration = 2500,
  visible = true,
  children,
  onComplete,
}: AppLoadingLogoProps) {
  const [progress, setProgress] = useState(0);
  const [internalShow, setInternalShow] = useState(true);
  const [cancelled, setCancelled] = useState(false);

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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInternalShow(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const shouldShow = visible && internalShow;

  if (!shouldShow) return null;

  // Notas de dinheiro (posições ao redor da barra)
  const moneyNotes = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: 5 + Math.random() * 90,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 1.5,
    size: 10 + Math.random() * 8,
    rotate: Math.random() * 360,
  }));

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
          {/* ===== Fundo: cidade + estrada neon ===== */}
          <div className="pointer-events-none absolute inset-0">
            {/* Glow central */}
            <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
            {/* Glow inferior */}
            <div className="absolute bottom-0 left-1/2 h-72 w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[80px]" />

            {/* Skyline de cidade (ao fundo, parte inferior) */}
            <CitySkyline />

            {/* Estrada com linhas de neon em perspectiva */}
            <div className="absolute bottom-0 left-0 right-0 h-2/5">
              {/* Estrada em perspectiva (triângulo que vem do fundo) */}
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2"
                style={{
                  width: "0",
                  height: "0",
                  borderLeft: "50vw solid transparent",
                  borderRight: "50vw solid transparent",
                  borderBottom: "40vh solid rgba(16, 185, 129, 0.05)",
                }}
              />
              {/* Linhas de neon na estrada */}
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-0.5 bg-emerald-400/40"
                  style={{
                    left: `${30 + Math.random() * 40}%`,
                    width: `${30 + Math.random() * 80}px`,
                    bottom: `${Math.random() * 100}%`,
                  }}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: [0, 0.8, 0], scaleX: [0, 1, 1] }}
                  transition={{
                    duration: 0.8 + Math.random(),
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
          </div>

          {/* ===== Notas de dinheiro voando ao redor da barra ===== */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {moneyNotes.map((note) => (
              <motion.div
                key={note.id}
                className="absolute"
                style={{
                  left: `${note.x}%`,
                  top: "40%",
                }}
                initial={{ y: 50, opacity: 0, rotate: note.rotate }}
                animate={{
                  y: [50, -150],
                  opacity: [0, 0.7, 0],
                  rotate: note.rotate + 180,
                }}
                transition={{
                  duration: note.duration,
                  repeat: Infinity,
                  delay: note.delay,
                  ease: "easeOut",
                }}
              >
                <DollarNote size={note.size} />
              </motion.div>
            ))}
          </div>

          {/* ===== Conteúdo principal (centralizado verticalmente) ===== */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4">
            {/* 1. Logo vetorial (raio + pneu) — NÃO é PNG */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mb-2"
            >
              <MeuCorreLogo size={80} />
            </motion.div>

            {/* 2. Nome do app */}
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-center text-3xl font-black tracking-tight md:text-4xl"
            >
              <span className="text-white">Meu</span>
              <span className="text-emerald-400" style={{ textShadow: "0 0 20px rgba(16, 185, 129, 0.5)" }}>Corre</span>
            </motion.h1>

            {/* 3. Slogan */}
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-1 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400/80 md:text-xs"
            >
              Finanças para quem move o Brasil
            </motion.p>

            {/* 4. Barra de progresso com pneu na ponta */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="mt-8 w-full max-w-xs"
            >
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-900 border border-emerald-500/20">
                <motion.div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(to right, #059669, #10b981, #34d399)",
                    boxShadow: "0 0 10px rgba(16, 185, 129, 0.6)",
                  }}
                  transition={{ duration: 0.1 }}
                >
                  {/* Brilho na ponta */}
                  <div className="absolute right-0 top-0 h-full w-6 rounded-full bg-white/40 blur-sm" />
                </motion.div>

                {/* Pneu realista na ponta direita da barra */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 z-10"
                  style={{ left: `calc(${progress}% - 14px)` }}
                  transition={{ duration: 0.1 }}
                >
                  <TireIcon />
                </motion.div>
              </div>

              {/* 5. Porcentagem GRANDE BRANCA ABAIXO da barra */}
              <div className="mt-2 text-center">
                <span className="text-2xl font-black text-white md:text-3xl">
                  {progress}%
                </span>
              </div>
            </motion.div>

            {/* 6. Container ÚNICO com 4 cards lado a lado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: progress > 50 ? 1 : 0, y: progress > 50 ? 0 : 20 }}
              transition={{ duration: 0.5 }}
              className="mt-6 w-full max-w-md"
            >
              <div className="grid grid-cols-4 gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                {[
                  { icon: Wallet, text: "CONTROLE SUAS FINANÇAS" },
                  { icon: TrendingUp, text: "AUMENTE SEU LUCRO" },
                  { icon: ShieldCheck, text: "SEGURANÇA E CONFIANÇA" },
                  { icon: Clock, text: "MAIS TEMPO PARA VOCÊ" },
                ].map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: progress > 50 ? 1 : 0.8, opacity: progress > 50 ? 1 : 0 }}
                      transition={{ duration: 0.3, delay: 0.1 + i * 0.1 }}
                      className="flex flex-col items-center gap-1.5 text-center"
                    >
                      <Icon className="h-5 w-5 text-emerald-400 md:h-6 md:w-6" />
                      <span className="text-[7px] font-bold uppercase leading-tight tracking-wider text-zinc-300 md:text-[8px]">
                        {card.text}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* 7. Motociclista de costas com caixa de entrega na estrada */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative z-10 flex justify-center pb-6"
          >
            <MotorcycleRider />
          </motion.div>

          {/* Banner patrocinado (children) */}
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ===== Logo vetorial MeuCorre (raio + pneu) =====
function MeuCorreLogo({ size = 80 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      style={{ filter: "drop-shadow(0 0 15px rgba(16, 185, 129, 0.4))" }}
    >
      {/* Linhas de velocidade à esquerda */}
      <line x1="5" y1="30" x2="18" y2="30" stroke="#10b981" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="8" y1="40" x2="20" y2="40" stroke="#10b981" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <line x1="5" y1="50" x2="16" y2="50" stroke="#10b981" strokeWidth="2" strokeLinecap="round" opacity="0.3" />

      {/* Raio (lightning bolt) */}
      <path
        d="M30 15 L42 40 L35 42 L48 65 L28 48 L35 46 L25 25 Z"
        fill="#10b981"
        stroke="#34d399"
        strokeWidth="1"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))" }}
      />

      {/* Pneu (à direita, em arco/círculo) */}
      <circle cx="62" cy="50" r="28" fill="none" stroke="#10b981" strokeWidth="4" opacity="0.3" />
      <circle cx="62" cy="50" r="24" fill="none" stroke="#10b981" strokeWidth="6" opacity="0.8" />
      <circle cx="62" cy="50" r="18" fill="#0a0a0a" stroke="#333" strokeWidth="1" />
      <circle cx="62" cy="50" r="6" fill="#555" />
      <circle cx="62" cy="50" r="3" fill="#333" />

      {/* Raios do pneu */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <line
            key={angle}
            x1={62 + Math.cos(rad) * 7}
            y1={50 + Math.sin(rad) * 7}
            x2={62 + Math.cos(rad) * 17}
            y2={50 + Math.sin(rad) * 17}
            stroke="#444"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        );
      })}

      {/* Brilho no pneu */}
      <circle cx="62" cy="50" r="28" fill="none" stroke="#10b981" strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
}

// ===== Pneu realista (na ponta da barra de progresso) =====
function TireIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="drop-shadow-lg">
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
        return (
          <line
            key={angle}
            x1={14 + Math.cos(rad) * 3.5}
            y1={14 + Math.sin(rad) * 3.5}
            x2={14 + Math.cos(rad) * 8.5}
            y2={14 + Math.sin(rad) * 8.5}
            stroke="#555"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        );
      })}
      <circle cx="14" cy="14" r="13" fill="none" stroke="#10b981" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
}

// ===== Nota de dólar (SVG) =====
function DollarNote({ size = 16 }: { size?: number }) {
  return (
    <svg width={size * 1.4} height={size} viewBox="0 0 20 14" fill="none">
      <rect x="0.5" y="0.5" width="19" height="13" rx="1.5" fill="#10b981" opacity="0.6" />
      <rect x="0.5" y="0.5" width="19" height="13" rx="1.5" stroke="#10b981" strokeWidth="0.5" opacity="0.8" />
      <circle cx="10" cy="7" r="3.5" fill="none" stroke="#fff" strokeWidth="0.6" opacity="0.5" />
      <text x="10" y="9.5" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#fff" opacity="0.7">$</text>
    </svg>
  );
}

// ===== Skyline de cidade ao fundo =====
function CitySkyline() {
  return (
    <svg
      className="absolute bottom-0 left-0 right-0 w-full opacity-20"
      height="150"
      viewBox="0 0 1200 150"
      preserveAspectRatio="xMidYMax slice"
      fill="none"
    >
      {/* Prédios (skyline) */}
      <g fill="#10b981" opacity="0.3">
        <rect x="0" y="60" width="60" height="90" />
        <rect x="65" y="40" width="80" height="110" />
        <rect x="150" y="70" width="50" height="80" />
        <rect x="205" y="30" width="70" height="120" />
        <rect x="280" y="55" width="90" height="95" />
        <rect x="375" y="20" width="60" height="130" />
        <rect x="440" y="50" width="100" height="100" />
        <rect x="545" y="35" width="70" height="115" />
        <rect x="620" y="60" width="80" height="90" />
        <rect x="705" y="25" width="60" height="125" />
        <rect x="770" y="45" width="90" height="105" />
        <rect x="865" y="55" width="70" height="95" />
        <rect x="940" y="30" width="80" height="120" />
        <rect x="1025" y="50" width="60" height="100" />
        <rect x="1090" y="40" width="110" height="110" />
      </g>
      {/* Janelas (pontos de luz) */}
      <g fill="#10b981" opacity="0.5">
        {Array.from({ length: 40 }).map((_, i) => (
          <rect
            key={i}
            x={20 + Math.random() * 1160}
            y={30 + Math.random() * 100}
            width="2"
            height="2"
          />
        ))}
      </g>
    </svg>
  );
}

// ===== Motociclista de costas com caixa de entrega =====
function MotorcycleRider() {
  return (
    <svg width="180" height="80" viewBox="0 0 180 80" fill="none">
      {/* Estrada sob a moto */}
      <ellipse cx="90" cy="75" rx="70" ry="5" fill="#10b981" opacity="0.15" />

      {/* Motociclista de costas (silhueta) */}
      {/* Corpo */}
      <path
        d="M70 35 Q68 25 75 20 Q85 15 95 20 Q102 25 100 35 L98 50 L72 50 Z"
        fill="#10b981"
        opacity="0.5"
      />
      {/* Capacete */}
      <ellipse cx="85" cy="18" rx="10" ry="8" fill="#10b981" opacity="0.6" />
      <ellipse cx="85" cy="16" rx="8" ry="6" fill="#0a0a0a" opacity="0.5" />
      {/* Caixa de entrega (nas costas) */}
      <rect x="68" y="22" width="18" height="16" rx="2" fill="#10b981" opacity="0.25" stroke="#10b981" strokeWidth="1.5" />

      {/* Moto (vista por trás) */}
      {/* Corpo/tanque */}
      <path
        d="M55 50 L60 40 L120 40 L125 50 L125 60 L55 60 Z"
        fill="#10b981"
        opacity="0.3"
        stroke="#10b981"
        strokeWidth="1.5"
      />
      {/* Baú/caixa atrás */}
      <rect x="115" y="35" width="20" height="20" rx="2" fill="#10b981" opacity="0.2" stroke="#10b981" strokeWidth="1.5" />
      {/* Lanterna traseira */}
      <circle cx="135" cy="48" r="2" fill="#ef4444" opacity="0.8" />

      {/* Roda traseira */}
      <circle cx="130" cy="65" r="12" stroke="#10b981" strokeWidth="2.5" fill="none" opacity="0.5" />
      <circle cx="130" cy="65" r="3" fill="#10b981" opacity="0.5" />
      {/* Raios roda traseira */}
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <line key={`rr${angle}`} x1={130 + Math.cos(rad) * 3} y1={65 + Math.sin(rad) * 3} x2={130 + Math.cos(rad) * 10} y2={65 + Math.sin(rad) * 10} stroke="#10b981" strokeWidth="0.8" opacity="0.3" />
        );
      })}

      {/* Roda dianteira */}
      <circle cx="50" cy="65" r="12" stroke="#10b981" strokeWidth="2.5" fill="none" opacity="0.5" />
      <circle cx="50" cy="65" r="3" fill="#10b981" opacity="0.5" />
      {/* Raios roda dianteira */}
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <line key={`fr${angle}`} x1={50 + Math.cos(rad) * 3} y1={65 + Math.sin(rad) * 3} x2={50 + Math.cos(rad) * 10} y2={65 + Math.sin(rad) * 10} stroke="#10b981" strokeWidth="0.8" opacity="0.3" />
        );
      })}

      {/* Linhas de velocidade atrás da moto */}
      <line x1="10" y1="45" x2="35" y2="45" stroke="#10b981" strokeWidth="1" opacity="0.3" />
      <line x1="5" y1="55" x2="30" y2="55" stroke="#10b981" strokeWidth="1" opacity="0.2" />
      <line x1="15" y1="65" x2="32" y2="65" stroke="#10b981" strokeWidth="1" opacity="0.25" />
    </svg>
  );
}
