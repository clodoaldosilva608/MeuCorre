"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ===== iPhone 3D Showcase com Demo Interativa =====
//
// O /app é carregado via iframe com width=375px (mobile padrão)
// e escalado via transform: scale() para caber na tela do mockup.
// Dados de demonstração são pré-populados no IndexedDB pelo /app?demo=1.

const DEMO_STEPS = [
  { tab: "corridas", title: "Corridas", desc: "5 corridas de iFood, 99Food, Lalamove e Rappi — total, lucro líquido e km rodado" },
  { tab: "despesas", title: "Despesas", desc: "Gasolina, alimentação, manutenção — cada real gasto registrado" },
  { tab: "graficos", title: "Gráficos", desc: "Veja pra onde seu dinheiro vai: por app, por dia, por categoria" },
  { tab: "ofertas", title: "Ofertas", desc: "Descontos exclusivos em produtos selecionados para entregadores" },
];

const AUTOPLAY_MS = 6000;

// Dimensões do iPhone — responsivo
const PHONE_W_DESKTOP = 290;
const PHONE_H_DESKTOP = 580;
const PHONE_W_MOBILE = 240;
const PHONE_H_MOBILE = 480;
const BORDER = 8;

// O /app é desenhado para 375px (mobile). Escala para caber na tela.
const APP_VIRTUAL_WIDTH = 375;
const APP_VIRTUAL_HEIGHT = 740;

