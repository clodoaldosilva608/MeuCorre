// ===== Validação de URLs (anti-SSRF) =====

const ALLOWED_IMAGE_PROTOCOLS = ["https:", "data:"];
const ALLOWED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
];

// Valida URL de imagem externa (anti-SSRF)
// - Deve ser HTTPS ou data URL
// - Deve ter extensão de imagem válida (ou ser data URL)
// - Bloqueia IPs locais e metadata cloud (169.254.169.254)
export function validateImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();
  if (trimmed.length === 0 || trimmed.length > 2048) return null;

  // Data URL (base64) — OK se prefixo correto
  if (trimmed.startsWith("data:image/")) {
    // Limita tamanho pra evitar DoS em DB
    if (trimmed.length > 2 * 1024 * 1024) return null; // 2MB max
    return trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  // Só HTTPS
  if (!ALLOWED_IMAGE_PROTOCOLS.includes(parsed.protocol)) {
    return null;
  }

  // Bloqueia IPs locais / metadata cloud (SSRF)
  const hostname = parsed.hostname.toLowerCase();
  const blockedPatterns = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "169.254.169.254", // AWS/GCP metadata
    "metadata.google.internal", // GCP metadata
    "100.100.100.200", // Alibaba metadata
  ];
  if (blockedPatterns.includes(hostname)) return null;

  // Bloqueia IPs privados (10.x, 192.168.x, 172.16-31.x)
  const ipMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipMatch) {
    const [a, b] = [Number(ipMatch[1]), Number(ipMatch[2])];
    if (a === 10) return null;
    if (a === 192 && b === 168) return null;
    if (a === 172 && b >= 16 && b <= 31) return null;
  }

  // Extensão de imagem (ou sem extensão, ex: CDN com query params)
  const pathname = parsed.pathname.toLowerCase();
  const hasImageExt = ALLOWED_IMAGE_EXTENSIONS.some((ext) =>
    pathname.includes(ext),
  );
  if (!hasImageExt && !pathname.includes("/image")) {
    return null;
  }

  return trimmed;
}

// Valida URL de link de destino (CTA do anúncio)
const ALLOWED_LINK_PROTOCOLS = ["https:"];
export function validateExternalUrl(
  url: string | null | undefined,
): string | null {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();
  if (trimmed.length === 0 || trimmed.length > 2048) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (!ALLOWED_LINK_PROTOCOLS.includes(parsed.protocol)) {
    return null;
  }

  // Bloqueia metadata cloud
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "169.254.169.254" ||
    hostname === "metadata.google.internal"
  ) {
    return null;
  }

  return trimmed;
}

// Sanitiza string genérica (remove caracteres de controle, limita tamanho)
export function sanitizeString(
  str: string | null | undefined,
  maxLength = 1000,
): string {
  if (!str) return "";
  return str
    .replace(/[\x00-\x1F\x7F]/g, "") // caracteres de controle
    .trim()
    .slice(0, maxLength);
}
