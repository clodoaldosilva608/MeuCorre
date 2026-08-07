"use client";

import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { formatBRL } from "@/lib/apps";
import type { AppStat, PeriodStat } from "@/lib/types";
import type { ExpenseCategory } from "@/lib/types";
import { EXPENSE_CATEGORIES, expenseCategoryMeta } from "@/lib/apps";
import { TrendingUp, PieChart as PieIcon, BarChart3 } from "lucide-react";

interface ChartsProps {
  dailySeries: { date: string; label: string; ganhos: number; despesas: number }[];
  stats: PeriodStat;
  expensesByCategory: { category: ExpenseCategory; total: number; count: number }[];
}

const TOOLTIP_STYLE = {
  backgroundColor: "#18181b",
  border: "1px solid #27272a",
  borderRadius: 8,
  color: "#f4f4f5",
  fontSize: 12,
  padding: 8,
};

export function Charts({ dailySeries, stats, expensesByCategory }: ChartsProps) {
  const hasData = stats.total > 0 || stats.expenses > 0;

  if (!hasData) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-zinc-800 text-2xl">
          📊
        </div>
        <p className="text-sm font-medium text-zinc-300">
          Sem dados para gráficos ainda
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">
          Lance algumas corridas e despesas para visualizar os gráficos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Gráfico de área: ganhos vs despesas (7 dias) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
      >
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-zinc-300">
            Últimos 7 dias
          </h3>
        </div>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dailySeries}
              margin={{ top: 4, right: 4, bottom: 0, left: -22 }}
            >
              <defs>
                <linearGradient id="ganhosGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="despesasGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#71717a", fontSize: 10 }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                }
                width={36}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "#a1a1aa", fontSize: 11 }}
                formatter={(value: number, name: string) => [
                  formatBRL(value),
                  name === "ganhos" ? "Ganhos" : "Despesas",
                ]}
              />
              <Area
                type="monotone"
                dataKey="ganhos"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#ganhosGrad)"
              />
              <Area
                type="monotone"
                dataKey="despesas"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#despesasGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex justify-center gap-4 text-[10px]">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Ganhos
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Despesas
          </span>
        </div>
      </motion.div>

      {/* Pizza: distribuição por app */}
      {stats.byApp.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <div className="mb-3 flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-300">
              Distribuição por app
            </h3>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <div className="h-40 w-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byApp}
                    dataKey="total"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={72}
                    paddingAngle={2}
                    stroke="#09090b"
                    strokeWidth={2}
                  >
                    {stats.byApp.map((entry: AppStat, idx: number) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value: number) => formatBRL(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legenda com valores */}
            <div className="flex-1 space-y-1.5">
              {stats.byApp.slice(0, 6).map((app) => {
                const pct = stats.total > 0 ? (app.total / stats.total) * 100 : 0;
                return (
                  <div
                    key={app.app}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: app.color }}
                      />
                      <span className="truncate text-zinc-300">{app.label}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-semibold text-emerald-400">
                        {formatBRL(app.total)}
                      </span>
                      <span className="w-9 text-right text-[10px] text-zinc-500">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Barras: despesas por categoria */}
      {expensesByCategory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-semibold text-zinc-300">
              Despesas por categoria
            </h3>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={expensesByCategory.map((e) => ({
                  name: expenseCategoryMeta(e.category).label,
                  emoji: expenseCategoryMeta(e.category).emoji,
                  color: expenseCategoryMeta(e.category).color,
                  total: e.total,
                }))}
                margin={{ top: 4, right: 4, bottom: 0, left: -22 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272a"
                  vertical={false}
                />
                <XAxis
                  dataKey="emoji"
                  tick={{ fill: "#71717a", fontSize: 14 }}
                  axisLine={{ stroke: "#27272a" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                  }
                  width={36}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: number) => formatBRL(value)}
                  labelFormatter={(label: string) => {
                    const cat = EXPENSE_CATEGORIES.find(
                      (c) => c.emoji === label,
                    );
                    return cat?.label ?? label;
                  }}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {expensesByCategory.map((e, idx) => (
                    <Cell
                      key={`bar-${idx}`}
                      fill={expenseCategoryMeta(e.category).color}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  );
}
