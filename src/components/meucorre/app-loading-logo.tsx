"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, TrendingUp, ShieldCheck, Clock } from "lucide-react";

// ===== AppLoadingLogo — Splash screen idêntico ao vídeo =====
//
// Usa a LOGO OFICIAL (public/logo-meucorre.png) que já tem raio + pneu.
// Layout EXATO do vídeo:
// 1. Logo OFICIAL grande (raio + pneu) — topo
// 2. "MeuCorre" (branco + verde, bold, glow)
// 3. "FINANÇAS PARA QUEM MOVE O BRASIL" (verde neon, uppercase)
// 4. Barra de progresso 3D tubular com pneu realista na ponta + notas voando
// 5. Porcentagem GRANDE BRANCA abaixo da barra
// 6. Container único com 4 cards (borda verde neon, ícones grandes)
// 7. Motociclista de costas com caixa de entrega + estrada neon + skyline

interface AppLoadingLogoProps {
  duration?: number;
  visible?: boolean;
  children?: React.ReactNode;
  onComplete?: () => void;
}

const CARDS = [
  { icon: Wallet, title: "CONTROLE SUAS\nFINANÇAS" },
  { icon: TrendingUp, title: "AUMENTE SEU\nLUCRO" },
  { icon: ShieldCheck, title: "SEGURANÇA E\nCONFIANÇA" },
  { icon: Clock, title: "MAIS TEMPO\nPARA VOCÊ" },
];

