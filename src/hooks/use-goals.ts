"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useState } from "react";
import { db } from "@/lib/db";
import { goalPeriodBounds } from "@/lib/apps";
import type { Goal, GoalType } from "@/lib/types";

function useDbVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const handler = () => setVersion((v) => v + 1);
    window.addEventListener("meucorre-db-switched", handler);
    return () => window.removeEventListener("meucorre-db-switched", handler);
  }, []);
  return version;
}

export interface GoalWithProgress extends Goal {
  currentValue: number;
  progressPct: number;
  periodLabel: string;
  remaining: number;
}

export function useGoals(deliveries: { date: string; value: number }[]) {
  const dbVersion = useDbVersion();

  const goals = useLiveQuery(
    async () => {
      try {
        return await db.goals.toArray();
      } catch {
        return [] as Goal[];
      }
    },
    [dbVersion],
    [] as Goal[],
  );

  const activeGoals = goals.filter((g) => g.active);

  const goalsWithProgress: GoalWithProgress[] = activeGoals.map((g) => {
    const { startISO, endISO, label } = goalPeriodBounds(g.type);
    const currentValue = deliveries
      .filter((d) => d.date >= startISO && d.date <= endISO)
      .reduce((sum, d) => sum + d.value, 0);
    const progressPct = g.targetValue > 0 ? Math.min(100, (currentValue / g.targetValue) * 100) : 0;
    const remaining = Math.max(0, g.targetValue - currentValue);
    return { ...g, currentValue, progressPct, periodLabel: label, remaining };
  });

  const addGoal = useCallback(
    async (data: { type: GoalType; targetValue: number; label?: string }) => {
      await db.goals.add({
        type: data.type,
        targetValue: data.targetValue,
        label: data.label?.trim() || undefined,
        active: true,
        createdAt: Date.now(),
      });
    },
    [],
  );

  const updateGoal = useCallback(
    async (id: number, data: Partial<Omit<Goal, "id" | "createdAt">>) => {
      await db.goals.update(id, data);
    },
    [],
  );

  const deleteGoal = useCallback(async (id: number) => {
    await db.goals.update(id, { active: false });
  }, []);

  return {
    goals: activeGoals,
    goalsWithProgress,
    addGoal,
    updateGoal,
    deleteGoal,
  };
}
