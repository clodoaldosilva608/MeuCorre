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
  Menu,
  Cloud,
  Smartphone,
  User,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { InstallAppPopup } from "@/components/meucorre/install-app-popup";

interface HeaderProps {
  onExportJSON: () => void;
  onExportCSV: () => void;
  onClearAll: () => void;
  onOpenApps: () => void;
  onOpenCapture: () => void;
  onOpenLicense: () => void;
  onOpenShare: () => void;
  onOpenOnboarding?: () => void;
  onLogout: () => void;
  isPro: boolean;
  syncStatus?: "idle" | "syncing" | "synced" | "offline" | "not-logged-in" | "error";
}

// Cabeçalho fixo no topo: logo ⚡ MeuCorre + data + botão de menu lateral.
// Em PRO, mostra badge "PRO" no lugar do botão de licença.
//
// Mobile UX: TODAS as ações (notificação, apps, share, exportar, apagar,
// sair) estão dentro de um menu lateral (Sheet) aberto pelo botão hambúrguer.
// Antes, esses botões ficavam escondidos no mobile (sm:inline-flex) e o
// usuário não conseguia acessá-los. Agora são sempre acessíveis.
export function Header({
  onExportJSON,
  onExportCSV,
  onClearAll,
  onOpenApps,
  onOpenCapture,
  onOpenLicense,
  onOpenShare,
  onOpenOnboarding,
  onLogout,
  isPro,
  syncStatus,
}: HeaderProps) {
  const [dateStr, setDateStr] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);

  useEffect(() => {
    // Padrão legítimo de "render-after-mount" para evitar hydration mismatch
    // de datas (servidor UTC vs cliente no fuso local do entregador).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDateStr(formatShortDate());
  }, []);

  // Helper para fechar o menu após executar uma ação
  const run = (fn: () => void) => () => {
    setMenuOpen(false);
    fn();
  };

  const syncLabel =
    syncStatus === "syncing"
      ? "Sincronizando..."
      : syncStatus === "synced"
        ? "Dados sincronizados"
        : syncStatus === "offline"
          ? "Offline — dados salvos localmente"
          : syncStatus === "error"
            ? "Erro de sincronização"
            : syncStatus === "not-logged-in"
              ? "Não logado — sem sync"
              : "";

  return (
    <header className="header-premium sticky top-0 z-40">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <img
              src="/logo-meucorre.png"
              alt="MeuCorre"
              className="h-10 w-10 rounded-xl object-contain shadow-lg shadow-emerald-500/20"
            />
            <div className="leading-none">
              <h1 className="text-lg font-extrabold tracking-tight text-gradient-premium">
                MeuCorre
              </h1>
              <p className="text-[10px] font-medium text-zinc-500">
                Gestão de Entregas
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Data — visível apenas em telas maiores */}
          <span
            suppressHydrationWarning
            className="hidden min-w-[80px] rounded-full bg-white/5 px-2.5 py-1 text-center text-[11px] font-medium capitalize text-zinc-400 sm:inline border border-white/5"
          >
            {dateStr || "\u00A0"}
          </span>

          {/* Theme toggle — sempre visível */}
          <ThemeToggle />

          {/* Indicador de sincronização — sempre visível (compacto) */}
          {syncStatus && syncStatus !== "not-logged-in" && syncStatus !== "idle" && (
            <span
              className="flex items-center gap-0.5 text-[9px] font-medium"
              title={syncLabel}
            >
              {syncStatus === "syncing" && (
                <span className="flex items-center gap-0.5 text-blue-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                  <span className="hidden sm:inline">sync</span>
                </span>
              )}
              {syncStatus === "synced" && (
                <span className="flex items-center gap-0.5 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="hidden sm:inline">sync</span>
                </span>
              )}
              {(syncStatus === "offline" || syncStatus === "error") && (
                <span className="flex items-center gap-0.5 text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span className="hidden sm:inline">sync</span>
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

          {/* ===== Menu lateral (Sheet) — TODAS as ações ===== */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Menu de ações"
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground dark:text-zinc-400 hover:bg-muted dark:bg-zinc-800 hover:text-foreground dark:text-zinc-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <SheetContent
              side="right"
              className="w-72 border-border dark:border-zinc-800 bg-background dark:bg-zinc-950 p-0"
            >
              <SheetHeader className="border-b border-border dark:border-zinc-800 px-5 py-4">
                <SheetTitle className="text-sm font-bold text-foreground dark:text-zinc-100">
                  Menu
                </SheetTitle>
                <SheetDescription className="text-[11px] text-muted-foreground dark:text-zinc-500">
                  Ações e configurações
                </SheetDescription>
              </SheetHeader>

              <nav className="flex flex-col gap-1 overflow-y-auto p-3">
                {/* Capturar por notificação */}
                <button
                  type="button"
                  onClick={run(onOpenCapture)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground/90 dark:text-zinc-200 hover:bg-muted dark:bg-zinc-800/50"
                >
                  <Bell className="h-4 w-4 text-muted-foreground dark:text-zinc-400" />
                  Capturar por notificação
                </button>

                {/* Gerenciar apps */}
                <button
                  type="button"
                  onClick={run(onOpenApps)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground/90 dark:text-zinc-200 hover:bg-muted dark:bg-zinc-800/50"
                >
                  <Grid3x3 className="h-4 w-4 text-muted-foreground dark:text-zinc-400" />
                  Gerenciar apps de entrega
                </button>

                {/* Compartilhar */}
                <button
                  type="button"
                  onClick={run(onOpenShare)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground/90 dark:text-zinc-200 hover:bg-muted dark:bg-zinc-800/50"
                >
                  <Share2 className="h-4 w-4 text-muted-foreground dark:text-zinc-400" />
                  Compartilhar com amigos
                </button>

                {/* Separador */}
                <div className="my-1 border-t border-border dark:border-zinc-800" />

                {/* Sub-menu Exportar (JSON/CSV) usando DropdownMenu aninhado
                    seria ideal, mas para simplicidade mobile usamos botões
                    diretos lado a lado. */}
                <div className="px-3 py-1.5">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground dark:text-zinc-500">
                    <Download className="h-3 w-3" />
                    Backup / Dados
                  </p>
                </div>

                <button
                  type="button"
                  onClick={run(onExportJSON)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground/90 dark:text-zinc-200 hover:bg-muted dark:bg-zinc-800/50"
                >
                  <Download className="h-4 w-4 text-muted-foreground dark:text-zinc-400" />
                  Exportar JSON
                </button>

                <button
                  type="button"
                  onClick={run(onExportCSV)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground/90 dark:text-zinc-200 hover:bg-muted dark:bg-zinc-800/50"
                >
                  <Download className="h-4 w-4 text-muted-foreground dark:text-zinc-400" />
                  Exportar CSV
                </button>

                {/* Apagar tudo — ação destrutiva */}
                <button
                  type="button"
                  onClick={run(onClearAll)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-400 hover:bg-red-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                  Apagar tudo
                </button>

                {/* Separador */}
                <div className="my-1 border-t border-border dark:border-zinc-800" />

                {/* Meu Perfil */}
                <a
                  href="/app/perfil"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground/90 dark:text-zinc-200 hover:bg-muted dark:bg-zinc-800/50"
                >
                  <User className="h-4 w-4 text-muted-foreground dark:text-zinc-400" />
                  Meu Perfil
                </a>

                {/* Tutorial / Onboarding (reabrir) */}
                {onOpenOnboarding && (
                  <button
                    type="button"
                    onClick={run(onOpenOnboarding)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground/90 dark:text-zinc-200 hover:bg-muted dark:bg-zinc-800/50"
                  >
                    <HelpCircle className="h-4 w-4 text-muted-foreground dark:text-zinc-400" />
                    Tutorial do app
                  </button>
                )}

                {/* Baixar aplicativo (PWA install) */}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setInstallOpen(true);
                  }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground/90 dark:text-zinc-200 hover:bg-muted dark:bg-zinc-800/50"
                >
                  <Smartphone className="h-4 w-4 text-muted-foreground dark:text-zinc-400" />
                  Baixar aplicativo
                </button>

                {/* Sair */}
                <button
                  type="button"
                  onClick={run(onLogout)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground/90 dark:text-zinc-200 hover:bg-muted dark:bg-zinc-800/50"
                >
                  <LogOut className="h-4 w-4 text-muted-foreground dark:text-zinc-400" />
                  Sair da conta
                </button>
              </nav>

              {/* Status de sync no rodapé do menu */}
              {syncLabel && (
                <div className="mt-auto border-t border-border dark:border-zinc-800 px-4 py-3">
                  <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground dark:text-zinc-500">
                    <Cloud className="h-3 w-3" />
                    {syncLabel}
                  </p>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Pop-up "Baixar aplicativo" — aberto manualmente via menu lateral.
          (A versão auto-aberta em 3.5s é renderizada no app/page.tsx.) */}
      <InstallAppPopup
        forceOpen={installOpen}
        onForceClose={() => setInstallOpen(false)}
      />
    </header>
  );
}
