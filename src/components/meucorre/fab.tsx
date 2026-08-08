"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface FabProps {
  onClick: () => void;
  variant?: "primary" | "danger";
  label?: string;
}

// Botão flutuante com + branco.
// Posição fixa no canto inferior direito, sempre acessível.
// Acima da bottom nav (z-50) e com offset para não cobrir.
export function Fab({ onClick, variant = "primary", label = "Adicionar" }: FabProps) {
  const colorClass =
    variant === "danger"
      ? "bg-red-500 text-white shadow-red-500/40 hover:bg-red-600"
      : "bg-emerald-500 text-zinc-950 shadow-emerald-500/40 hover:bg-emerald-400";

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={label}
      className={`fixed bottom-20 right-5 z-50 grid h-14 w-14 place-items-center rounded-full shadow-xl ring-4 ring-zinc-950/40 transition-colors ${colorClass}`}
    >
      <Plus className="h-7 w-7" strokeWidth={3} />
    </motion.button>
  );
}
