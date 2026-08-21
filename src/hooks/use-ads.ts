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
//
// SEGURANÇA (P0-11 corrigido):
// Antes, se a chamada a /api/license/verify falhasse (rede bloqueada,
// adblocker, etc.), o catch retornava `true` — fail-open = PRO grátis
// + sem anúncios. Atacante simplesmente bloqueava a URL da API e
// recebia PRO sem pagar.
//
// Agora retorna `false` (fail-closed): se não conseguimos confirmar
// que a licença é válida, assumimos que NÃO é. Usuário offline com
// licença legítima paga perde acesso até voltar a ficar online —
// trade-off correto para evitar bypass.
//
// Bônus: TTL de 24h. Mesmo se a licença expirar/for reembolsada,
// dentro de 24h ainda funciona offline (UX aceitável para PRO).
export async function checkProStatus(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const license = localStorage.getItem(STORAGE_KEY);
  if (!license) return false;

  // TTL: se última verificação foi há menos de 24h, confia no cache local
  // (otimista, mas com janela limitada — depois expira)
  const TTL_MS = 24 * 60 * 60 * 1000; // 24h
  const lastCheck = localStorage.getItem("meucorre_license_last_check");
  if (lastCheck) {
    const elapsed = Date.now() - parseInt(lastCheck, 10);
    if (elapsed < TTL_MS) {
      // Dentro da janela de 24h — confia no cache local (otimista)
      // Mas ainda tenta verificar em background para invalidar cedo
      // se a licença foi revogada no servidor.
      // (Não esperamos — fire-and-forget.)
      fetch("/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: license }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.pro !== true) {
            // Servidor diz que não é PRO — remove do cache imediatamente
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem("meucorre_license_last_check");
          } else {
            // Atualiza timestamp de última verificação
            localStorage.setItem(
              "meucorre_license_last_check",
              String(Date.now()),
            );
          }
        })
        .catch(() => {
          // Falha na verificação em background — confia no TTL
          // (não muda nada, próxima chamada síncrona decide)
        });
      return true;
    }
  }

  // Fora da janela TTL (ou primeira vez) — verificação síncrona OBRIGATÓRIA
  try {
    const res = await fetch("/api/license/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey: license }),
    });
    const data = await res.json();
    if (data.pro === true) {
      // Atualiza timestamp de última verificação
      localStorage.setItem("meucorre_license_last_check", String(Date.now()));
      return true;
    } else {
      // Servidor diz que não é PRO — remove do cache
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("meucorre_license_last_check");
      return false;
    }
  } catch {
    // FAIL-CLOSED: se não conseguimos verificar, assume que NÃO é PRO.
    // Antes retornava `true` (fail-open) = bypass fácil via adblocker.
    return false;
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
