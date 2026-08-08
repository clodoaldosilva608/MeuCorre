"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { db } from "@/lib/db";

// ===== Hook de sincronização entre dispositivos =====
//
// Quando o usuário está logado, sincroniza corridas e despesas
// entre o IndexedDB local e o servidor (Supabase Postgres).
//
// Fluxo:
// 1. Ao montar, busca /api/auth/me pra ver se está logado
// 2. Se logado, faz GET /api/sync?since=lastSync pra baixar mudanças
//    - Importa mudanças do servidor pro IndexedDB (respeitando last-write-wins)
// 3. Quando local muda (add/update/delete), faz POST /api/sync em background
// 4. Repete a cada 60s (polling leve)

const LAST_SYNC_KEY = "meucorre_last_sync";
const SYNC_INTERVAL_MS = 60 * 1000; // 1 min

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "not-logged-in" | "error";

interface SyncedDeliveryFromServer {
  id: string;
  localId: number;
  app: string;
  value: number;
  km: number;
  date: string;
  timestamp: number;
  notes: string | null;
  updatedAt: number;
  deleted: boolean;
}

interface SyncedExpenseFromServer {
  id: string;
  localId: number;
  category: string;
  value: number;
  description: string | null;
  date: string;
  timestamp: number;
  updatedAt: number;
  deleted: boolean;
}

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSync, setLastSync] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const syncingRef = useRef(false);

  // Carrega lastSync do localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    if (stored) setLastSync(Number(stored));
  }, []);

  // Verifica se está logado
  const checkAuth = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      return data.user?.id ?? null;
    } catch {
      return null;
    }
  }, []);

  // Baixa mudanças do servidor
  const pull = useCallback(async (uid: string) => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setStatus("syncing");

    try {
      const res = await fetch(`/api/sync?since=${lastSync}`);
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const data = await res.json();

      // Importa corridas do servidor pro IndexedDB
      if (data.deliveries && data.deliveries.length > 0) {
        for (const d of data.deliveries as SyncedDeliveryFromServer[]) {
          // Busca local pelo localId
          const local = await db.deliveries.get(d.localId);
          if (d.deleted) {
            // Soft delete no servidor → remove do local
            if (local) await db.deliveries.delete(d.localId);
          } else if (!local) {
            // Não existe local → importa do servidor
            await db.deliveries.put({
              id: d.localId,
              app: d.app,
              value: d.value,
              km: d.km,
              date: d.date,
              timestamp: d.timestamp,
              notes: d.notes ?? undefined,
            });
          }
          // Se existe local e servidor é mais recente, atualiza
          else if (local.timestamp < d.timestamp) {
            await db.deliveries.put({
              id: d.localId,
              app: d.app,
              value: d.value,
              km: d.km,
              date: d.date,
              timestamp: d.timestamp,
              notes: d.notes ?? undefined,
            });
          }
        }
      }

      // Importa despesas do servidor
      if (data.expenses && data.expenses.length > 0) {
        for (const e of data.expenses as SyncedExpenseFromServer[]) {
          const local = await db.expenses.get(e.localId);
          if (e.deleted) {
            if (local) await db.expenses.delete(e.localId);
          } else if (!local) {
            await db.expenses.put({
              id: e.localId,
              category: e.category as never,
              value: e.value,
              description: e.description ?? undefined,
              date: e.date,
              timestamp: e.timestamp,
            });
          } else if (local.timestamp < e.timestamp) {
            await db.expenses.put({
              id: e.localId,
              category: e.category as never,
              value: e.value,
              description: e.description ?? undefined,
              date: e.date,
              timestamp: e.timestamp,
            });
          }
        }
      }

      // Atualiza lastSync
      const newLastSync = data.latestUpdatedAt ?? Date.now();
      setLastSync(newLastSync);
      localStorage.setItem(LAST_SYNC_KEY, String(newLastSync));
      setStatus("synced");
    } catch {
      setStatus("offline");
    } finally {
      syncingRef.current = false;
    }
  }, [lastSync]);

  // Envia mudanças locais pro servidor
  const push = useCallback(async () => {
    if (!userId) return;
    if (syncingRef.current) return;
    syncingRef.current = true;
    setStatus("syncing");

    try {
      // Pega todas as corridas locais e envia
      const localDeliveries = await db.deliveries.toArray();
      const deliveriesPayload = localDeliveries.map((d) => ({
        localId: d.id!,
        app: d.app,
        value: d.value,
        km: d.km,
        date: d.date,
        timestamp: d.timestamp,
        notes: d.notes ?? null,
        updatedAt: d.timestamp, // usa timestamp como updatedAt (simplificação)
        deleted: false,
      }));

      const localExpenses = await db.expenses.toArray();
      const expensesPayload = localExpenses.map((e) => ({
        localId: e.id!,
        category: e.category,
        value: e.value,
        description: e.description ?? null,
        date: e.date,
        timestamp: e.timestamp,
        updatedAt: e.timestamp,
        deleted: false,
      }));

      // Envia em batches (máx 500 por tipo)
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveries: deliveriesPayload,
          expenses: expensesPayload,
        }),
      });

      if (res.ok) {
        setStatus("synced");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("offline");
    } finally {
      syncingRef.current = false;
    }
  }, [userId]);

  // Sincronização inicial + polling
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const init = async () => {
      const uid = await checkAuth();
      if (cancelled) return;

      if (!uid) {
        setStatus("not-logged-in");
        return;
      }

      setUserId(uid);
      // Primeiro baixa (importa mudanças de outros dispositivos)
      await pull(uid);
      // Depois envia (envia mudanças locais)
      await push();
    };

    init();

    // Polling a cada 60s
    const interval = setInterval(async () => {
      const uid = await checkAuth();
      if (uid && !cancelled) {
        await pull(uid);
      }
    }, SYNC_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [checkAuth, pull, push]);

  // Sincroniza após lançar/editar/excluir (chamado externamente)
  const syncNow = useCallback(async () => {
    const uid = await checkAuth();
    if (!uid) {
      setStatus("not-logged-in");
      return;
    }
    setUserId(uid);
    await push();
  }, [checkAuth, push]);

  return { status, lastSync, syncNow };
}
