// ===== Ícones SVG temáticos de redes sociais =====
//
// Substituem emojis no footer da landing page.
// Cada ícone é um SVG inline que pode ser estilizado com CSS.
//
// Mapeamento temático (entregador):
//   YouTube   → Capacete (proteção, vídeo sobre segurança/rotas)
//   Facebook  → Roda de bicicleta (comunidade, entrega leve)
//   Instagram → Roda de moto (foto, estilo, lifestyle)
//   TikTok    → Roda de carro (curto, rápido, movimento)

interface IconProps {
  className?: string;
  size?: number;
}

export function CapaceteIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Capacete — casco arredondado com viseira */}
      <path d="M3 14a9 9 0 0 1 18 0v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3z" />
      <path d="M3 14h18" />
      <path d="M8 14v-2a4 4 0 0 1 8 0v2" />
      <path d="M7 19h10" />
      <circle cx="12" cy="11" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function RodaBicicletaIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Roda de bicicleta — 2 rodas com Raios e quadro */}
      <circle cx="6" cy="17" r="4" />
      <circle cx="18" cy="17" r="4" />
      <circle cx="6" cy="17" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="17" r="1" fill="currentColor" stroke="none" />
      {/* Raios */}
      <line x1="6" y1="13" x2="6" y2="21" strokeWidth="1" />
      <line x1="2" y1="17" x2="10" y2="17" strokeWidth="1" />
      <line x1="18" y1="13" x2="18" y2="21" strokeWidth="1" />
      <line x1="14" y1="17" x2="22" y2="17" strokeWidth="1" />
      {/* Quadro */}
      <path d="M6 17l5-7h6l3 7" />
      <line x1="11" y1="10" x2="14" y2="17" />
      <line x1="11" y1="10" x2="9" y2="7" />
    </svg>
  );
}

export function RodaMotoIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Roda de moto — 1 roda grande com raios + garfo */}
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      {/* Raios */}
      <line x1="12" y1="3" x2="12" y2="21" strokeWidth="1.2" />
      <line x1="3" y1="12" x2="21" y2="12" strokeWidth="1.2" />
      <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" strokeWidth="1.2" />
      <line x1="18.4" y1="5.6" x2="5.6" y2="18.4" strokeWidth="1.2" />
      {/* Pneu (anel externo) */}
      <circle cx="12" cy="12" r="10" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

export function RodaCarroIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Roda de carro — aro esportivo com 5 raios */}
      <circle cx="12" cy="12" r="10" strokeWidth="2.5" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
      {/* 5 raios em estrela */}
      <line x1="12" y1="9" x2="12" y2="3.5" strokeWidth="1.5" />
      <line x1="14.5" y1="10.5" x2="19.5" y2="8" strokeWidth="1.5" />
      <line x1="13.5" y1="13.5" x2="17" y2="18" strokeWidth="1.5" />
      <line x1="10.5" y1="13.5" x2="7" y2="18" strokeWidth="1.5" />
      <line x1="9.5" y1="10.5" x2="4.5" y2="8" strokeWidth="1.5" />
    </svg>
  );
}

// Mapa de redes sociais com imagem do capacete F1 + label + URL
// As imagens são capacetes 4D com fundo transparente (PNG alpha)
export const SOCIAL_LINKS = [
  {
    name: "YouTube",
    href: "https://youtube.com/@meucorre-z4j",
    Icon: CapaceteIcon, // fallback SVG (não usado quando helmetImage existe)
    helmetImage: "/social-helmet-youtube.png",
    glowColor: "rgba(255, 0, 0, 0.5)", // vermelho YouTube
    brandColor: "#FF0000", // vermelho YouTube (para texto)
    label: "Capacete F1 — YouTube",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/meucorr",
    Icon: RodaMotoIcon,
    helmetImage: "/social-helmet-instagram.png",
    glowColor: "rgba(255, 20, 147, 0.5)", // magenta Instagram
    brandColor: "#E1306C", // rosa Instagram (para texto)
    label: "Capacete F1 — Instagram",
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@meucorr",
    Icon: RodaCarroIcon,
    helmetImage: "/social-helmet-tiktok.png",
    glowColor: "rgba(0, 255, 255, 0.5)", // ciano TikTok
    brandColor: "#00F2EA", // ciano TikTok (para texto)
    label: "Capacete F1 — TikTok",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/share/1QqGSn22NC/",
    Icon: RodaBicicletaIcon,
    helmetImage: "/social-helmet-facebook.png",
    glowColor: "rgba(24, 119, 242, 0.5)", // azul Facebook
    brandColor: "#1877F2", // azul Facebook (para texto)
    label: "Capacete F1 — Facebook",
  },
];
