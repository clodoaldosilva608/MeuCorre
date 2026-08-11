"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Target, Plus, X, Pencil, TrendingUp } from "lucide-react";
import { formatBRL, goalTypeLabel } from "@/lib/apps";
import type { GoalType } from "@/lib/types";
import type { GoalWithProgress } from "@/hooks/use-goals";

interface GoalsProgressProps {
  goals: GoalWithProgress[];
  onAdd: (data: { type: GoalType; targetValue: number; label?: string }) => Promise<void>;
  onUpdate: (id: number, data: Partial<{ type: GoalType; targetValue: number; label?: string; active: boolean }>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function GoalsProgress({ goals, onAdd, onUpdate, onDelete }: GoalsProgressProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GoalWithProgress | null>(null);

  const handleSave = async (data: { type: GoalType; targetValue: number; label?: string }) => {
    if (editing) {
      await onUpdate(editing.id!, data);
    } else {
      await onAdd(data);
    }
    setDialogOpen(false);
    setEditing(null);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground/80 dark:text-zinc-300">
          <Target className="h-4 w-4 text-emerald-400" />
          Metas
        </h3>
        <button
          onClick={() => { setEditing(null); setDialogOpen(true); }}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/10"
        >
          <Plus className="h-3 w-3" />
          Nova meta
        </button>
      </div>

      {goals.length === 0 ? (
        <button
          onClick={() => { setEditing(null); setDialogOpen(true); }}
          className="w-full rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-4 text-center transition-colors hover:border-emerald-400 dark:hover:border-emerald-500"
        >
          <Target className="mx-auto mb-1 h-5 w-5 text-zinc-400" />
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Defina sua primeira meta
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-500">
            Acompanhe seu progresso financeiro
          </p>
        </button>
      ) : (
        <div className="space-y-2">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => { setEditing(goal); setDialogOpen(true); }}
              onDelete={() => onDelete(goal.id!)}
            />
          ))}
        </div>
      )}

      <GoalDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        editing={editing}
        onSave={handleSave}
      />
    </section>
  );
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
}: {
  goal: GoalWithProgress;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const achieved = goal.progressPct >= 100;
  const halfway = goal.progressPct >= 50;
  const barColor = achieved ? "bg-emerald-400" : halfway ? "bg-amber-400" : "bg-emerald-500";
  const barWidth = Math.min(100, goal.progressPct);

  return (
    <div className="rounded-xl border border-border dark:border-zinc-800 bg-card dark:bg-zinc-900 p-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-foreground dark:text-zinc-100">
              {goal.label || `Meta ${goalTypeLabel(goal.type).toLowerCase()}`}
            </p>
            {achieved && (
              <span className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-400">
                ✓ Bateu!
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground dark:text-zinc-500">
            {goalTypeLabel(goal.type)} • {goal.periodLabel}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={onEdit}
            className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 hover:bg-muted dark:hover:bg-zinc-800 hover:text-blue-400"
            aria-label="Editar meta"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 hover:bg-red-950/40 hover:text-red-400"
            aria-label="Excluir meta"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-2.5 space-y-1">
        <div className="relative h-2.5 overflow-hidden rounded-full bg-muted dark:bg-zinc-800">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-emerald-400">
            {formatBRL(goal.currentValue)}
          </span>
          <span className="text-muted-foreground dark:text-zinc-500">
            de {formatBRL(goal.targetValue)}
          </span>
        </div>
      </div>

      <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground dark:text-zinc-500">
        {achieved ? (
          <>
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-emerald-400">
              Excedeu em {formatBRL(goal.currentValue - goal.targetValue)}
            </span>
          </>
        ) : (
          <span>Faltam {formatBRL(goal.remaining)} para bater a meta</span>
        )}
      </div>
    </div>
  );
}

function GoalDialog({
  open,
  onOpenChange,
  editing,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: GoalWithProgress | null;
  onSave: (data: { type: GoalType; targetValue: number; label?: string }) => Promise<void>;
}) {
  const [type, setType] = useState<GoalType>("daily");
  const [targetValue, setTargetValue] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastEditingId, setLastEditingId] = useState<string | null>(null);

  // Sincroniza form quando abre ou muda editing
  if (open && editing && editing.id !== lastEditingId) {
    setType(editing.type);
    setTargetValue(editing.targetValue.toString());
    setLabel(editing.label || "");
    setLastEditingId(editing.id ?? null);
  }
  if (open && !editing && lastEditingId !== null) {
    setType("daily");
    setTargetValue("");
    setLabel("");
    setLastEditingId(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(targetValue.replace(",", "."));
    if (!value || value <= 0) return;
    setSaving(true);
    try {
      await onSave({ type, targetValue: value, label: label.trim() || undefined });
      setType("daily");
      setTargetValue("");
      setLabel("");
      setLastEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setType("daily");
          setTargetValue("");
          setLabel("");
          setLastEditingId(null);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-md gap-0 border-border dark:border-zinc-800 bg-background dark:bg-zinc-950 p-0 text-foreground dark:text-zinc-100">
        <DialogHeader className="border-b border-border dark:border-zinc-800 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
            <Target className="h-4 w-4" />
            {editing ? "Editar meta" : "Nova meta"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground dark:text-zinc-500">
            Defina um valor alvo para acompanhar seu progresso
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground dark:text-zinc-400">
              Tipo de meta
            </Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as GoalType)}
              disabled={!!editing}
            >
              <SelectTrigger className="w-full border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diária — reseta todo dia</SelectItem>
                <SelectItem value="weekly">Semanal — reseta todo domingo</SelectItem>
                <SelectItem value="monthly">Mensal — reseta no dia 1</SelectItem>
              </SelectContent>
            </Select>
            {editing && (
              <p className="text-[10px] text-amber-500">
                Tipo não pode ser alterado após criação
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground dark:text-zinc-400">
              Valor alvo (R$) *
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="1"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="100.00"
              required
              autoFocus
              className="border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground dark:text-zinc-400">
              Nome (opcional)
            </Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Pagar aluguel"
              maxLength={50}
              className="border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <DialogFooter className="border-t border-border dark:border-zinc-800 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-300 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
            >
              {saving ? "Salvando..." : editing ? "Salvar" : "Criar meta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
