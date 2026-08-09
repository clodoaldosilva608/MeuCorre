"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { db, switchDb } from "@/lib/db";

// ===== Hook de sincronização entre dispositivos =====
//
// CORREÇÃO v2: após pull, força reload dos dados via evento customizado
// que o useLiveQuery detecta. Também garante que o DB está aberto antes
// de fazer put.

const LAST_SYNC_KEY = "meucorre_last_sync";
const SYNC_INTERVAL_MS = 60 * 1000;

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "not-logged-in" | "error";

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSync, setLastSync] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0); // incrementa pra forçar reload
  const syncingRef = useRef(false);
  const uidRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    if (stored) setLastSync(Number(stored));
  }, []);

  // Baixa mudanças do servidor (com paginação automática)
  const pull = useCallback(async (uid: string, since: number) => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setStatus("syncing");

    try {
      await db.open();

      // Se since=0 (primeira sincronização), limpa o DB local antes de importar
      // Isso garante que dados de outro usuário sejam removidos
      if (since === 0) {
        await db.deliveries.clear();
        await db.expenses.clear();
      }

      let currentSince = since;
      let hasChanges = false;
      let hasMore = true;

      // Loop de paginação — busca 100 por vez até não ter mais
      while (hasMore) {
        const res = await fetch(`/api/sync?since=${currentSince}`);
        if (!res.ok) {
          setStatus("error");
          return;
        }
        const data = await res.json();

        // Importa corridas
        if (data.deliveries && data.deliveries.length > 0) {
          for (const d of data.deliveries) {
            const local = await db.deliveries.get(d.localId);
            if (d.deleted) {
              if (local) {
                await db.deliveries.delete(d.localId);
                hasChanges = true;
              }
            } else if (!local || local.timestamp < d.timestamp) {
              await db.deliveries.put({
                id: d.localId,
                app: d.app,
                value: d.value,
                km: d.km,
                date: d.date,
                timestamp: d.timestamp,
                notes: d.notes ?? undefined,
              });
              hasChanges = true;
            }
          }
        }

        // Importa despesas
        if (data.expenses && data.expenses.length > 0) {
          for (const e of data.expenses) {
            const local = await db.expenses.get(e.localId);
            if (e.deleted) {
              if (local) {
                await db.expenses.delete(e.localId);
                hasChanges = true;
              }
            } else if (!local || local.timestamp < e.timestamp) {
              await db.expenses.put({
                id: e.localId,
                category: e.category,
                value: e.value,
                description: e.description ?? undefined,
                date: e.date,
                timestamp: e.timestamp,
              });
              hasChanges = true;
            }
          }
        }

        const newSince = data.latestUpdatedAt ?? Date.now();
        hasMore = data.hasMore === true;

        // Se não veio nada, para
        if (data.deliveries.length === 0 && data.expenses.length === 0) {
          hasMore = false;
        }

        // Safety: se latestUpdatedAt não avançou desde a última iteração, para
        if (newSince <= currentSince) {
          hasMore = false;
        }
        currentSince = newSince;
      }

      setLastSync(currentSince);
      localStorage.setItem(LAST_SYNC_KEY, String(currentSince));
      setStatus("synced");

      if (hasChanges) {
        setSyncVersion((v) => v + 1);
        window.dispatchEvent(new CustomEvent("meucorre-sync-complete"));
      }
    } catch {
      setStatus("offline");
    } finally {
      syncingRef.current = false;
    }
  }, []);

  // Envia mudanças locais pro servidor
  const push = useCallback(async (uid: string) => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setStatus("syncing");

    try {
      // CRÍTICO: Verifica se o DB ativo corresponde ao usuário da sessão.
      // Dupla verificação: (1) localStorage userId deve bater com o uid,
      // (2) o nome do DB ativo deve ser MeuCorreDB_<uid>.
      // Sem isso, acontece o race condition pós-login onde dados do
      // usuário anterior (DB ainda ativo) são enviados para o servidor
      // com o userId do novo usuário logado.
      const localStorageUserId = localStorage.getItem("meucorre_user_id");
      const expectedDbName = `MeuCorreDB_${uid}`;
      const activeDbName = db.name;
      if (localStorageUserId !== uid || activeDbName !== expectedDbName) {
        console.warn(
          "[sync] Abortando push: userId/DB não batem com sessão",
          { localStorageUserId, uid, activeDbName, expectedDbName },
        );
        setStatus("synced");
        return;
      }

      await db.open();

      const localDeliveries = await db.deliveries.toArray();
      const deliveriesPayload = localDeliveries.map((d) => ({
        localId: d.id!,
        app: d.app,
        value: d.value,
        km: d.km,
        date: d.date,
        timestamp: d.timestamp,
        notes: d.notes ?? null,
        updatedAt: d.timestamp,
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
  }, []);

  // Sincronização inicial + polling
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const init = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (cancelled) return;

        if (!data.user) {
          setStatus("not-logged-in");
          return;
        }

        const uid = data.user.id;
        uidRef.current = uid;
        setIsLoggedIn(true);

        // Garante que o DB ativo corresponde ao usuário logado
        const localStorageUserId = localStorage.getItem("meucorre_user_id");
        if (localStorageUserId !== uid) {
          // Verifica flag anti-loop no sessionStorage
          const switchFlag = sessionStorage.getItem("meucorre_db_switched");
          if (switchFlag !== uid) {
            console.log("[sync] Trocando DB para", uid);
            sessionStorage.setItem("meucorre_db_switched", uid);
            switchDb(uid);
            // Recarrega para que useLiveQuery re-inscreva no novo DB
            window.location.reload();
            return;
          }
          // Se já tentamos (flag existe), continua com o pull
          sessionStorage.removeItem("meucorre_db_switched");
        }

        // SÓ faz pull na inicialização (baixa dados do servidor)
        await pull(uid, 0);
      } catch {
        if (!cancelled) setStatus("offline");
      }
    };

    // Delay de 2s pra garantir que o componente montou e DB está pronto
    const timer = setTimeout(init, 500);

    // Polling a cada 60s
    const interval = setInterval(async () => {
      if (cancelled || !uidRef.current) return;
      const stored = localStorage.getItem(LAST_SYNC_KEY);
      const since = stored ? Number(stored) : 0;
      await pull(uidRef.current, since);
    }, SYNC_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [push, pull]);

  // Sincroniza agora (chamado após lançar/editar/excluir)
  const syncNow = useCallback(async () => {
    if (!uidRef.current) {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user) {
          uidRef.current = data.user.id;
          setIsLoggedIn(true);
        } else {
          setStatus("not-logged-in");
          return;
        }
      } catch {
        return;
      }
    }
    // CRÍTICO: dupla verificação antes de fazer push — userId do localStorage
    // E nome do DB ativo devem bater com a sessão atual. Previne race
    // condition pós-login onde dados do usuário anterior ainda estão no DB.
    const localStorageUserId = localStorage.getItem("meucorre_user_id");
    const expectedDbName = `MeuCorreDB_${uidRef.current}`;
    if (localStorageUserId !== uidRef.current || db.name !== expectedDbName) {
      console.warn("[syncNow] Abortando: userId/DB não batem com sessão", {
        localStorageUserId,
        uid: uidRef.current,
        activeDbName: db.name,
        expectedDbName,
      });
      return;
    }
    await push(uidRef.current!);
  }, [push]);

  return { status, lastSync, syncNow, isLoggedIn, syncVersion };
}
