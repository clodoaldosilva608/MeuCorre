"use client";

import { cn } from "@/lib/utils";
import { Bike, Wallet, BarChart3, ShoppingBag } from "lucide-react";

export type Tab = "corridas" | "despesas" | "graficos" | "ofertas";

interface BottomNavProps {
  active: Tab;
  onChange: (t: Tab) => void;
  hasExpenses: boolean;
  hasDeliveries: boolean;
}

// ===== BottomNav Premium Enterprise =====
//
// Barra de navegação inferior com glassmorphism premium.
// - Fundo semi-transparente com blur (backdrop-filter)
// - Borda superior sutil com glow verde
// - Ícones com glow quando ativos
// - Indicador de tab ativa com pill de fundo
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
      key: "ofertas",
      label: "Ofertas",
      icon: ShoppingBag,
      show: true,
    },
    {
      key: "graficos",
      label: "Gráficos",
      icon: BarChart3,
      show: hasDeliveries || hasExpenses,
    },
  ];

  return (
    <nav className="bottom-nav-premium fixed bottom-0 left-0 right-0 z-30">
      <div className="mx-auto flex max-w-md items-center justify-around gap-1 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
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
                  "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition-all duration-200",
                  isActive
                    ? "text-emerald-400"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <div className={cn(
                  "grid h-7 w-7 place-items-center rounded-lg transition-all duration-200",
                  isActive && "bg-emerald-500/10 glow-emerald-sm",
                )}>
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform sm:h-5 sm:w-5",
                      isActive && "scale-110",
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span
                  className={cn(
                    "text-[9px] font-medium sm:text-[10px]",
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
