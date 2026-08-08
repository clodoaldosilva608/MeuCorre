"use client";

import { motion } from "framer-motion";
import type { AdData } from "@/hooks/use-ads";

interface SponsoredSplashProps {
  ad: AdData;
}

// Banner pequeno na splash screen de carregamento (alta visibilidade).
// Aparece abaixo do Foguetinho + nome do app.
export function SponsoredSplash({ ad }: SponsoredSplashProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-8 rounded-xl px-4 py-2 text-center"
      style={{ backgroundColor: ad.bgColor, color: ad.textColor }}
    >
      <p className="text-[9px] font-medium uppercase opacity-70">
        Patrocinado
      </p>
      <p className="text-xs font-bold">{ad.title}</p>
      {ad.description && (
        <p className="mt-0.5 text-[10px] opacity-90">{ad.description}</p>
      )}
    </motion.div>
  );
}
