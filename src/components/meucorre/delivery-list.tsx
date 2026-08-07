"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatBRL, formatKm, formatTime, appEmoji, appColor } from "@/lib/apps";
import type { Delivery } from "@/lib/types";
import { Pencil, Trash2, Clock } from "lucide-react";

interface DeliveryListProps {
  deliveries: Delivery[];
  onEdit: (d: Delivery) => void;
  onDelete: (id: number) => void;
}

// Lista de últimas corridas com horário, valor, km, editar e excluir.
export function DeliveryList({ deliveries, onEdit, onDelete }: DeliveryListProps) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">
          {deliveries.length === 0
            ? "Corridas"
            : `Últimas ${deliveries.length > 10 ? "10" : deliveries.length} corridas`}
        </h3>
        {deliveries.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-zinc-500">
            <Clock className="h-3 w-3" />
            recentes
          </span>
        )}
      </div>

      {deliveries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {deliveries.slice(0, 10).map((d, idx) => (
              <motion.div
                key={d.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm"
                    style={{
                      backgroundColor: `${appColor(d.app)}22`,
                    }}
                  >
                    {appEmoji(d.app)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-bold text-zinc-100">
                        {d.app}
                      </span>
                      <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400">
                        {formatTime(d.timestamp)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      {formatKm(d.km)} rodados
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <div className="text-right">
                    <span className="block text-sm font-bold text-emerald-400">
                      {formatBRL(d.value)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <button
                      onClick={() => onEdit(d)}
                      aria-label={`Editar corrida de ${d.app}`}
                      className="grid h-6 w-6 place-items-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onDelete(d.id!)}
                      aria-label={`Excluir corrida de ${d.app}`}
                      className="grid h-6 w-6 place-items-center rounded text-zinc-500 hover:bg-red-950/40 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 p-6 text-center">
      <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-zinc-800 text-2xl">
        📭
      </div>
      <p className="text-sm font-medium text-zinc-300">
        Nenhuma corrida ainda
      </p>
      <p className="mt-0.5 text-xs text-zinc-500">
        Toque no botão <span className="text-emerald-400">+</span> abaixo para
        lançar sua primeira corrida
      </p>
    </div>
  );
}
