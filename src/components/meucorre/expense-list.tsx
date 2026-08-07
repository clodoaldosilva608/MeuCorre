"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  formatBRL,
  formatTime,
  expenseCategoryMeta,
} from "@/lib/apps";
import type { Expense } from "@/lib/types";
import { Pencil, Trash2 } from "lucide-react";

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (e: Expense) => void;
  onDelete: (e: Expense) => void;
}

export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">
          {expenses.length === 0
            ? "Despesas"
            : `Últimas ${expenses.length > 10 ? 10 : expenses.length} despesas`}
        </h3>
      </div>

      {expenses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 p-6 text-center">
          <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-zinc-800 text-2xl">
            💸
          </div>
          <p className="text-sm font-medium text-zinc-300">
            Nenhuma despesa ainda
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Toque no botão <span className="text-red-400">+</span> para
            registrar um gasto
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {expenses.slice(0, 10).map((e, idx) => {
              const meta = expenseCategoryMeta(e.category);
              return (
                <motion.div
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-base"
                      style={{ backgroundColor: `${meta.color}22` }}
                    >
                      {meta.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-bold text-zinc-100">
                          {meta.label}
                        </span>
                        <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400">
                          {formatTime(e.timestamp)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                        {e.description || "Sem descrição"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-red-400">
                      -{formatBRL(e.value)}
                    </span>
                    <div className="flex flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      <button
                        onClick={() => onEdit(e)}
                        aria-label={`Editar despesa de ${meta.label}`}
                        className="grid h-6 w-6 place-items-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onDelete(e)}
                        aria-label={`Excluir despesa de ${meta.label}`}
                        className="grid h-6 w-6 place-items-center rounded text-zinc-500 hover:bg-red-950/40 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