export function AppLoadingLogo({
  duration = 3000,
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
        }, 200);
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
  // Cards aparecem após 20% (no vídeo aparecem cedo)
  const showCards = progress >= 20;

  if (!shouldShow) return null;

  // Notas de dinheiro — grandes, reconhecíveis, caindo ao redor da barra
  const moneyNotes = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: 5 + Math.random() * 90,
    delay: Math.random() * 2,
    duration: 1.5 + Math.random() * 1.5,
    size: 14 + Math.random() * 10,
    rotate: Math.random() * 360,
  }));

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center overflow-hidden bg-black"
          role="status"
          aria-live="polite"
          aria-label="Carregando MeuCorre"
        >
          {/* ===== FUNDO: glow + skyline + estrada ===== */}
          <div className="pointer-events-none absolute inset-0">
            {/* Glow central forte */}
            <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/15 blur-[120px]" />
            {/* Glow inferior */}
            <div className="absolute bottom-0 left-1/2 h-80 w-[700px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[80px]" />

            {/* Skyline de cidade ao fundo */}
            <CitySkyline />

            {/* Estrada com linhas de neon em perspectiva */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-[2px] bg-emerald-400/50"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    width: `${40 + Math.random() * 100}px`,
                    bottom: `${Math.random() * 100}%`,
                  }}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: [0, 1, 0], scaleX: [0, 1, 1] }}
                  transition={{
                    duration: 0.5 + Math.random(),
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
          </div>

          {/* ===== NOTAS DE DINHEIRO VOANDO ===== */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {moneyNotes.map((note) => (
              <motion.div
                key={note.id}
                className="absolute"
                style={{ left: `${note.x}%`, top: "35%" }}
                initial={{ y: 80, opacity: 0, rotate: note.rotate }}
                animate={{ y: [80, -200], opacity: [0, 0.8, 0], rotate: note.rotate + 360 }}
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

          {/* ===== CONTEÚDO PRINCIPAL ===== */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pt-8">
            {/* 1. LOGO OFICIAL (PNG) — grande, com glow */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mb-3"
              style={{ filter: "drop-shadow(0 0 25px rgba(16, 185, 129, 0.5))" }}
            >
              <img
                src="/logo-meucorre.png"
                alt="MeuCorre"
                className="h-36 w-36 rounded-3xl md:h-44 md:w-44"
              />
            </motion.div>

            {/* 2. NOME DO APP — bold, grande, com glow */}
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-center text-4xl font-black tracking-tight md:text-5xl"
            >
              <span className="text-white">Meu</span>
              <span
                className="text-emerald-400"
                style={{ textShadow: "0 0 30px rgba(16, 185, 129, 0.8), 0 0 10px rgba(16, 185, 129, 0.5)" }}
              >
                Corre
              </span>
            </motion.h1>

            {/* 3. SLOGAN */}
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-2 text-center text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/90 md:text-sm"
              style={{ textShadow: "0 0 10px rgba(16, 185, 129, 0.4)" }}
            >
              Finanças para quem move o Brasil
            </motion.p>

            {/* 4. BARRA DE PROGRESSO 3D TUBULAR com pneu na ponta */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="mt-6 w-full max-w-sm"
            >
              {/* Barra tubular 3D */}
              <div
                className="relative h-4 w-full overflow-hidden rounded-full border border-emerald-500/30 bg-zinc-900"
                style={{ boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5), 0 0 15px rgba(16, 185, 129, 0.2)" }}
              >
                <motion.div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(to right, #047857, #10b981, #34d399, #6ee7b7)",
                    boxShadow: "0 0 20px rgba(16, 185, 129, 0.8), inset 0 1px 2px rgba(255,255,255,0.3)",
                  }}
                  transition={{ duration: 0.1 }}
                >
                  {/* Brilho na ponta direita */}
                  <div className="absolute right-0 top-0 h-full w-8 rounded-full bg-white/50 blur-sm" />
                </motion.div>

                {/* Pneu realista na ponta direita da barra */}
                <motion.div
                  className="absolute top-1/2 z-10 -translate-y-1/2"
                  style={{ left: `calc(${progress}% - 16px)` }}
                  transition={{ duration: 0.1 }}
                >
                  <TireIcon size={32} />
                </motion.div>
              </div>

              {/* 5. PORCENTAGEM GRANDE BRANCA ABAIXO da barra */}
              <div className="mt-3 text-center">
                <span
                  className="text-3xl font-black text-white md:text-4xl"
                  style={{ textShadow: "0 0 20px rgba(255, 255, 255, 0.3)" }}
                >
                  {progress}%
                </span>
              </div>
            </motion.div>

            {/* 6. CONTAINER ÚNICO com 4 CARDS — borda verde neon, ícones grandes */}
            <AnimatePresence>
              {showCards && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.5 }}
                  className="mt-6 w-full max-w-lg"
                >
                  <div
                    className="grid grid-cols-4 gap-3 rounded-2xl border-2 p-4"
                    style={{
                      borderColor: "rgba(16, 185, 129, 0.4)",
                      backgroundColor: "rgba(16, 185, 129, 0.05)",
                      boxShadow: "0 0 30px rgba(16, 185, 129, 0.15)",
                    }}
                  >
                    {CARDS.map((card, i) => {
                      const Icon = card.icon;
                      return (
                        <motion.div
                          key={i}
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.1 + i * 0.1 }}
                          className="flex flex-col items-center gap-2 text-center"
                        >
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 md:h-12 md:w-12">
                            <Icon className="h-6 w-6 text-emerald-400 md:h-7 md:w-7" style={{ filter: "drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))" }} />
                          </div>
                          <span className="whitespace-pre-line text-[8px] font-bold uppercase leading-tight tracking-wider text-zinc-200 md:text-[9px]">
                            {card.title}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 7. MOTOCICLISTA DE COSTAS com caixa de entrega */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
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

// ===== Pneu realista (SVG) — maior, mais detalhado =====
function TireIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className="drop-shadow-lg">
      {/* Pneu externo (borracha preta) */}
      <circle cx="16" cy="16" r="15" fill="#1a1a1a" stroke="#0a0a0a" strokeWidth="1" />
      {/* Banda de rodagem (sulcos) */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <line
            key={angle}
            x1={16 + Math.cos(rad) * 12}
            y1={16 + Math.sin(rad) * 12}
            x2={16 + Math.cos(rad) * 14}
            y2={16 + Math.sin(rad) * 14}
            stroke="#333"
            strokeWidth="1.5"
          />
        );
      })}
      {/* Aro metálico */}
      <circle cx="16" cy="16" r="10" fill="#0a0a0a" stroke="#444" strokeWidth="1.5" />
      {/* Centro (hub) */}
      <circle cx="16" cy="16" r="3.5" fill="#555" />
      <circle cx="16" cy="16" r="2" fill="#333" />
      {/* Raios (5) */}
      {[0, 72, 144, 216, 288].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <line
            key={angle}
            x1={16 + Math.cos(rad) * 4}
            y1={16 + Math.sin(rad) * 4}
            x2={16 + Math.cos(rad) * 9.5}
            y2={16 + Math.sin(rad) * 9.5}
            stroke="#555"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        );
      })}
      {/* Brilho verde no pneu */}
      <circle cx="16" cy="16" r="15" fill="none" stroke="#10b981" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

// ===== Nota de dólar (SVG) — maior, mais reconhecível =====
function DollarNote({ size = 18 }: { size?: number }) {
  return (
    <svg width={size * 1.5} height={size} viewBox="0 0 24 16" fill="none">
      {/* Borda da cédula */}
      <rect x="0.5" y="0.5" width="23" height="15" rx="2" fill="#10b981" opacity="0.7" stroke="#34d399" strokeWidth="1" />
      {/* Padrão interno */}
      <rect x="2" y="2" width="20" height="12" rx="1" fill="none" stroke="#fff" strokeWidth="0.4" opacity="0.3" />
      {/* Círculo central */}
      <circle cx="12" cy="8" r="4" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.6" />
      {/* Símbolo $ */}
      <text x="12" y="11" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#fff" opacity="0.9">$</text>
      {/* Cantos decorativos */}
      <text x="3" y="5" fontSize="3" fill="#fff" opacity="0.4">$</text>
      <text x="20" y="14" fontSize="3" fill="#fff" opacity="0.4">$</text>
    </svg>
  );
}

// ===== Skyline de cidade ao fundo (mais detalhado) =====
function CitySkyline() {
  return (
    <svg
      className="absolute bottom-0 left-0 right-0 w-full opacity-25"
      height="200"
      viewBox="0 0 1200 200"
      preserveAspectRatio="xMidYMax slice"
      fill="none"
    >
      {/* Prédios (skyline) — mais variado */}
      <g fill="#10b981" opacity="0.4">
        <rect x="0" y="80" width="50" height="120" />
        <rect x="55" y="50" width="70" height="150" />
        <rect x="130" y="90" width="40" height="110" />
        <rect x="175" y="35" width="80" height="165" />
        <rect x="260" y="65" width="60" height="135" />
        <rect x="325" y="20" width="50" height="180" />
        <rect x="380" y="55" width="90" height="145" />
        <rect x="475" y="40" width="60" height="160" />
        <rect x="540" y="70" width="70" height="130" />
        <rect x="615" y="25" width="55" height="175" />
        <rect x="675" y="50" width="85" height="150" />
        <rect x="765" y="60" width="50" height="140" />
        <rect x="820" y="30" width="75" height="170" />
        <rect x="900" y="55" width="65" height="145" />
        <rect x="970" y="40" width="90" height="160" />
        <rect x="1065" y="65" width="55" height="135" />
        <rect x="1125" y="45" width="75" height="155" />
      </g>
      {/* Janelas (pontos de luz) */}
      <g fill="#10b981" opacity="0.6">
        {Array.from({ length: 60 }).map((_, i) => (
          <rect
            key={i}
            x={10 + Math.random() * 1180}
            y={30 + Math.random() * 150}
            width="2"
            height="3"
          />
        ))}
      </g>
    </svg>
  );
}

// ===== Motociclista de costas com caixa de entrega (maior, mais detalhado) =====
function MotorcycleRider() {
  return (
    <svg width="220" height="100" viewBox="0 0 220 100" fill="none">
      {/* Rastro de luz sob a moto */}
      <ellipse cx="110" cy="92" rx="90" ry="6" fill="#10b981" opacity="0.2" />
      <ellipse cx="110" cy="92" rx="60" ry="3" fill="#10b981" opacity="0.3" />

      {/* Linhas de velocidade atrás da moto */}
      <line x1="5" y1="50" x2="40" y2="50" stroke="#10b981" strokeWidth="2" opacity="0.4" />
      <line x1="0" y1="62" x2="35" y2="62" stroke="#10b981" strokeWidth="2" opacity="0.3" />
      <line x1="10" y1="74" x2="38" y2="74" stroke="#10b981" strokeWidth="2" opacity="0.35" />
      <line x1="3" y1="38" x2="30" y2="38" stroke="#10b981" strokeWidth="1.5" opacity="0.25" />

      {/* Motociclista de costas */}
      {/* Capacete */}
      <ellipse cx="100" cy="22" rx="13" ry="11" fill="#10b981" opacity="0.6" />
      <ellipse cx="100" cy="20" rx="10" ry="8" fill="#0a0a0a" opacity="0.6" />
      {/* Reflexo no capacete */}
      <ellipse cx="96" cy="17" rx="3" ry="2" fill="#fff" opacity="0.2" />

      {/* Corpo (tronco) */}
      <path
        d="M82 35 Q78 28 88 24 Q100 20 112 24 Q122 28 118 35 L115 55 L85 55 Z"
        fill="#10b981"
        opacity="0.5"
      />

      {/* Caixa de entrega nas costas (grande, visível) */}
      <rect x="78" y="28" width="22" height="20" rx="3" fill="#10b981" opacity="0.3" stroke="#10b981" strokeWidth="2" />
      <line x1="89" y1="28" x2="89" y2="48" stroke="#10b981" strokeWidth="1" opacity="0.4" />
      <line x1="78" y1="38" x2="100" y2="38" stroke="#10b981" strokeWidth="1" opacity="0.4" />

      {/* Braços (segurando guidão) */}
      <path d="M85 40 L72 55" stroke="#10b981" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <path d="M115 40 L128 55" stroke="#10b981" strokeWidth="3" strokeLinecap="round" opacity="0.5" />

      {/* Moto (vista por trás) */}
      {/* Corpo/tanque */}
      <path
        d="M60 60 L65 50 L155 50 L160 60 L160 75 L60 75 Z"
        fill="#10b981"
        opacity="0.3"
        stroke="#10b981"
        strokeWidth="2"
      />
      {/* Baú traseiro */}
      <rect x="148" y="42" width="25" height="25" rx="3" fill="#10b981" opacity="0.2" stroke="#10b981" strokeWidth="2" />
      {/* Lanterna traseira vermelha */}
      <circle cx="170" cy="58" r="3" fill="#ef4444" opacity="0.9" />
      <circle cx="170" cy="58" r="5" fill="#ef4444" opacity="0.3" />

      {/* Roda traseira (grande, com raios) */}
      <circle cx="160" cy="80" r="15" stroke="#10b981" strokeWidth="3" fill="none" opacity="0.5" />
      <circle cx="160" cy="80" r="4" fill="#10b981" opacity="0.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <line key={`rr${angle}`} x1={160 + Math.cos(rad) * 4} y1={80 + Math.sin(rad) * 4} x2={160 + Math.cos(rad) * 13} y2={80 + Math.sin(rad) * 13} stroke="#10b981" strokeWidth="1" opacity="0.3" />
        );
      })}

      {/* Roda dianteira (grande, com raios) */}
      <circle cx="62" cy="80" r="15" stroke="#10b981" strokeWidth="3" fill="none" opacity="0.5" />
      <circle cx="62" cy="80" r="4" fill="#10b981" opacity="0.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <line key={`fr${angle}`} x1={62 + Math.cos(rad) * 4} y1={80 + Math.sin(rad) * 4} x2={62 + Math.cos(rad) * 13} y2={80 + Math.sin(rad) * 13} stroke="#10b981" strokeWidth="1" opacity="0.3" />
        );
      })}
    </svg>
  );
}
