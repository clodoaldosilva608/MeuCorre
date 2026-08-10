"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ===== iPhone 3D Showcase com Demo Interativa =====
//
// Mostra um mockup de iPhone 3D realista com 2 modos:
//
// 1. MODO DEMO (automático): navega pelas abas do app automaticamente
//    a cada 6 segundos, simulando uso real.
//
// 2. MODO INTERATIVO: usuário clica em "Toque para experimentar" e o
//    iPhone carrega o /app real via iframe. O usuário pode interagir
//    com o app de verdade — adicionar corridas, ver gráficos, etc.
//
// O iframe carrega /app?demo=1 que suprime popups e já vem com dados
// de exemplo pré-carregados.

const DEMO_STEPS = [
  { tab: "corridas", title: "Corridas", desc: "5 corridas de iFood, 99Food, Lalamove e Rappi — total, lucro líquido e km rodado" },
  { tab: "despesas", title: "Despesas", desc: "Gasolina, alimentação, manutenção — cada real gasto registrado" },
  { tab: "graficos", title: "Gráficos", desc: "Veja pra onde seu dinheiro vai: por app, por dia, por categoria" },
  { tab: "ofertas", title: "Ofertas", desc: "Descontos exclusivos em produtos selecionados para entregadores" },
];

const AUTOPLAY_MS = 6000;

// Dimensões fixas do iPhone (não usa aspect-ratio que pode gerar 0 altura)
const PHONE_WIDTH = 280; // px (mobile)
const PHONE_WIDTH_DESKTOP = 320; // px (desktop)
const PHONE_HEIGHT = 580; // px — altura suficiente para mostrar o app
const SCREEN_HEIGHT = PHONE_HEIGHT - 24; // desconta bordas

