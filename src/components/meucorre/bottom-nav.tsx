"use client";

import { cn } from "@/lib/utils";
import { Bike, Wallet, BarChart3 } from "lucide-react";

export type Tab = "corridas" | "despesas" | "graficos";

interface BottomNavProps {
  active: Tab;
  onChange: (t: Tab) => void;
  hasExpenses: boolean;
  hasDeliveries: boolean;
}

// Barra de navegação inferior (mobile-first) — tabs Corridas / Despesas / Gráficos.
export function BottomNav({
  active,
  onChange,
  hasExpenses,
  hasDeliveries,
}: BottomNavProps) {
  const tabs: { key: Tab; label: string; icon: typeof Bike; show: boolean }[] = [
    { key: "corridas", label: "Corridas", icon: Bike, show: true },
    { key: "despesas", label: "Despesas", icon: Wallet, show: true },
    {
      key: "graficos",
      label: "Gráficos",
      icon: BarChart3,
      show: hasDeliveries || hasExpenses,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border dark:border-zinc-800 bg-background dark:bg-zinc-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {tabs
          .filter((t) => t.show)
          .map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onChange(tab.key)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 transition-colors",
                  isActive
                    ? "text-emerald-400"
                    : "text-zinc-500 hover:text-foreground/80 dark:text-zinc-300",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isActive && "scale-110",
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isActive && "font-semibold",
                  )}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
      </div>
    </nav>
  );
}
