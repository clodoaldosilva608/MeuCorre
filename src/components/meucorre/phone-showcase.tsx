"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ===== iPhone Showcase com Carousel Animado =====
//
// Mostra um mockup de iPhone com screenshots do dashboard do MeuCorre
// rotacionando automaticamente a cada 3.5 segundos.
// Usuário pode navegar manualmente via dots ou swipe.

interface Slide {
  src: string;
  title: string;
  desc: string;
}

const SLIDES: Slide[] = [
  {
    src: "/screenshots/07-dashboard-corridas.png",
    title: "Corridas",
    desc: "5 corridas de iFood, 99Food, Lalamove e Rappi — total, lucro líquido e km",
  },
  {
    src: "/screenshots/08-dashboard-despesas.png",
    title: "Despesas",
    desc: "Gasolina, alimentação, manutenção — cada real gasto registrado",
  },
  {
    src: "/screenshots/09-dashboard-graficos.png",
    title: "Gráficos",
    desc: "Veja pra onde seu dinheiro vai: por app, por dia, por categoria",
  },
  {
    src: "/screenshots/13-dashboard-ofertas.png",
    title: "Ofertas",
    desc: "Descontos exclusivos em produtos para entregadores",
  },
];

const AUTOPLAY_MS = 3500;

export function PhoneShowcase() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % SLIDES.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // Autoplay
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [next, isPaused]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* iPhone Mockup */}
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Glowing aura behind phone */}
        <div className="pointer-events-none absolute inset-0 -z-10 scale-110 rounded-[3rem] bg-neon/10 blur-3xl" />

        {/* Phone frame */}
        <div className="relative mx-auto w-[280px] rounded-[2.5rem] border-[10px] border-zinc-800 bg-zinc-950 shadow-2xl shadow-neon/10 sm:w-[320px]">
          {/* Notch */}
          <div className="absolute left-1/2 top-0 z-20 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-zinc-800" />

          {/* Screen */}
          <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.8rem] bg-zinc-950">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0"
              >
                { }
                <img
                  src={SLIDES[current].src}
                  alt={SLIDES[current].title}
                  className="h-full w-full object-cover object-top"
                />
              </motion.div>
            </AnimatePresence>

            {/* Status bar overlay */}
            <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 pt-2 text-[8px] font-semibold text-white">
              <span>{new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Side buttons (decorative) */}
        <div className="absolute -left-[10px] top-24 h-12 w-[3px] rounded-l bg-zinc-700" />
        <div className="absolute -left-[10px] top-40 h-16 w-[3px] rounded-l bg-zinc-700" />
        <div className="absolute -right-[10px] top-32 h-20 w-[3px] rounded-r bg-zinc-700" />
      </div>

      {/* Caption + dots */}
      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm font-bold text-neon">
              {SLIDES[current].title}
            </p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-zinc-400">
              {SLIDES[current].desc}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="mt-4 flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${
                i === current
                  ? "w-6 bg-neon"
                  : "w-2 bg-zinc-700 hover:bg-zinc-600"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Nav arrows (desktop only) */}
      <div className="hidden gap-3 sm:flex">
        <button
          onClick={prev}
          className="grid h-9 w-9 place-items-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 transition-all hover:border-neon hover:text-neon"
          aria-label="Anterior"
        >
          ←
        </button>
        <button
          onClick={next}
          className="grid h-9 w-9 place-items-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 transition-all hover:border-neon hover:text-neon"
          aria-label="Próximo"
        >
          →
        </button>
      </div>
    </div>
  );
}
