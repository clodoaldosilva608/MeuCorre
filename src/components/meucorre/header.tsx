"use client";

import { useEffect, useState } from "react";
import { formatShortDate } from "@/lib/apps";
import {
  Download,
  Trash2,
  Bell,
  Grid3x3,
  Crown,
  Sparkles,
  Share2,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onExportJSON: () => void;
  onExportCSV: () => void;
  onClearAll: () => void;
  onOpenApps: () => void;
  onOpenCapture: () => void;
  onOpenLicense: () => void;
  onOpenShare: () => void;
  onLogout: () => void;
  isPro: boolean;
  syncStatus?: "idle" | "syncing" | "synced" | "offline" | "not-logged-in" | "error";
}

// Cabeçalho fixo no topo: logo ⚡ MeuCorre + data + menu de ações.
// Em PRO, mostra badge "PRO" no lugar do botão de licença.
export function Header({
  onExportJSON,
  onExportCSV,
  onClearAll,
  onOpenApps,
  onOpenCapture,
  onOpenLicense,
  onOpenShare,
  onLogout,
  isPro,
  syncStatus,
}: HeaderProps) {
  // A data só é calculada depois do mount para evitar hydration mismatch.
  // O servidor roda em UTC e o cliente no fuso local do entregador — quando
  // passa meia-noite num e não no outro, as datas divergem.
  // Renderizamos string vazia no SSR e no primeiro render do cliente,
  // e só preenchemos depois via useEffect.
  const [dateStr, setDateStr] = useState<string>("");
  useEffect(() => {
    // Padrão legítimo de "render-after-mount" para evitar hydration mismatch
    // de datas (servidor UTC vs cliente no fuso local do entregador).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDateStr(formatShortDate());
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border dark:border-zinc-800/80 bg-background dark:bg-zinc-950/85 backdrop-blur-xl dark:bg-background dark:bg-zinc-950/85 dark:border-border dark:border-zinc-800/80">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-base shadow-lg shadow-emerald-500/25">
            ⚡
          </div>
          <div className="leading-none">
            <h1 className="text-lg font-extrabold tracking-tight text-emerald-400">
              MeuCorre
            </h1>
            <p className="text-[10px] font-medium text-zinc-500">
              Gestão de Entregas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <span
            suppressHydrationWarning
            className="hidden min-w-[80px] rounded-full bg-muted dark:bg-zinc-800 px-2.5 py-1 text-center text-[11px] font-medium capitalize text-muted-foreground dark:text-zinc-400 sm:inline dark:bg-muted dark:bg-zinc-800 dark:text-muted-foreground dark:text-zinc-400"
          >
            {dateStr || "\u00A0"}
          </span>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Capturar por notificação */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenCapture}
            aria-label="Capturar por notificação"
            className="hidden h-8 w-8 rounded-full text-muted-foreground dark:text-zinc-400 hover:bg-muted dark:bg-zinc-800 hover:text-emerald-400 sm:inline-flex"
          >
            <Bell className="h-4 w-4" />
          </Button>

          {/* Gerenciar apps */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenApps}
            aria-label="Gerenciar apps de entrega"
            className="hidden h-8 w-8 rounded-full text-muted-foreground dark:text-zinc-400 hover:bg-muted dark:bg-zinc-800 hover:text-emerald-400 sm:inline-flex"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>

          {/* Compartilhar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenShare}
            aria-label="Compartilhar com amigos"
            className="hidden h-8 w-8 rounded-full text-muted-foreground dark:text-zinc-400 hover:bg-emerald-500/10 hover:text-emerald-400 sm:inline-flex"
          >
            <Share2 className="h-4 w-4" />
          </Button>

          {/* Indicador de sincronização */}
          {syncStatus && syncStatus !== "not-logged-in" && syncStatus !== "idle" && (
            <span
              className="hidden items-center gap-0.5 text-[9px] font-medium sm:flex"
              title={
                syncStatus === "syncing"
                  ? "Sincronizando..."
                  : syncStatus === "synced"
                    ? "Dados sincronizados"
                    : syncStatus === "offline"
                      ? "Offline — dados salvos localmente"
                      : syncStatus === "error"
                        ? "Erro de sincronização"
                        : ""
              }
            >
              {syncStatus === "syncing" && (
                <span className="flex items-center gap-0.5 text-blue-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                  sync
                </span>
              )}
              {syncStatus === "synced" && (
                <span className="flex items-center gap-0.5 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  sync
                </span>
              )}
              {(syncStatus === "offline" || syncStatus === "error") && (
                <span className="flex items-center gap-0.5 text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  sync
                </span>
              )}
            </span>
          )}

          {/* PRO badge ou botão de licença */}
          {isPro ? (
            <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 px-1.5 py-1 text-[10px] font-black text-zinc-950 shadow-sm shadow-emerald-500/30 sm:px-2">
              <Sparkles className="h-2.5 w-2.5" />
              PRO
            </span>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenLicense}
              aria-label="Ativar licença PRO"
              className="h-8 w-8 shrink-0 rounded-full text-muted-foreground dark:text-zinc-400 hover:bg-emerald-500/10 hover:text-emerald-400"
            >
              <Crown className="h-4 w-4" />
            </Button>
          )}

          {/* Menu de backup */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground dark:text-zinc-400 hover:bg-muted dark:bg-zinc-800 hover:text-foreground dark:text-zinc-100"
                aria-label="Menu de ações"
              >
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 border-border dark:border-zinc-800 bg-card dark:bg-zinc-900 text-zinc-200"
            >
              <DropdownMenuLabel className="text-xs text-zinc-500">
                Backup / Dados
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-muted dark:bg-zinc-800" />
              <DropdownMenuItem
                onClick={onExportJSON}
                className="cursor-pointer focus:bg-muted dark:bg-zinc-800 focus:text-foreground dark:text-zinc-100"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar JSON
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onExportCSV}
                className="cursor-pointer focus:bg-muted dark:bg-zinc-800 focus:text-foreground dark:text-zinc-100"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-muted dark:bg-zinc-800" />
              <DropdownMenuItem
                onClick={onClearAll}
                className="cursor-pointer text-red-400 focus:bg-red-950/40 focus:text-red-300"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Apagar tudo
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-muted dark:bg-zinc-800" />
              <DropdownMenuItem
                onClick={onLogout}
                className="cursor-pointer focus:bg-muted dark:bg-zinc-800 focus:text-foreground dark:text-zinc-100"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
