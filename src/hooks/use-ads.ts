"use client";

import { useEffect, useState, useCallback } from "react";

export interface AdData {
  id: string;
  title: string;
  description: string | null;
  cta: string;
  url: string | null;
  imageUrl: string | null;
  bgColor: string;
  textColor: string;
  placement: "banner_top" | "card_list" | "splash";
}

const STORAGE_KEY = "meucorre_license";

// Hook que carrega anúncios da API pública e filtra por placement.
// Em PRO, retorna [] (sem anúncios).
export function useAds(placement: AdData["placement"]) {
  const [ads, setAds] = useState<AdData[]>([]);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pro = await checkProStatus();
      if (cancelled) return;
      setIsPro(pro);
      if (pro) {
        setAds([]);
        return;
      }
      try {
        const res = await fetch(`/api/ads?placement=${placement}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setAds(data.ads ?? []);
      } catch {
        // offline: não mostra anúncios
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [placement]);

  const clickAd = useCallback(async (ad: AdData) => {
    try {
      const res = await fetch(`/api/ads/${ad.id}/click`, { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch {
      // ignore
    }
  }, []);

  return { ads, isPro, clickAd };
}

// Verifica se o device tem licença PRO ativa.
// A licença é guardada no localStorage (string). Verificada contra a API.
export async function checkProStatus(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const license = localStorage.getItem(STORAGE_KEY);
  if (!license) return false;

  try {
    const res = await fetch("/api/license/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey: license }),
    });
    const data = await res.json();
    return data.pro === true;
  } catch {
    // Se offline, confia no cache local (otimista)
    return true;
  }
}

// Ativa uma licença digitada pelo usuário.
// Retorna true se válida.
export async function activateLicense(
  licenseKey: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/license/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey }),
    });
    const data = await res.json();
    if (data.pro) {
      localStorage.setItem(STORAGE_KEY, licenseKey);
      return { ok: true };
    }
    return { ok: false, error: "Licença inválida ou não aprovada" };
  } catch {
    return { ok: false, error: "Erro de conexão" };
  }
}

export function deactivateLicense() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getStoredLicense(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}
