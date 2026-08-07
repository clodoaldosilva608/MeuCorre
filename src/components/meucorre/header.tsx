"use client";

import { formatShortDate } from "@/lib/apps";
import { Download, Trash2 } from "lucide-react";
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
}

// Cabeçalho fixo no topo: logo ⚡ MeuCorre + data + menu de ações.
export function Header({ onExportJSON, onExportCSV, onClearAll }: HeaderProps) {
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

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-[11px] font-medium capitalize text-zinc-400">
            {formatShortDate()}
          </span>
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
