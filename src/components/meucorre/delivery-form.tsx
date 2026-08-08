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
import type { Delivery, DeliveryApp } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DollarSign, Route, Bike, Zap, Check } from "lucide-react";

interface DeliveryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    app: string;
    value: number;
    km: number;
    notes?: string;
  }) => Promise<void>;
  editing?: Delivery | null;
  apps: DeliveryApp[]; // apps visíveis (do DB)
}

const QUICK_VALUES = [5, 10, 15, 20, 25, 30];

export function DeliveryForm({
  open,
  onOpenChange,
  onSubmit,
  editing,
  apps,
}: DeliveryFormProps) {
  const [app, setApp] = useState<string>("iFood");
  const [value, setValue] = useState<string>("");
  const [km, setKm] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setApp(editing.app);
        setValue(String(editing.value).replace(".", ","));
        setKm(String(editing.km).replace(".", ","));
        setNotes(editing.notes ?? "");
      } else {
        setApp(apps[0]?.name ?? "iFood");
        setValue("");
        setKm("");
        setNotes("");
      }
    }
  }, [open, editing, apps]);

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
        app,
        value: v,
        km: parseNumber(km),
        notes: notes.trim() || undefined,
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
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
            <Zap className="h-4 w-4" />
            {editing ? "Editar Corrida" : "Nova Corrida"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            {editing
              ? "Atualize os dados da corrida"
              : "Registre a corrida que você acabou de fazer"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {/* App selector — grid visual de cards */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-zinc-400">
              Aplicativo
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {apps.map((a) => {
                const selected = app === a.name;
                return (
                  <button
                    key={a.name}
                    type="button"
                    onClick={() => setApp(a.name)}
                    className={cn(
                      "relative flex flex-col items-center gap-1 rounded-xl border p-2.5 transition-all",
                      selected
                        ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/40"
                        : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/60",
                    )}
                  >
                    {/* Imagem oficial OU emoji */}
                    {a.image ? (
                      <img
                        src={a.image}
                        alt={a.label}
                        className="h-9 w-9 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="grid h-9 w-9 place-items-center rounded-lg text-lg"
                        style={{ backgroundColor: `${a.color}22` }}
                      >
                        {a.emoji}
                      </div>
                    )}
                    <span
                      className={cn(
                        "max-w-full truncate text-[10px] font-medium",
                        selected ? "text-emerald-300" : "text-zinc-400",
                      )}
                    >
                      {a.label}
                    </span>
                    {selected && (
                      <div className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500">
                        <Check className="h-2.5 w-2.5 text-zinc-950" strokeWidth={3} />
                      </div>
                    )}
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
              className="border-zinc-800 bg-zinc-900 text-lg font-semibold text-emerald-400 placeholder:text-zinc-600 placeholder:font-normal focus:border-emerald-500 focus:ring-emerald-500/20"
            />
            {!editing && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_VALUES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setValue(String(v))}
                    className="rounded-md bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-emerald-500/20 hover:text-emerald-400"
                  >
                    R$ {v}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* KM */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <Route className="h-3 w-3" />
              Quilômetros (km)
            </Label>
            <Input
              type="text"
              inputMode="decimal"
              value={km}
              onChange={(e) => setKm(e.target.value)}
              placeholder="0,0"
              className="border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-emerald-500/20"
            />
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <Bike className="h-3 w-3" />
              Observação (opcional)
            </Label>
            <Input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: bairro Centro, pico do almoço..."
              maxLength={60}
              className="border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-emerald-500/20"
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
              className="flex-1 bg-emerald-500 font-bold text-zinc-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 disabled:opacity-50"
            >
              {submitting
                ? "Salvando..."
                : editing
                  ? "Salvar alterações"
                  : "Lançar Corrida"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
