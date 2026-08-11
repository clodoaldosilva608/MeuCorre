"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Play, Square, MapPin, Clock, Route, AlertTriangle, X, History } from "lucide-react";
import { formatDuration, formatKm } from "@/lib/apps";
import type { WorkSession } from "@/lib/types";

interface CorreDoDiaProps {
  activeSession: WorkSession | null;
  liveDurationMs: number;
  liveDistanceKm: number;
  gpsError: string | null;
  sessions: WorkSession[];
  onStart: () => Promise<void>;
  onStop: (notes?: string) => Promise<void>;
  onCancel: () => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function CorreDoDia({
  activeSession,
  liveDurationMs,
  liveDistanceKm,
  gpsError,
  sessions,
  onStart,
  onStop,
  onCancel,
  onDelete,
}: CorreDoDiaProps) {
  const [confirmStop, setConfirmStop] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const finishedSessions = useMemo(
    () => sessions.filter((s) => s.endTime !== null),
    [sessions],
  );

  const todaySessions = useMemo(() => {
    const today = new Date().toDateString();
    return finishedSessions.filter(
      (s) => new Date(s.startTime).toDateString() === today,
    );
  }, [finishedSessions]);

  const todayTotalKm = todaySessions.reduce((s, x) => s + x.distanceKm, 0);
  const todayTotalMs = todaySessions.reduce((s, x) => s + x.durationMs, 0);

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground/80 dark:text-zinc-300">
          <Route className="h-4 w-4 text-emerald-400" />
          Corre do dia
        </h3>
        {finishedSessions.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/10"
          >
            <History className="h-3 w-3" />
            {showHistory ? "Ocultar" : "Histórico"}
          </button>
        )}
      </div>

      <div className={`relative overflow-hidden rounded-2xl border p-4 transition-colors ${
        activeSession
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-border dark:border-zinc-800 bg-card dark:bg-zinc-900"
      }`}>
        {activeSession && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent" />
        )}

        <div className="relative">
          {activeSession ? (
            <>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Em andamento
                </span>
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="text-[10px] font-semibold text-zinc-500 hover:text-red-400"
                >
                  Cancelar
                </button>
              </div>

              <div className="mt-3 text-center">
                <p className="font-mono text-4xl font-black tabular-nums text-foreground dark:text-white">
                  {formatDuration(liveDurationMs)}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground dark:text-zinc-500">
                  Tempo trabalhado
                </p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted dark:bg-zinc-800/50 p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-emerald-400">
                    <MapPin className="h-3 w-3" />
                    <span className="font-mono text-lg font-bold">
                      {liveDistanceKm.toFixed(1).replace(".", ",")}
                    </span>
                    <span className="text-[10px]">km</span>
                  </div>
                  <p className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground dark:text-zinc-500">
                    Distância
                  </p>
                </div>
                <div className="rounded-lg bg-muted dark:bg-zinc-800/50 p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-400">
                    <MapPin className="h-3 w-3" />
                    <span className="font-mono text-lg font-bold">
                      {activeSession.pointCount}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground dark:text-zinc-500">
                    Pontos GPS
                  </p>
                </div>
              </div>

              {gpsError && (
                <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-500/10 p-2 text-[10px] text-amber-500">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>{gpsError}</span>
                </div>
              )}

              <Button
                onClick={() => setConfirmStop(true)}
                className="mt-3 w-full bg-red-500 text-white hover:bg-red-600"
              >
                <Square className="mr-1.5 h-4 w-4" />
                Finalizar corre
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-500/15">
                  <Route className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground dark:text-zinc-100">
                    Rastreie sua jornada
                  </p>
                  <p className="text-[11px] text-muted-foreground dark:text-zinc-500">
                    Cronômetro + GPS: tempo e km percorridos
                  </p>
                </div>
              </div>

              {todaySessions.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border dark:border-zinc-800 pt-3">
                  <div className="text-center">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground dark:text-zinc-500">
                      Corres hoje
                    </p>
                    <p className="text-sm font-bold text-foreground dark:text-zinc-100">
                      {todaySessions.length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground dark:text-zinc-500">
                      Tempo total
                    </p>
                    <p className="text-sm font-bold text-foreground dark:text-zinc-100">
                      {formatDuration(todayTotalMs)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground dark:text-zinc-500">
                      Km total
                    </p>
                    <p className="text-sm font-bold text-foreground dark:text-zinc-100">
                      {todayTotalKm.toFixed(1).replace(".", ",")}
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={onStart}
                className="mt-3 w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
              >
                <Play className="mr-1.5 h-4 w-4" />
                Iniciar corre
              </Button>

              <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground dark:text-zinc-500">
                <MapPin className="h-2.5 w-2.5" />
                Vamos pedir permissão de localização
              </p>
            </>
          )}
        </div>
      </div>

      {showHistory && finishedSessions.length > 0 && (
        <div className="space-y-1.5">
          {finishedSessions.slice(0, 10).map((s) => (
            <HistoryRow key={s.id} session={s} onDelete={() => onDelete(s.id!)} />
          ))}
        </div>
      )}

      <AlertDialog open={confirmStop} onOpenChange={setConfirmStop}>
        <AlertDialogContent className="border-border dark:border-zinc-800 bg-background dark:bg-zinc-950 text-foreground dark:text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar corre?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground dark:text-zinc-400">
              Sua sessão será salva no histórico com:
              <br />
              • Duração: <strong className="text-zinc-200">{formatDuration(liveDurationMs)}</strong>
              <br />
              • Distância: <strong className="text-zinc-200">{formatKm(liveDistanceKm)}</strong>
              <br />
              • Pontos GPS: <strong className="text-zinc-200">{activeSession?.pointCount ?? 0}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Continuar correndo
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onStop()}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent className="border-border dark:border-zinc-800 bg-background dark:bg-zinc-950 text-foreground dark:text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar corre?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground dark:text-zinc-400">
              A sessão será descartada e os dados não serão salvos.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onCancel()}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function HistoryRow({
  session,
  onDelete,
}: {
  session: WorkSession;
  onDelete: () => void;
}) {
  const date = new Date(session.startTime);
  const dateStr = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border dark:border-zinc-800 bg-card dark:bg-zinc-900 p-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted dark:bg-zinc-800">
        <Route className="h-4 w-4 text-emerald-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-foreground dark:text-zinc-100">
          {dateStr} • {timeStr}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground dark:text-zinc-500">
          <span className="flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {formatDuration(session.durationMs)}
          </span>
          <span>•</span>
          <span className="flex items-center gap-0.5">
            <MapPin className="h-2.5 w-2.5" />
            {formatKm(session.distanceKm)}
          </span>
          <span>•</span>
          <span>{session.pointCount} pts</span>
        </div>
      </div>
      <button
        onClick={onDelete}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 hover:bg-red-950/40 hover:text-red-400"
        aria-label="Excluir sessão"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