export function PhoneShowcase() {
  const [mode, setMode] = useState<"demo" | "interactive">("demo");
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Detecta mobile para ajustar tamanho do iPhone
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const PHONE_W = isMobile ? PHONE_W_MOBILE : PHONE_W_DESKTOP;
  const PHONE_H = isMobile ? PHONE_H_MOBILE : PHONE_H_DESKTOP;
  const SCREEN_W = PHONE_W - BORDER * 2;
  const SCREEN_H = PHONE_H - BORDER * 2;
  const SCALE = SCREEN_W / APP_VIRTUAL_WIDTH;
  const TOP_OFFSET = isMobile ? 20 : 28;

  const nextStep = useCallback(() => {
    setCurrentStep((s) => (s + 1) % DEMO_STEPS.length);
  }, []);

  useEffect(() => {
    if (mode !== "demo" || isPaused) return;
    const timer = setInterval(nextStep, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [nextStep, mode, isPaused]);

  useEffect(() => {
    if (mode !== "demo" || !iframeLoaded) return;
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    try {
      iframe.contentWindow.postMessage(
        { type: "meucorre-demo-tab", tab: DEMO_STEPS[currentStep].tab },
        window.location.origin,
      );
    } catch {}
  }, [currentStep, mode, iframeLoaded]);

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6">
      {/* Botões de modo */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("demo")}
          className={`rounded-full px-3 py-1.5 text-[10px] font-bold transition-all sm:px-4 sm:text-xs ${
            mode === "demo"
              ? "bg-neon text-zinc-950"
              : "border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          ▶ Demo
        </button>
        <button
          onClick={() => setMode("interactive")}
          className={`rounded-full px-3 py-1.5 text-[10px] font-bold transition-all sm:px-4 sm:text-xs ${
            mode === "interactive"
              ? "bg-neon text-zinc-950"
              : "border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          👆 Interativo
        </button>
      </div>

      {/* Container do iPhone */}
      <div
        style={{ perspective: isMobile ? "800px" : "1000px" }}
        onMouseEnter={() => mode === "demo" && setIsPaused(true)}
        onMouseLeave={() => mode === "demo" && setIsPaused(false)}
      >
        {/* Aura neon */}
        <div
          className="pointer-events-none absolute -z-10 rounded-[3rem] bg-neon/15 blur-3xl"
          style={{ width: PHONE_W + 60, height: PHONE_H + 60, left: -30, top: -30 }}
        />

        {/* Phone com rotação 3D — desativada no mobile para permitir cliques */}
        <motion.div
          style={{
            width: PHONE_W,
            height: PHONE_H,
            transformStyle: "preserve-3d",
            // No mobile, sem rotação 3D para garantir que cliques funcionem
            transform: isMobile ? "none" : "rotateY(-5deg) rotateX(2deg)",
          }}
          whileHover={isMobile ? undefined : {
            rotateY: 0,
            rotateX: 0,
            transition: { duration: 0.4 },
          }}
        >
          {/* Frame do telefone */}
          <div
            className="relative rounded-[2rem] sm:rounded-[2.5rem] bg-zinc-950"
            style={{
              width: PHONE_W,
              height: PHONE_H,
              border: `${BORDER}px solid #3f3f46`,
              boxShadow: "0 25px 60px -15px rgba(0,0,0,0.8), 0 0 30px rgba(57,255,20,0.1)",
            }}
          >
            {/* Reflexo metálico */}
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem] ring-1 ring-inset ring-white/5" />

            {/* Dynamic Island */}
            <div className="absolute left-1/2 top-1.5 z-30 h-5 w-20 -translate-x-1/2 rounded-full bg-zinc-900 ring-1 ring-zinc-800 sm:h-6 sm:w-24">
              <div className="absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-zinc-700" />
            </div>

            {/* Tela */}
            <div
              className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[1.8rem] bg-zinc-950"
              style={{ width: SCREEN_W, height: SCREEN_H, margin: "0 auto" }}
            >
              {/* Loading */}
              {!iframeLoaded && (
                <div className="absolute inset-0 z-10 grid place-items-center bg-zinc-950">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-neon border-t-transparent sm:h-6 sm:w-6" />
                    <p className="text-[9px] text-zinc-500 sm:text-[10px]">Carregando app...</p>
                  </div>
                </div>
              )}

              {/* Iframe escalado — scrolling=yes para permitir scroll vertical */}
              <iframe
                ref={iframeRef}
                src="/app?demo=1"
                style={{
                  border: "none",
                  width: APP_VIRTUAL_WIDTH,
                  height: APP_VIRTUAL_HEIGHT,
                  position: "absolute",
                  top: TOP_OFFSET,
                  left: 0,
                  transform: `scale(${SCALE})`,
                  transformOrigin: "top left",
                  overflow: "hidden",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  pointerEvents: "auto",
                }}
                title="MeuCorre Demo"
                loading="lazy"
                scrolling="yes"
                onLoad={() => setIframeLoaded(true)}
                sandbox="allow-scripts allow-same-origin allow-popups"
              />

              {/* Status bar overlay */}
              <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex h-5 items-center justify-between px-3 text-[7px] font-semibold text-white/40 sm:h-6">
                <span>
                  {new Date().toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span>100%</span>
              </div>

              {/* Badge de modo */}
              <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/50 px-2 py-0.5 text-[7px] font-bold uppercase tracking-wider backdrop-blur-sm">
                {mode === "demo" ? (
                  <span className="text-neon">● Demo</span>
                ) : (
                  <span className="text-neon">✋ Interativo</span>
                )}
              </div>
            </div>

            {/* Home indicator */}
            <div className="absolute bottom-1 left-1/2 z-30 h-0.5 w-16 -translate-x-1/2 rounded-full bg-zinc-600 sm:w-20" />
          </div>

          {/* Botões laterais (apenas desktop) */}
          {!isMobile && (
            <>
              <div className="absolute -left-[8px] top-24 h-8 w-[3px] rounded-l bg-zinc-600" />
              <div className="absolute -left-[8px] top-36 h-12 w-[3px] rounded-l bg-zinc-600" />
              <div className="absolute -left-[8px] top-52 h-12 w-[3px] rounded-l bg-zinc-600" />
              <div className="absolute -right-[8px] top-32 h-16 w-[3px] rounded-r bg-zinc-600" />
            </>
          )}
        </motion.div>
      </div>

      {/* Caption */}
      <div className="min-h-[40px] text-center sm:min-h-[50px]">
        {mode === "demo" ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs font-bold text-neon sm:text-sm">
                {DEMO_STEPS[currentStep].title}
              </p>
              <p className="mx-auto mt-1 max-w-xs text-[11px] text-zinc-400 sm:text-xs">
                {DEMO_STEPS[currentStep].desc}
              </p>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div>
            <p className="text-xs font-bold text-neon sm:text-sm">
              👆 App real, interativo
            </p>
            <p className="mx-auto mt-1 max-w-xs text-[11px] text-zinc-400 sm:text-xs">
              Toque nas abas, adicione corridas, explore o app de verdade
            </p>
          </div>
        )}

        {mode === "demo" && (
          <div className="mt-3 flex justify-center gap-2">
            {DEMO_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentStep ? "w-5 bg-neon" : "w-2 bg-zinc-700 hover:bg-zinc-600"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