export function PhoneShowcase() {
  const [mode, setMode] = useState<"demo" | "interactive">("demo");
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const nextStep = useCallback(() => {
    setCurrentStep((s) => (s + 1) % DEMO_STEPS.length);
  }, []);

  // Autoplay apenas no modo demo
  useEffect(() => {
    if (mode !== "demo" || isPaused) return;
    const timer = setInterval(nextStep, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [nextStep, mode, isPaused]);

  // No modo demo, envia mensagem para o iframe trocar de aba
  useEffect(() => {
    if (mode !== "demo" || !iframeLoaded) return;
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    try {
      iframe.contentWindow.postMessage(
        { type: "meucorre-demo-tab", tab: DEMO_STEPS[currentStep].tab },
        window.location.origin,
      );
    } catch {
      // iframe pode não estar pronto ainda
    }
  }, [currentStep, mode, iframeLoaded]);

  const handleMouseEnter = () => {
    if (mode === "demo") setIsPaused(true);
  };

  const handleMouseLeave = () => {
    if (mode === "demo") setIsPaused(false);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Badge de modo */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("demo")}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
            mode === "demo"
              ? "bg-neon text-zinc-950"
              : "border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          ▶ Demo automática
        </button>
        <button
          onClick={() => setMode("interactive")}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
            mode === "interactive"
              ? "bg-neon text-zinc-950"
              : "border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          👆 Toque para experimentar
        </button>
      </div>

      {/* iPhone 3D Mockup */}
      <div
        className="relative"
        style={{ perspective: "1200px" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Glowing aura behind phone */}
        <div className="pointer-events-none absolute inset-0 -z-10 scale-125 rounded-[3rem] bg-neon/15 blur-3xl" />

        {/* Phone container com rotação 3D sutil */}
        <motion.div
          className="relative mx-auto"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateY(-6deg) rotateX(2deg)",
            width: "100%",
            maxWidth: PHONE_WIDTH_DESKTOP,
          }}
          whileHover={{
            rotateY: 0,
            rotateX: 0,
            transition: { duration: 0.5, ease: "easeOut" },
          }}
        >
          {/* Phone frame — titânio escuro com bordas arredondadas */}
          <div
            className="relative mx-auto rounded-[2.5rem] border-[10px] border-zinc-700 bg-zinc-950"
            style={{
              width: "100%",
              maxWidth: PHONE_WIDTH,
              height: PHONE_HEIGHT,
              boxShadow:
                "0 25px 60px -15px rgba(0,0,0,0.8), 0 0 30px rgba(57,255,20,0.1), inset 0 0 2px rgba(255,255,255,0.1)",
            }}
          >
            {/* Reflexo metálico na borda */}
            <div className="pointer-events-none absolute inset-0 rounded-[2.5rem] ring-1 ring-inset ring-white/5" />

            {/* Dynamic Island (notch moderno) */}
            <div className="absolute left-1/2 top-2 z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-zinc-900 ring-1 ring-zinc-800">
              {/* Camera dot */}
              <div className="absolute right-2.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-zinc-700 ring-1 ring-zinc-600" />
            </div>

            {/* Screen — altura fixa para garantir renderização do iframe */}
            <div
              className="relative overflow-hidden rounded-[1.8rem] bg-zinc-950"
              style={{ height: SCREEN_HEIGHT, width: "100%" }}
            >
              {/* Loading placeholder enquanto iframe não carrega */}
              {!iframeLoaded && (
                <div className="absolute inset-0 z-10 grid place-items-center bg-zinc-950">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon border-t-transparent" />
                    <p className="text-[10px] text-zinc-500">Carregando app...</p>
                  </div>
                </div>
              )}

              {/* Iframe com o /app real — altura fixa em px */}
              <iframe
                ref={iframeRef}
                src="/app?demo=1"
                className="absolute inset-0"
                style={{
                  border: "none",
                  width: "100%",
                  height: "100%",
                  // Scale para ajustar o app desktop ao tamanho do celular
                  transformOrigin: "top left",
                }}
                title="MeuCorre Demo"
                onLoad={() => {
                  setIframeLoaded(true);
                  console.log("[PhoneShowcase] Iframe carregado");
                }}
                sandbox="allow-scripts allow-same-origin allow-popups"
              />

              {/* Overlay sutil no topo para simular status bar */}
              <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex h-7 items-center justify-between px-4 text-[8px] font-semibold text-white/70">
                <span>
                  {new Date().toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span>100%</span>
              </div>

              {/* Indicador de modo */}
              <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/50 px-2 py-0.5 text-[7px] font-bold uppercase tracking-wider backdrop-blur-sm">
                {mode === "demo" ? (
                  <span className="text-neon">● Demo</span>
                ) : (
                  <span className="text-neon">✋ Interativo</span>
                )}
              </div>
            </div>

            {/* Home indicator (barra inferior) */}
            <div className="absolute bottom-1 left-1/2 z-30 h-0.5 w-20 -translate-x-1/2 rounded-full bg-zinc-600" />
          </div>

          {/* Side buttons — volume + power (3D) */}
          <div className="absolute -left-[10px] top-24 h-8 w-[3px] rounded-l bg-zinc-600 shadow-md" />
          <div className="absolute -left-[10px] top-36 h-12 w-[3px] rounded-l bg-zinc-600 shadow-md" />
          <div className="absolute -left-[10px] top-52 h-12 w-[3px] rounded-l bg-zinc-600 shadow-md" />
          <div className="absolute -right-[10px] top-32 h-16 w-[3px] rounded-r bg-zinc-600 shadow-md" />
        </motion.div>
      </div>

      {/* Caption */}
      <div className="min-h-[50px] text-center">
        {mode === "demo" ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-sm font-bold text-neon">
                {DEMO_STEPS[currentStep].title}
              </p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-zinc-400">
                {DEMO_STEPS[currentStep].desc}
              </p>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div>
            <p className="text-sm font-bold text-neon">
              👆 App real, interativo
            </p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-zinc-400">
              Toque nas abas, adicione corridas, explore o app de verdade
            </p>
          </div>
        )}

        {/* Dots (apenas no modo demo) */}
        {mode === "demo" && (
          <div className="mt-3 flex justify-center gap-2">
            {DEMO_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentStep
                    ? "w-5 bg-neon"
                    : "w-2 bg-zinc-700 hover:bg-zinc-600"
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
