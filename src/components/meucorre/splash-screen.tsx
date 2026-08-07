"use client";

import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  visible: boolean;
}

// Splash com o mascote "Foguetinho" — foguete estilizado SVG.
// Some suavemente assim que o app carrega (< 2s idealmente).
export function SplashScreen({ visible }: SplashScreenProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950"
        >
          {/* Foguetinho */}
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <Foguetinho />
            </motion.div>

            {/* Rastro de energia */}
            <motion.div
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: [0, 1, 0.6] }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="absolute left-1/2 top-full h-12 w-1.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-emerald-400 to-transparent"
              style={{ transformOrigin: "top" }}
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-2xl font-extrabold tracking-tight text-emerald-400"
          >
            ⚡ MeuCorre
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-1 text-xs text-zinc-500"
          >
            Carregando suas corridas...
          </motion.p>

          {/* Barra de loading */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 120 }}
            transition={{ duration: 1.4, delay: 0.5, ease: "easeInOut" }}
            className="mt-6 h-1 overflow-hidden rounded-full bg-zinc-800"
          >
            <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-emerald-300" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Foguete SVG estilizado — prata/cinza com detalhes em esmeralda.
function Foguetinho() {
  return (
    <svg
      width="92"
      height="92"
      viewBox="0 0 92 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="rocketBody" x1="46" y1="10" x2="46" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e4e4e7" />
          <stop offset="1" stopColor="#a1a1aa" />
        </linearGradient>
        <linearGradient id="rocketTip" x1="46" y1="6" x2="46" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="rocketFin" x1="20" y1="60" x2="20" y2="78" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>

      {/* Corpo do foguete */}
      <path
        d="M46 6 C 56 14, 62 28, 62 44 L 62 60 L 30 60 L 30 44 C 30 28, 36 14, 46 6 Z"
        fill="url(#rocketBody)"
        stroke="#52525b"
        strokeWidth="1.2"
      />
      {/* Ponta esmeralda */}
      <path
        d="M46 6 C 50 10, 54 18, 56 28 L 36 28 C 38 18, 42 10, 46 6 Z"
        fill="url(#rocketTip)"
      />
      {/* Janela */}
      <circle cx="46" cy="34" r="6.5" fill="#0a0a0a" stroke="#10b981" strokeWidth="1.5" />
      <circle cx="44" cy="32" r="2" fill="#34d399" opacity="0.7" />
      {/* Base do foguete */}
      <rect x="30" y="58" width="32" height="6" rx="2" fill="#71717a" />
      {/* Aleta esquerda */}
      <path d="M30 56 L 18 72 L 30 64 Z" fill="url(#rocketFin)" />
      {/* Aleta direita */}
      <path d="M62 56 L 74 72 L 62 64 Z" fill="url(#rocketFin)" />
      {/* Chama */}
      <path
        d="M40 64 C 42 70, 44 74, 46 80 C 48 74, 50 70, 52 64 Z"
        fill="#10b981"
        opacity="0.85"
      />
      <path
        d="M43 64 C 44 68, 45 72, 46 75 C 47 72, 48 68, 49 64 Z"
        fill="#6ee7b7"
      />
    </svg>
  );
}
