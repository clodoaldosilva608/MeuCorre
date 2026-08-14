"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ===== AppLoadingLogo — Splash screen com VÍDEO REAL =====
//
// Usa o vídeo original enviado pelo usuário como splash screen.
// O vídeo roda sobreposto na tela de carregamento.
// Duração sincronizada com o vídeo (~10s).
//
// O vídeo mostra:
// - Logo MeuCorre (raio + pneu)
// - Slogan "FINANÇAS PARA QUEM MOVE O BRASIL"
// - Barra de progresso com pneu + notas de dinheiro
// - 4 cards de funcionalidades
// - Motociclista com caixa de entrega
// - Skyline de cidade ao fundo

interface AppLoadingLogoProps {
  duration?: number;
  visible?: boolean;
  children?: React.ReactNode;
  onComplete?: () => void;
}

export function AppLoadingLogo({
  duration = 10000,
  visible = true,
  children,
  onComplete,
}: AppLoadingLogoProps) {
  const [internalShow, setInternalShow] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!visible) {
      setInternalShow(false);
      return;
    }

    // Tenta tocar o vídeo imediatamente
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay pode ser bloqueado — tenta com muted
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      });
    }

    const t = setTimeout(() => {
      setInternalShow(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(t);
  }, [visible, duration, onComplete]);

  // ESC para cancelar (acessibilidade)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInternalShow(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const shouldShow = visible && internalShow;
  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black"
          role="status"
          aria-live="polite"
          aria-label="Carregando MeuCorre"
        >
          {/* VÍDEO REAL do splash screen — ocupa toda a tela */}
          <video
            ref={videoRef}
            src="/splash-video-optimized.mp4"
            autoPlay
            muted
            playsInline
            loop={false}
            className="absolute inset-0 h-full w-full object-cover"
            onEnded={() => {
              setInternalShow(false);
              onComplete?.();
            }}
            onError={() => {
              // Se o vídeo falhar, esconde o splash após 2s
              setTimeout(() => setInternalShow(false), 2000);
            }}
          />

          {/* Banner patrocinado (children) — sobre o vídeo */}
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
