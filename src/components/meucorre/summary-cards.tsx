"use client";

import { motion } from "framer-motion";
import { formatBRL, formatKm } from "@/lib/apps";
import type { PeriodStat } from "@/lib/types";
import { TrendingUp, Bike, Route } from "lucide-react";

interface SummaryCardsProps {
  stats: PeriodStat;
  periodLabel: string;
}

// Cards de resumo no topo do dashboard.
// Total em R$ (esmeralda), número de corridas e KM rodados.
export function SummaryCards({ stats, periodLabel }: SummaryCardsProps) {
  return (
    <section className="grid grid-cols-2 gap-3">
      {/* Card principal: Total R$ — ocupa 2 colunas no mobile */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="col-span-2 overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 p-5 shadow-lg shadow-emerald-500/5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            Total {periodLabel}
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            Ganhos
          </span>
        </div>
        <h2 className="mt-2 text-4xl font-black tracking-tight text-emerald-400">
          {formatBRL(stats.total)}
        </h2>
        <p className="mt-1 text-[11px] text-zinc-500">
          {stats.count === 0
            ? "Nenhuma corrida lançada ainda"
            : `${stats.count} ${stats.count === 1 ? "corrida lançada" : "corridas lançadas"}`}
        </p>
      </motion.div>

      {/* Card corridas */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm"
      >
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
          <Bike className="h-3.5 w-3.5 text-zinc-300" />
          Corridas
        </div>
        <h3 className="mt-1 text-2xl font-black text-zinc-100">
          {stats.count}
        </h3>
        <p className="text-[10px] text-zinc-500">entregas</p>
      </motion.div>

      {/* Card quilometragem */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm"
      >
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
          <Route className="h-3.5 w-3.5 text-zinc-300" />
          Distância
        </div>
        <h3 className="mt-1 text-2xl font-black text-zinc-100">
          {formatKm(stats.km)}
        </h3>
        <p className="text-[10px] text-zinc-500">
          {stats.km > 0 && stats.count > 0
            ? `${(stats.km / stats.count).toFixed(1).replace(".", ",")} km/corrida`
            : "rodados"}
        </p>
      </motion.div>
    </section>
  );
}
