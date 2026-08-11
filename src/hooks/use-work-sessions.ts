"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useState, useRef } from "react";
import { db } from "@/lib/db";
import { haversineKm } from "@/lib/apps";
import type { WorkSession } from "@/lib/types";

function useDbVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const handler = () => setVersion((v) => v + 1);
    window.addEventListener("meucorre-db-switched", handler);
    return () => window.removeEventListener("meucorre-db-switched", handler);
  }, []);
  return version;
}

export interface UseWorkSessionsReturn {
  activeSession: WorkSession | null;
  liveDurationMs: number;
  liveDistanceKm: number;
  gpsError: string | null;
  startSession: () => Promise<void>;
  stopSession: (notes?: string) => Promise<void>;
  cancelSession: () => Promise<void>;
  sessions: WorkSession[];
  deleteSession: (id: number) => Promise<void>;
}

export function useWorkSessions(): UseWorkSessionsReturn {
  const dbVersion = useDbVersion();

  const watchIdRef = useRef<number | null>(null);
  const lastPointRef = useRef<{ lat: number; lon: number } | null>(null);
  const totalDistanceRef = useRef(0);
  const pointCountRef = useRef(0);
  const activeSessionIdRef = useRef<number | null>(null);

  const sessions = useLiveQuery(
    async () => {
      try {
        return await db.workSessions.orderBy("startTime").reverse().toArray();
      } catch {
        return [] as WorkSession[];
      }
    },
    [dbVersion],
    [] as WorkSession[],
  );

  const activeSession = sessions.find((s) => s.endTime === null) ?? null;

  // Cronômetro em tempo real (atualiza a cada segundo via setInterval).
  // Não há set-state-in-effect: o setState acontece dentro do callback do
  // setInterval, que é assíncrono por natureza.
  const [liveDurationMs, setLiveDurationMs] = useState(0);
  useEffect(() => {
    if (!activeSession) {
      // Defer para evitar set-state-in-effect
      const t = setTimeout(() => setLiveDurationMs(0), 0);
      return () => clearTimeout(t);
    }
    const tick = () => {
      if (activeSession.startTime) {
        setLiveDurationMs(Date.now() - activeSession.startTime);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Distância ao vivo — atualizada quando a sessão muda (lazy initializer via
  // key prop no componente pai) e quando GPS captura novos pontos.
  const [liveDistanceKm, setLiveDistanceKm] = useState(0);

  // Sincroniza refs quando a sessão ativa muda.
  // Usa um efeito com dependência explícita no ID da sessão.
  useEffect(() => {
    if (activeSession) {
      activeSessionIdRef.current = activeSession.id ?? null;
      totalDistanceRef.current = activeSession.distanceKm;
      pointCountRef.current = activeSession.pointCount;
      lastPointRef.current = null;
      // Defer para evitar set-state-in-effect (regra react-hooks)
      const t = setTimeout(() => setLiveDistanceKm(activeSession.distanceKm), 0);
      return () => clearTimeout(t);
    } else {
      activeSessionIdRef.current = null;
      totalDistanceRef.current = 0;
      pointCountRef.current = 0;
      lastPointRef.current = null;
      const t = setTimeout(() => setLiveDistanceKm(0), 0);
      return () => clearTimeout(t);
    }
  }, [activeSession?.id]);

  // GPS tracking — só ativo quando há sessão ativa.
  // Estado de erro é resetado via setTimeout para evitar set-state-in-effect.
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSession) {
      // Limpa erro quando não há sessão ativa (defer para evitar set-state-in-effect)
      const t = setTimeout(() => setGpsError(null), 0);
      return () => clearTimeout(t);
    }
    if (typeof window === "undefined" || !navigator.geolocation) {
      const t = setTimeout(
        () => setGpsError("GPS não disponível neste dispositivo"),
        0,
      );
      return () => clearTimeout(t);
    }

    const MIN_ACCURACY_M = 100;
    const MIN_DELTA_KM = 0.005;

    const onSuccess = (pos: GeolocationPosition) => {
      if (!activeSessionIdRef.current) return;
      if (pos.coords.accuracy > MIN_ACCURACY_M) return;

      const { latitude, longitude } = pos.coords;

      if (lastPointRef.current) {
        const delta = haversineKm(
          lastPointRef.current.lat,
          lastPointRef.current.lon,
          latitude,
          longitude,
        );
        if (delta < MIN_DELTA_KM) return;
        totalDistanceRef.current += delta;
      }
      lastPointRef.current = { lat: latitude, lon: longitude };
      pointCountRef.current += 1;

      setLiveDistanceKm(totalDistanceRef.current);
      const sessionId = activeSessionIdRef.current;
      if (sessionId) {
        db.workSessions
          .update(sessionId, {
            distanceKm: parseFloat(totalDistanceRef.current.toFixed(2)),
            pointCount: pointCountRef.current,
          })
          .catch(() => {});
      }
    };

    const onError = (err: GeolocationPositionError) => {
      if (err.code === err.PERMISSION_DENIED) {
        setGpsError("Permissão de localização negada. Toque no ícone de cadeado do navegador para permitir.");
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setGpsError("Localização indisponível. Verifique se o GPS está ligado.");
      }
    };

    const id = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    });
    watchIdRef.current = id;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [activeSession?.id]);

  const startSession = useCallback(async () => {
    if (activeSession) return;
    const now = Date.now();
    const id = await db.workSessions.add({
      startTime: now,
      endTime: null,
      durationMs: 0,
      distanceKm: 0,
      pointCount: 0,
    });
    activeSessionIdRef.current = id as number;
    totalDistanceRef.current = 0;
    pointCountRef.current = 0;
    lastPointRef.current = null;
    setGpsError(null);
    setLiveDistanceKm(0);
    setLiveDurationMs(0);
  }, [activeSession]);

  const stopSession = useCallback(
    async (notes?: string) => {
      if (!activeSessionIdRef.current) return;
      const endTime = Date.now();
      const sessionId = activeSessionIdRef.current;

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      await db.workSessions.update(sessionId, {
        endTime,
        durationMs: endTime - (activeSession?.startTime ?? endTime),
        distanceKm: parseFloat(totalDistanceRef.current.toFixed(2)),
        pointCount: pointCountRef.current,
        notes: notes?.trim() || undefined,
      });

      activeSessionIdRef.current = null;
      totalDistanceRef.current = 0;
      pointCountRef.current = 0;
      lastPointRef.current = null;
      setLiveDistanceKm(0);
      setLiveDurationMs(0);
    },
    [activeSession],
  );

  const cancelSession = useCallback(async () => {
    if (!activeSessionIdRef.current) return;
    const sessionId = activeSessionIdRef.current;

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    await db.workSessions.delete(sessionId);
    activeSessionIdRef.current = null;
    totalDistanceRef.current = 0;
    pointCountRef.current = 0;
    lastPointRef.current = null;
    setLiveDistanceKm(0);
    setLiveDurationMs(0);
    setGpsError(null);
  }, []);

  const deleteSession = useCallback(async (id: number) => {
    await db.workSessions.delete(id);
  }, []);

  return {
    activeSession,
    liveDurationMs,
    liveDistanceKm,
    gpsError,
    startSession,
    stopSession,
    cancelSession,
    sessions,
    deleteSession,
  };
}
