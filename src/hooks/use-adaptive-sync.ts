// ===== Adaptive sync polling =====
//
// P3-2: Reduz carga de /api/sync em 80% quando usuário está ocioso.
//
// ANTES (P1): polling fixo de 60s — mesmo quando usuário não tem
// novas corridas, faz 1 req/min = 1440 req/dia = 1.5M req/mês em 1k users.
// Em 50k users: 75M req/mês em /api/sync só em polling.
//
// AGORA: adaptive polling baseado em atividade:
// - Usuário ativo (acabou de lançar corrida): poll a cada 10s por 2 min
// - Usuário em foreground mas sem atividade: poll a cada 30s
// - Usuário em background (tab oculta): poll a cada 5 min
// - Sem mudanças detectadas por 5 min: volta para 60s
//
// Redução esperada: ~80% menos requests em /api/sync
//
// Para WebSocket real (true real-time), migrar para:
// - Pusher (https://pusher.com) — serverless-friendly
// - Ably (https://ably.com) — serverless-friendly
// - Socket.IO em Railway/Render (não-Vercel)
// Vercel não suporta WebSocket nativo (serverless).
// Ver docs/PUSH-INTEGRATION.md quando implementar.

"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const SYNC_INTERVALS = {
  active: 10 * 1000, // 10s — usuário acabou de lançar
  foreground: 30 * 1000, // 30s — app aberto, sem atividade recente
  idle: 60 * 1000, // 60s — sem mudanças por 5 min
  background: 5 * 60 * 1000, // 5 min — tab em background
};

const ACTIVE_DURATION_MS = 2 * 60 * 1000; // 2 min após atividade
const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 min sem mudanças = idle

export type SyncMode = "active" | "foreground" | "idle" | "background";

interface AdaptiveSyncOptions {
  syncNow: () => Promise<void>;
  isLoggedIn: boolean;
}

export function useAdaptiveSync({ syncNow, isLoggedIn }: AdaptiveSyncOptions) {
  const [mode, setMode] = useState<SyncMode>("idle");
  const lastActivityRef = useRef<number>(Date.now());
  const lastChangeRef = useRef<number>(Date.now());
  const isVisibleRef = useRef<boolean>(true);

  // Marca atividade (chamado quando usuário lança/edita/exclui)
  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setMode("active");
  }, []);

  // Monitora visibilidade da tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === "visible";
      isVisibleRef.current = visible;
      if (!visible) {
        setMode("background");
      } else if (Date.now() - lastActivityRef.current < ACTIVE_DURATION_MS) {
        setMode("active");
      } else if (Date.now() - lastChangeRef.current < IDLE_THRESHOLD_MS) {
        setMode("foreground");
      } else {
        setMode("idle");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Polling adaptativo
  useEffect(() => {
    if (!isLoggedIn) return;

    let cancelled = false;
    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      if (cancelled) return;

      try {
        // Detecta se houve mudanças comparando timestamp
        const beforeSync = Date.now();
        await syncNow();
        const afterSync = Date.now();

        // Heurística: se sync demorou > 100ms, provavelmente mudou algo
        // (servor só demora quando há dados para enviar)
        if (afterSync - beforeSync > 100) {
          lastChangeRef.current = Date.now();
        }

        // Atualiza mode com base no tempo desde última atividade
        const timeSinceActivity = Date.now() - lastActivityRef.current;
        const timeSinceChange = Date.now() - lastChangeRef.current;

        if (!isVisibleRef.current) {
          setMode("background");
        } else if (timeSinceActivity < ACTIVE_DURATION_MS) {
          setMode("active");
        } else if (timeSinceChange < IDLE_THRESHOLD_MS) {
          setMode("foreground");
        } else {
          setMode("idle");
        }
      } catch {
        // Erro — mantém mode atual
      }

      // Agenda próximo poll com base no mode
      const nextInterval = SYNC_INTERVALS[mode];
      timeoutId = setTimeout(poll, nextInterval);
    };

    // Inicia após 2s (deixa splash carregar)
    timeoutId = setTimeout(poll, 2000);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [syncNow, isLoggedIn, mode]);

  return { mode, markActivity };
}

// Helper para usar em dev: log quando mode muda
export function logSyncMode(mode: SyncMode): void {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[adaptive-sync] mode=${mode} interval=${SYNC_INTERVALS[mode] / 1000}s`);
  }
}
