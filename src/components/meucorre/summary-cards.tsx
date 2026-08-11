"use client";

import { motion } from "framer-motion";
import { formatBRL, formatKm } from "@/lib/apps";
import type { PeriodStat } from "@/lib/types";
import { TrendingUp, TrendingDown, Wallet, Bike, Route, DollarSign, Clock } from "lucide-react";

interface SummaryCardsProps {
  stats: PeriodStat;
  periodLabel: string;
}

// ===== SummaryCards Premium Enterprise =====
//
// Design: Dark Glassmorphism Tech (fintech premium)
//
// Layout:
// 1. Hero Card (lucro líquido em destaque — ocupa 100% largura)
//    - Valor grande (32-36px) com tabular nums
//    - Indicador de tendência (▲/▼)
//    - Glow verde sutil na borda
//
// 2. Grid 2x2 (faturamento, gastos, corridas, distância)
//    - Cards glass com blur
//    - Ícones semânticos
//    - Valores com cores financeiras (verde/vermelho)
export function SummaryCards({ stats, periodLabel }: SummaryCardsProps) {
  const profit = stats.netProfit;
  const profitPositive = profit >= 0;

  return (
    <section className="space-y-3">
      {/* ===== HERO CARD: Lucro líquido (destaque principal) ===== */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="hero-card p-5"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/15">
              <Wallet className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Lucro líquido
              </p>
              <p className="text-[10px] text-zinc-500">{periodLabel}</p>
            </div>
          </div>
          <span className={`pill-badge ${profitPositive ? "pill-profit" : "pill-loss"}`}>
            {profitPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {profitPositive ? "no azul" : "no vermelho"}
          </span>
        </div>

        {/* Valor principal — grande, com tabular nums */}
        <h2
          className={`mt-3 text-4xl font-black tracking-tight text-money ${
            profitPositive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {formatBRL(profit)}
        </h2>

        {/* Breakdown: ganhos - despesas */}
        <div className="mt-3 flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1 text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {formatBRL(stats.total)} ganhos
          </span>
          <span className="text-zinc-600">−</span>
          <span className="flex items-center gap-1 text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            {formatBRL(stats.expenses)} despesas
          </span>
        </div>
      </motion.div>

      {/* ===== GRID 2x2: Métricas secundárias ===== */}
      <div className="grid grid-cols-2 gap-3">
        {/* Faturamento bruto */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="stat-card"
        >
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Faturamento
            </p>
          </div>
          <p className="mt-1.5 text-xl font-bold text-money text-white">
            {formatBRL(stats.total)}
          </p>
          <p className="text-[10px] text-zinc-500">bruto</p>
        </motion.div>

        {/* Gastos */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="stat-card"
        >
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5 text-red-400" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Gastos
            </p>
          </div>
          <p className="mt-1.5 text-xl font-bold text-money text-red-400">
            {formatBRL(stats.expenses)}
          </p>
          <p className="text-[10px] text-zinc-500">despesas</p>
        </motion.div>

        {/* Corridas */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="stat-card"
        >
          <div className="flex items-center gap-1.5">
            <Bike className="h-3.5 w-3.5 text-cyan-400" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Corridas
            </p>
          </div>
          <p className="mt-1.5 text-xl font-bold text-money text-white">
            {stats.count}
          </p>
          <p className="text-[10px] text-zinc-500">entregas</p>
        </motion.div>

        {/* Distância */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="stat-card"
        >
          <div className="flex items-center gap-1.5">
            <Route className="h-3.5 w-3.5 text-amber-400" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Distância
            </p>
          </div>
          <p className="mt-1.5 text-xl font-bold text-money text-white">
            {formatKm(stats.km)}
          </p>
          <p className="text-[10px] text-zinc-500">
            {stats.km > 0 && stats.count > 0
              ? `${(stats.km / stats.count).toFixed(1).replace(".", ",")} km/corrida`
              : "rodados"}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
