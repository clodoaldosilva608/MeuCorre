"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatBRL } from "@/lib/apps";
import type { AppStat, PeriodStat } from "@/lib/types";

interface AppSummaryProps {
  stats: PeriodStat;
}

// Lista de barras mostrando quanto cada app rendeu no período.
export function AppSummary({ stats }: AppSummaryProps) {
  const totals = stats.byApp.map((a) => a.total);
  const max = totals.length > 0 ? Math.max(...totals) : 1;

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">
          Resumo por App
        </h3>
        {stats.count > 0 && (
          <span className="text-[10px] text-zinc-500">
            {stats.byApp.length}{" "}
            {stats.byApp.length === 1 ? "app" : "apps"} ativos
          </span>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {stats.byApp.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 p-4 text-center"
          >
            <p className="text-xs italic text-zinc-500">
              Nenhuma corrida registrada neste período.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {stats.byApp.map((app: AppStat, idx) => (
              <motion.div
                key={app.app}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
                className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
              >
                <div className="relative flex items-center justify-between p-3">
                  {/* Barra de proporção (background) */}
                  <div
                    className="absolute inset-y-0 left-0 opacity-[0.12]"
                    style={{
                      width: `${(app.total / max) * 100}%`,
                      backgroundColor: app.color,
                    }}
                  />
                  {/* Conteúdo */}
                  <div className="relative flex items-center gap-2.5">
                    {app.image ? (
                      <img
                        src={app.image}
                        alt={app.label}
                        className="h-8 w-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="grid h-8 w-8 place-items-center rounded-lg text-base"
                        style={{ backgroundColor: `${app.color}22` }}
                      >
                        {app.emoji}
                      </div>
                    )}
                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-zinc-200">
                        {app.label}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {app.count} {app.count === 1 ? "corrida" : "corridas"}
                        {app.km > 0 && ` • ${app.km.toFixed(1).replace(".", ",")} km`}
                      </p>
                    </div>
                  </div>
                  <span className="relative text-sm font-bold text-emerald-400">
                    {formatBRL(app.total)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
