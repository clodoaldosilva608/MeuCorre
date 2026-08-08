"use client";

import { motion } from "framer-motion";
import { ExternalLink, Megaphone } from "lucide-react";
import type { AdData } from "@/hooks/use-ads";

interface AdCardProps {
  ad: AdData;
  onClick: (ad: AdData) => void;
}

// Card patrocinado — inserido entre as corridas da lista.
// Visualmente distinto (badge "Patrocinado") para não confundir com corrida.
export function AdCard({ ad, onClick }: AdCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-xl border-2"
      style={{
        borderColor: `${ad.bgColor}40`,
        backgroundColor: ad.bgColor,
        color: ad.textColor,
      }}
    >
      <button
        onClick={() => onClick(ad)}
        className="flex w-full items-center gap-3 p-3.5 text-left"
        aria-label={`${ad.title} — ${ad.cta}`}
      >
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt=""
            className="h-11 w-11 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-lg font-bold"
            style={{ backgroundColor: `${ad.textColor}22` }}
          >
            {ad.title.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold leading-tight">
              {ad.title}
            </span>
            <span
              className="flex shrink-0 items-center gap-0.5 rounded px-1 py-0.5 text-[8px] font-bold uppercase"
              style={{
                backgroundColor: ad.textColor,
                color: ad.bgColor,
              }}
            >
              <Megaphone className="h-2 w-2" />
              Patrocinado
            </span>
          </div>
          {ad.description && (
            <p className="mt-0.5 line-clamp-2 text-[11px] opacity-80">
              {ad.description}
            </p>
          )}
          <span
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold underline-offset-2"
          >
            {ad.cta}
            <ExternalLink className="h-2.5 w-2.5" />
          </span>
        </div>
      </button>
    </motion.div>
  );
}
