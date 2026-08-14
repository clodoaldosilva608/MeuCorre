// ===== Fonte única de verdade para CTAs comerciais =====
//
// Centraliza URLs, preços e rótulos dos CTAs da landing page.
// Evita espalhar valores hardcoded em componentes diferentes.
//
// Regras de destino:
// - free_download: → /quiz (fluxo obrigatório de descoberta)
//   Se usuário já autenticado → /app (não força novo cadastro)
// - existing_user: → /login
// - offer/plan_*: → CheckoutDialog (interno) → redirect Kiwify

export type CtaKey =
  | "free_download"
  | "existing_user"
  | "offer"
  | "plan_monthly"
  | "plan_annual"
  | "plan_lifetime";

export type CtaTarget = "internal" | "external_checkout";

export interface CommercialCta {
  key: CtaKey;
  label: string;
  href: string;
  target: CtaTarget;
  plan?: "monthly" | "annual" | "lifetime";
  displayedPrice?: string;
  analyticsEvent: string;
}

// ===== Preços (fonte única) =====
// Lidos de env vars com fallback para valores hardcoded atuais.
// R$ 18,90 é o preço vitalício oficial — não alterar sem aprovação.
export const PLAN_PRICE = Number(process.env.PLAN_PRICE ?? 18.9);
export const ANNUAL_PRICE = Number(process.env.ANNUAL_PRICE ?? 97);
export const MONTHLY_PRICE = Number(process.env.MONTHLY_PRICE ?? 14.9);
export const ORIGINAL_PRICE = 97; // Preço "de" riscado (referência)

// ===== Configuração do Kiwify =====
// Slug do produto no Kiwify (env var, sem fallback no código — se vazio, toast erro).
export const KIWIFY_CHECKOUT_BASE = "https://pay.kiwify.com.br";

export function getKiwifySlug(): string {
  return process.env.NEXT_PUBLIC_KIWIFY_PRODUCT_SLUG ?? "";
}

export function isKiwifyConfigured(): boolean {
  return !!getKiwifySlug();
}

// ===== CTAs comerciais =====
export const COMMERCIAL_CTAS: Record<CtaKey, CommercialCta> = {
  free_download: {
    key: "free_download",
    label: "Baixar grátis",
    href: "/quiz", // Fluxo obrigatório: landing → quiz → conta → app
    target: "internal",
    analyticsEvent: "cta_free_download_click",
  },
  existing_user: {
    key: "existing_user",
    label: "Já sou do Corre",
    href: "/login",
    target: "internal",
    analyticsEvent: "cta_existing_user_click",
  },
  offer: {
    key: "offer",
    label: "Quero PRO",
    href: "#checkout", // Abre CheckoutDialog
    target: "internal",
    plan: "lifetime",
    displayedPrice: `R$ ${PLAN_PRICE.toFixed(2).replace(".", ",")}`,
    analyticsEvent: "cta_offer_click",
  },
  plan_monthly: {
    key: "plan_monthly",
    label: "Assinar mensal",
    href: "#checkout",
    target: "internal",
    plan: "monthly",
    displayedPrice: `R$ ${MONTHLY_PRICE.toFixed(2).replace(".", ",")}`,
    analyticsEvent: "cta_plan_monthly_click",
  },
  plan_annual: {
    key: "plan_annual",
    label: "Assinar anual",
    href: "#checkout",
    target: "internal",
    plan: "annual",
    displayedPrice: `R$ ${ANNUAL_PRICE.toFixed(2).replace(".", ",")}`,
    analyticsEvent: "cta_plan_annual_click",
  },
  plan_lifetime: {
    key: "plan_lifetime",
    label: "Garantir vitalício",
    href: "#checkout",
    target: "internal",
    plan: "lifetime",
    displayedPrice: `R$ ${PLAN_PRICE.toFixed(2).replace(".", ",")}`,
    analyticsEvent: "cta_plan_lifetime_click",
  },
};

// ===== Helper: destino do CTA "Baixar grátis" =====
// Se usuário já autenticado → /app (não força novo cadastro)
// Se não autenticado → /quiz (fluxo de descoberta)
export function getFreeDownloadHref(isAuthenticated: boolean): string {
  return isAuthenticated ? "/app" : "/quiz";
}

// ===== Helper: construir URL de checkout Kiwify com UTMs e ref =====
// Propaga parâmetros de origem, campanha, UTM e indicação do CTA até o checkout.
export function buildKiwifyCheckoutUrl(params: {
  slug: string;
  email: string;
  name: string;
  phone?: string;
  plan: "monthly" | "annual" | "lifetime";
  utmParams?: Record<string, string>;
  referralCode?: string;
}): string {
  const { slug, email, name, phone, plan, utmParams, referralCode } = params;

  const queryParams = new URLSearchParams({
    email,
    name,
    plan,
  });

  if (phone) queryParams.set("phone", phone);

  // Propaga UTMs (utm_source, utm_medium, utm_campaign, utm_content, utm_term)
  if (utmParams) {
    for (const [key, value] of Object.entries(utmParams)) {
      if (value) queryParams.set(key, value);
    }
  }

  // Propaga código de indicação (ref) via campo `sck` do Kiwify
  // (sck = Sub-conversion Tracking Key — Kiwify suporta nativamente)
  if (referralCode) {
    queryParams.set("sck", referralCode);
  }

  return `${KIWIFY_CHECKOUT_BASE}/${slug}?${queryParams.toString()}`;
}

// ===== Helper: extrair UTMs da URL atual =====
export function extractUtmParams(
  searchParams: URLSearchParams,
): Record<string, string> {
  const utmKeys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ];
  const result: Record<string, string> = {};
  for (const key of utmKeys) {
    const value = searchParams.get(key);
    if (value) result[key] = value;
  }
  return result;
}
