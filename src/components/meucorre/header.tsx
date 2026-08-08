"use client";

import { useEffect, useState } from "react";
import { formatShortDate } from "@/lib/apps";
import { Download, Trash2, Bell, Grid3x3 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

// Cabeçalho fixo no topo: logo ⚡ MeuCorre + data + menu de ações.
export function Header({
  onExportJSON,
  onExportCSV,
  onClearAll,
  onOpenApps,
  onOpenCapture,
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
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-xl">
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

        <div className="flex items-center gap-1.5">
          <span
            suppressHydrationWarning
            className="hidden min-w-[80px] rounded-full bg-zinc-800 px-2.5 py-1 text-center text-[11px] font-medium capitalize text-zinc-400 sm:inline"
          >
            {dateStr || "\u00A0"}
          </span>

          {/* Capturar por notificação */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenCapture}
            aria-label="Capturar por notificação"
            className="h-8 w-8 rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400"
          >
            <Bell className="h-4 w-4" />
          </Button>

          {/* Gerenciar apps */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenApps}
            aria-label="Gerenciar apps de entrega"
            className="h-8 w-8 rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>

          {/* Menu de backup */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                aria-label="Menu de ações"
              >
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 border-zinc-800 bg-zinc-900 text-zinc-200"
            >
              <DropdownMenuLabel className="text-xs text-zinc-500">
                Backup / Dados
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                onClick={onExportJSON}
                className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-100"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar JSON
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onExportCSV}
                className="cursor-pointer focus:bg-zinc-800 focus:text-zinc-100"
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                onClick={onClearAll}
                className="cursor-pointer text-red-400 focus:bg-red-950/40 focus:text-red-300"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Apagar tudo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
