"use client";

import { useState, useEffect } from "react";

// ===== Banner de Consentimento de Cookies (CMP) =====
//
// Exigido pelo Google AdSense para conformidade com GDPR/LGPD.
// O Google requer que o usuário consinta com cookies antes de
// exibir anúncios personalizados.
//
// Implementa o padrão IAB TCF v2.2 simplificado:
// - Usuário pode aceitar todos os cookies
// - Usuário pode recusar (apenas cookies essenciais)
// - Escolha é salva no localStorage (validade 12 meses)
// - Se aceito, AdSense carrega anúncios personalizados
// - Se recusado, AdSense carrega anúncios não personalizados

const CONSENT_KEY = "meucorre_cookie_consent";
const CONSENT_EXPIRY_MS = 365 * 24 * 60 * 60 * 1000; // 12 meses

interface ConsentData {
  accepted: boolean;
  timestamp: number;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        const data: ConsentData = JSON.parse(stored);
        // Verifica se não expirou
        if (Date.now() - data.timestamp < CONSENT_EXPIRY_MS) {
          // Já consentiu — não mostra banner
          // Se aceito, notifica o AdSense
          if (data.accepted) {
            notifyAdSense(true);
          } else {
            notifyAdSense(false);
          }
          return;
        }
      } catch {
        // JSON inválido — mostra banner
      }
    }
    // Não consentiu ou expirou — mostra banner (via timeout para evitar setState síncrono)
    const t = setTimeout(() => setVisible(true), 0);
    return () => clearTimeout(t);
  }, []);

  const handleAccept = () => {
    const data: ConsentData = { accepted: true, timestamp: Date.now() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
    notifyAdSense(true);
    setVisible(false);
  };

  const handleReject = () => {
    const data: ConsentData = { accepted: false, timestamp: Date.now() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
    notifyAdSense(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-zinc-700 bg-zinc-900/95 backdrop-blur-lg"
      role="dialog"
      aria-label="Consentimento de cookies"
    >
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-xs text-zinc-300">
              <strong className="text-white">🍪 Cookies e privacidade</strong>
              <br />
              Usamos cookies para exibir anúncios relevantes e melhorar sua
              experiência. Seus dados de corridas <strong>nunca</strong> são
              compartilhados — ficam apenas no seu celular.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={handleReject}
              className="rounded-lg border border-zinc-600 bg-transparent px-4 py-2 text-xs font-semibold text-zinc-300 transition-all hover:bg-zinc-800"
            >
              Recusar
            </button>
            <button
              onClick={handleAccept}
              className="rounded-lg bg-neon px-4 py-2 text-xs font-bold text-zinc-950 transition-all hover:bg-neon-soft"
            >
              Aceitar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Notifica o Google AdSense sobre o consentimento do usuário
// via Google Consent Mode v2
function notifyAdSense(accepted: boolean) {
  if (typeof window === "undefined") return;

  // Google Consent Mode v2 — atualiza o estado de consentimento
  const consentState = accepted ? "granted" : "denied";

  // dataLayer push para Google Tag Manager / Consent Mode
  const w = window as unknown as {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    adsbygoogle?: unknown[];
  };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: "cookie_consent_update",
    ad_storage: consentState,
    ad_user_data: consentState,
    ad_personalization: consentState,
    analytics_storage: consentState,
  });

  // Também atualiza via gtag se disponível
  if (typeof w.gtag === "function") {
    w.gtag("consent", "update", {
      ad_storage: consentState,
      ad_user_data: consentState,
      ad_personalization: consentState,
      analytics_storage: consentState,
    });
  }

  // Notifica AdSense diretamente (adsbygoogle)
  try {
    if (w.adsbygoogle) {
      w.adsbygoogle.push({
        google_ad_consent: accepted,
      });
    }
  } catch {
    // AdSense pode não estar carregado ainda
  }
}
