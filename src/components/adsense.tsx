"use client";

import { useEffect, useRef, useState } from "react";

// ===== Componente AdSense =====
//
// Renderiza um ad unit do Google AdSense. Só funciona se:
//   1. NEXT_PUBLIC_ADSENSE_CLIENT estiver configurado (ca-pub-XXXXXXXXXXXXXXXX)
//   2. O site foi aprovado no Google AdSense
//   3. O ad slot ID estiver configurado no componente (slot real, não placeholder)
//
// Uso:
//   <AdSense slot="1234567890" format="auto" />
//
// Se AdSense não estiver configurado ou slot for placeholder, renderiza nada.
// Isso evita o erro "no_div" do script adsbygoogle.js quando slots não existem.

interface AdSenseProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// Placeholder slots que NÃO devem disparar o script AdSense
// (são IDs fake usados durante desenvolvimento)
const PLACEHOLDER_SLOTS = new Set([
  "1111111111",
  "2222222222",
  "3333333333",
  "4444444444",
  "5555555555",
  "6666666666",
  "7777777777",
  "8888888888",
  "9999999999",
  "0000000000",
]);

export function AdSense({
  slot,
  format = "auto",
  responsive = true,
  className = "",
  style,
}: AdSenseProps) {
  const adRef = useRef<HTMLModElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
    // Não tenta carregar se:
    // - Client não configurado
    // - Slot é placeholder (não existe na conta AdSense)
    // - Slot é vazio
    if (!client || !slot || PLACEHOLDER_SLOTS.has(slot)) return;

    // Aguarda o script do AdSense estar carregado
    if (typeof window === "undefined") return;

    // Carrega o script AdSense sob demanda (apenas quando há slot válido)
    // Isso evita o erro 'no_div' em páginas sem anúncios
    if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }

    try {
      // Push para a fila do AdSense
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      setAdLoaded(true);
    } catch {
      // Erro silencioso — AdSense pode falhar se o script ainda não carregou
    }
  }, [slot]);

  // Se AdSense não estiver configurado OU slot for placeholder, não renderiza nada
  // Isso evita o erro "no_div" que aparecia no console de todas as páginas
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  if (!client || !slot || PLACEHOLDER_SLOTS.has(slot)) return null;

  return (
    <div
      className={`adsense-container overflow-hidden ${className}`}
      style={style}
      data-ad-loaded={adLoaded}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: "block",
          ...style,
        }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
