"use client";

import { useEffect, useRef } from "react";

// ===== Componente AdSense =====
//
// Renderiza um ad unit do Google AdSense. Só funciona se:
//   1. NEXT_PUBLIC_ADSENSE_CLIENT estiver configurado (ca-pub-XXXXXXXXXXXXXXXX)
//   2. O site foi aprovado no Google AdSense
//   3. O ad slot ID estiver configurado no componente
//
// Uso:
//   <AdSense slot="1234567890" format="auto" />
//
// Se AdSense não estiver configurado, o componente renderiza nada (null).
// Isso permite que o código esteja pronto para quando o admin aprovar
// o AdSense — basta configurar a env var e os anúncios aparecem.

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

export function AdSense({
  slot,
  format = "auto",
  responsive = true,
  className = "",
  style,
}: AdSenseProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // Só tenta carregar o anúncio se o AdSense estiver configurado
    const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
    if (!client) return;

    try {
      // Push para a fila do AdSense
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Erro silencioso — AdSense pode falhar se o script ainda não carregou
    }
  }, []);

  // Se AdSense não estiver configurado, não renderiza nada
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  if (!client) return null;

  return (
    <div
      className={`adsense-container overflow-hidden ${className}`}
      style={style}
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
