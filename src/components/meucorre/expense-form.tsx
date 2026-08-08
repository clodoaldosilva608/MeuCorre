"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EXPENSE_CATEGORIES } from "@/lib/apps";
import type { Expense, ExpenseCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DollarSign, Wallet, Receipt } from "lucide-react";

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    category: ExpenseCategory;
    value: number;
    description?: string;
  }) => Promise<void>;
  editing?: Expense | null;
}

const QUICK_VALUES = [10, 20, 30, 50, 80, 100];

export function ExpenseForm({
  open,
  onOpenChange,
  onSubmit,
  editing,
}: ExpenseFormProps) {
  const [category, setCategory] = useState<ExpenseCategory>("combustivel");
  const [value, setValue] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setCategory(editing.category);
        setValue(String(editing.value).replace(".", ","));
        setDescription(editing.description ?? "");
      } else {
        setCategory("combustivel");
        setValue("");
        setDescription("");
      }
    }
  }, [open, editing]);

  const parseNumber = (s: string): number => {
    if (!s) return 0;
    return parseFloat(s.replace(",", ".")) || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseNumber(value);
    if (v <= 0) return;
    setSubmitting(true);
    try {
      await onSubmit({
        category,
        value: v,
        description: description.trim() || undefined,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md gap-0 overflow-y-auto border-zinc-800 bg-zinc-950 p-0 text-zinc-100">
        <DialogHeader className="border-b border-zinc-800 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-red-400">
            <Wallet className="h-4 w-4" />
            {editing ? "Editar Despesa" : "Nova Despesa"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            {editing
              ? "Atualize os dados da despesa"
              : "Registre um gasto do dia de trabalho"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {/* Categoria — grid visual */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-zinc-400">
              Categoria
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {EXPENSE_CATEGORIES.map((c) => {
                const selected = category === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border p-2.5 transition-all",
                      selected
                        ? "border-red-500 bg-red-500/10 ring-1 ring-red-500/40"
                        : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/60",
                    )}
                  >
                    <span className="text-lg">{c.emoji}</span>
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        selected ? "text-red-300" : "text-zinc-400",
                      )}
                    >
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Valor */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <DollarSign className="h-3 w-3" />
              Valor (R$)
            </Label>
            <Input
              type="text"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0,00"
              required
              autoFocus
              className="border-zinc-800 bg-zinc-900 text-lg font-semibold text-red-400 placeholder:text-zinc-600 placeholder:font-normal focus:border-red-500 focus:ring-red-500/20"
            />
            {!editing && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_VALUES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setValue(String(v))}
                    className="rounded-md bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-red-500/20 hover:text-red-400"
                  >
                    R$ {v}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <Receipt className="h-3 w-3" />
              Descrição (opcional)
            </Label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ex: gasolina, óleo, almoço..."
              maxLength={60}
              className="border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus:border-red-500 focus:ring-red-500/20"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting || parseNumber(value) <= 0}
              className="flex-1 bg-red-500 font-bold text-white shadow-lg shadow-red-500/25 hover:bg-red-600 disabled:opacity-50"
            >
              {submitting ? "Salvando..." : editing ? "Salvar" : "Lançar Despesa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
