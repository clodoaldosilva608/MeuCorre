"use client";

import { motion } from "framer-motion";
import { formatBRL, formatKm } from "@/lib/apps";
import type { PeriodStat } from "@/lib/types";
import { Bike, CircleDollarSign, Map, TrendingDown, Wallet } from "lucide-react";

interface SummaryCardsProps {
  stats: PeriodStat;
  periodLabel: string;
}

export function SummaryCards({ stats, periodLabel }: SummaryCardsProps) {
  const profitPositive = stats.netProfit >= 0;
  const averageKm = stats.km > 0 && stats.count > 0
    ? `${(stats.km / stats.count).toFixed(1).replace(".", ",")} km/corrida`
    : "rodados";

  const metrics = [
    { label: "Faturamento", value: formatBRL(stats.total), icon: Wallet, tone: "text-emerald-400" },
    { label: "Gastos", value: formatBRL(stats.expenses), icon: CircleDollarSign, tone: "text-red-400" },
    { label: "Corridas", value: String(stats.count), icon: Bike, tone: "text-emerald-400" },
    { label: "Distância", value: formatKm(stats.km), icon: Map, tone: "text-emerald-400" },
  ];

  return (
    <section className="space-y-3" aria-label="Resumo financeiro">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="reference-profit-card"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[16px] font-semibold text-white">Lucro líquido</p>
            <span className="grid h-4 w-4 place-items-center rounded-full border border-zinc-500 text-[9px] text-zinc-400">i</span>
          </div>
          <p className={`reference-profit-amount mt-2 text-[38px] font-black leading-none tracking-tight ${profitPositive ? "text-emerald-400" : "text-red-400"}`}>
            {formatBRL(stats.netProfit)}
          </p>
          <p className="mt-3 text-sm text-zinc-400">{periodLabel}</p>
        </div>
        <div className="reference-profit-breakdown">
          <div>
            <p className="text-sm text-zinc-400">Ganhos</p>
            <p className="mt-1 text-lg font-bold text-emerald-400">{formatBRL(stats.total)}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-400">Despesas</p>
            <p className="mt-1 flex items-center gap-1 text-lg font-bold text-red-400">
              <TrendingDown className="h-4 w-4" /> - {formatBRL(stats.expenses)}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="reference-metric-strip">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              className="reference-metric"
            >
              <Icon className={`h-5 w-5 shrink-0 ${metric.tone}`} strokeWidth={1.8} />
              <div className="min-w-0">
                <p className="truncate text-[11px] text-zinc-400">{metric.label}</p>
                <p className={`mt-0.5 truncate text-[15px] font-bold ${metric.label === "Gastos" ? "text-red-400" : "text-white"}`}>{metric.value}</p>
                {metric.label === "Distância" && <p className="text-[9px] text-zinc-500">{averageKm}</p>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
