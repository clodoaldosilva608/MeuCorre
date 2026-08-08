"use client";

import { motion } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { useState } from "react";
import type { AdData } from "@/hooks/use-ads";

interface AdBannerProps {
  ad: AdData;
  onDismiss: (id: string) => void;
  onClick: (ad: AdData) => void;
}

// Banner horizontal no topo do dashboard — discreto, dismissível.
export function AdBanner({ ad, onDismiss, onClick }: AdBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl"
      style={{ backgroundColor: ad.bgColor, color: ad.textColor }}
    >
      <button
        onClick={() => onClick(ad)}
        className="flex w-full items-center gap-3 p-3 text-left"
        aria-label={`${ad.title} — ${ad.cta}`}
      >
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-base font-bold"
            style={{ backgroundColor: `${ad.textColor}22` }}
          >
            {ad.title.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold leading-tight">
            {ad.title}
          </p>
          {ad.description && (
            <p className="truncate text-[10px] opacity-80">{ad.description}</p>
          )}
        </div>
        <span
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold"
          style={{
            backgroundColor: ad.textColor,
            color: ad.bgColor,
          }}
        >
          {ad.cta}
          <ExternalLink className="h-2.5 w-2.5" />
        </span>
      </button>
      <button
        onClick={() => {
          setDismissed(true);
          onDismiss(ad.id);
        }}
        aria-label="Fechar anúncio"
        className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full opacity-60 transition-opacity hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}
