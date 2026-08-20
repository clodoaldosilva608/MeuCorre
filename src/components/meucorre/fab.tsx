"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface FabProps {
  onClick: () => void;
  variant?: "primary" | "danger";
  label?: string;
}

// ===== FAB Premium Enterprise =====
//
// Botão flutuante de ação (+) com gradiente verde e glow.
// - Gradiente linear de #86EFAC para #22C55E
// - Sombra colorida (glow verde)
// - Ring sutil para destaque
// - Animação spring na entrada
export function Fab({ onClick, variant = "primary", label = "Adicionar" }: FabProps) {
  const fabClass =
    variant === "danger"
      ? "bg-gradient-to-br from-red-400 to-red-600 text-white shadow-red-500/40"
      : "fab-premium";

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={label}
      className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex h-14 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center justify-center gap-3 rounded-2xl px-6 text-base font-extrabold ring-4 ring-zinc-950/40 ${fabClass}`}
      >
      <Plus className="h-6 w-6" strokeWidth={3} />
      <span>{label === "Adicionar" ? "Nova corrida" : label}</span>

    </motion.button>
  );
}
