"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface FabProps {
  onClick: () => void;
}

// Botão flutuante verde esmeralda com "+" branco.
// Posição fixa no canto inferior direito, sempre acessível.
export function Fab({ onClick }: FabProps) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label="Adicionar nova corrida"
      className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-zinc-950 shadow-xl shadow-emerald-500/40 ring-4 ring-zinc-950/40 transition-colors hover:bg-emerald-400"
    >
      <Plus className="h-7 w-7 stroke-[3]" strokeWidth={3} />
    </motion.button>
  );
}
