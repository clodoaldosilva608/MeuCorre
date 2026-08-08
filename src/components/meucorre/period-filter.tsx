"use client";

import { PeriodFilter as Period } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PeriodFilterProps {
  value: Period;
  onChange: (p: Period) => void;
}

const OPTIONS: { key: Period; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mês" },
  { key: "tudo", label: "Tudo" },
];

// Filtro de período — pill toggle no estilo do app.
export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="flex gap-1 rounded-xl border border-border dark:border-zinc-800 bg-card dark:bg-zinc-900 p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={cn(
            "flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all",
            value === opt.key
              ? "bg-emerald-500 text-zinc-950 shadow-sm shadow-emerald-500/30"
              : "text-muted-foreground dark:text-zinc-400 hover:bg-muted dark:bg-zinc-800 hover:text-zinc-200",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// Label exibido nos cards de resumo.
export function periodLabel(p: Period): string {
  return OPTIONS.find((o) => o.key === p)?.label.toLowerCase() ?? "hoje";
}
