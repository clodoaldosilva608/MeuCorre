"use client";

import { motion } from "framer-motion";
import { formatBRL, formatKm } from "@/lib/apps";
import type { PeriodStat } from "@/lib/types";
import { TrendingUp, TrendingDown, Wallet, Bike, Route } from "lucide-react";

interface SummaryCardsProps {
  stats: PeriodStat;
  periodLabel: string;
}

// Cards de resumo no topo do dashboard.
// Total em R$ (esmeralda), lucro líquido, corridas e KM rodados.
export function SummaryCards({ stats, periodLabel }: SummaryCardsProps) {
  const profit = stats.netProfit;
  const profitPositive = profit >= 0;

  return (
    <section className="grid grid-cols-2 gap-3">
      {/* Card principal: Total R$ ganho */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="col-span-2 overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 p-5 shadow-lg shadow-emerald-500/5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground dark:text-zinc-400">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            Ganhos {periodLabel}
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            bruto
          </span>
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-emerald-400 sm:text-3xl">
          {formatBRL(stats.total)}
        </h2>
        <p className="mt-1 text-[11px] text-zinc-500">
          {stats.count === 0
            ? "Nenhuma corrida lançada ainda"
            : `${stats.count} ${stats.count === 1 ? "corrida lançada" : "corridas lançadas"}`}
        </p>
      </motion.div>

      {/* Card lucro líquido (ganhos - despesas) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className={`col-span-2 overflow-hidden rounded-2xl border p-4 ${
          profitPositive
            ? "border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 to-zinc-900"
            : "border-red-500/30 bg-gradient-to-br from-red-950/30 to-zinc-900"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground dark:text-zinc-400">
            <Wallet
              className={`h-3.5 w-3.5 ${
                profitPositive ? "text-emerald-400" : "text-red-400"
              }`}
            />
            Lucro líquido
          </div>
          <span
            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              profitPositive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {profitPositive ? (
              <TrendingUp className="h-2.5 w-2.5" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5" />
            )}
            {profitPositive ? "no azul" : "no vermelho"}
          </span>
        </div>
        <h3
          className={`mt-1.5 text-xl font-black tracking-tight sm:text-2xl ${
            profitPositive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {formatBRL(profit)}
        </h3>
        <p className="mt-0.5 text-[10px] text-zinc-500">
          {formatBRL(stats.total)} ganhos − {formatBRL(stats.expenses)} despesas
        </p>
      </motion.div>

      {/* Card corridas */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="rounded-2xl border border-border dark:border-zinc-800 bg-card dark:bg-zinc-900 p-4 shadow-sm"
      >
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground dark:text-zinc-400">
          <Bike className="h-3.5 w-3.5 text-foreground/80 dark:text-zinc-300" />
          Corridas
        </div>
        <h3 className="mt-1 text-xl font-black text-foreground dark:text-zinc-100 sm:text-2xl">
          {stats.count}
        </h3>
        <p className="text-[10px] text-zinc-500">entregas</p>
      </motion.div>

      {/* Card quilometragem */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15 }}
        className="rounded-2xl border border-border dark:border-zinc-800 bg-card dark:bg-zinc-900 p-4 shadow-sm"
      >
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground dark:text-zinc-400">
          <Route className="h-3.5 w-3.5 text-foreground/80 dark:text-zinc-300" />
          Distância
        </div>
        <h3 className="mt-1 text-xl font-black text-foreground dark:text-zinc-100 sm:text-2xl">
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
