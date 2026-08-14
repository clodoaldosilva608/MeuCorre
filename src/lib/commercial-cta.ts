// ===== Fonte única de verdade para CTAs comerciais =====
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

export const PLAN_PRICE = Number(process.env.PLAN_PRICE ?? 18.9);
export const ANNUAL_PRICE = Number(process.env.ANNUAL_PRICE ?? 97);
export const MONTHLY_PRICE = Number(process.env.MONTHLY_PRICE ?? 14.9);
export const ORIGINAL_PRICE = 97;

export const KIWIFY_CHECKOUT_BASE = "https://pay.kiwify.com.br";

// Slug do plano vitalício (pagamento único)
export function getKiwifySlug(): string {
  return process.env.NEXT_PUBLIC_KIWIFY_PRODUCT_SLUG ?? "";
}

// Slug do plano mensal (assinatura recorrente)
export function getKiwifySlugMonthly(): string {
  return process.env.KIWIFY_SLUG_MONTHLY ?? "";
}

// Slug do plano anual (assinatura recorrente)
export function getKiwifySlugAnnual(): string {
  return process.env.KIWIFY_SLUG_ANNUAL ?? "";
}

// Retorna o slug correto baseado no plano selecionado
export function getKiwifySlugForPlan(plan: "monthly" | "annual" | "lifetime"): string {
  switch (plan) {
    case "monthly":
      return getKiwifySlugMonthly();
    case "annual":
      return getKiwifySlugAnnual();
    case "lifetime":
    default:
      return getKiwifySlug();
  }
}

export function isKiwifyConfigured(): boolean {
  return !!getKiwifySlug();
}

export function isKiwifyPlanConfigured(plan: "monthly" | "annual" | "lifetime"): boolean {
  return !!getKiwifySlugForPlan(plan);
}

export function getFreeDownloadHref(isAuthenticated: boolean): string {
  return isAuthenticated ? "/app" : "/quiz";
}

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
  const queryParams = new URLSearchParams({ email, name, plan });
  if (phone) queryParams.set("phone", phone);
  if (utmParams) {
    for (const [key, value] of Object.entries(utmParams)) {
      if (value) queryParams.set(key, value);
    }
  }
  if (referralCode) queryParams.set("sck", referralCode);
  return `${KIWIFY_CHECKOUT_BASE}/${slug}?${queryParams.toString()}`;
}

export function extractUtmParams(
  searchParams: URLSearchParams,
): Record<string, string> {
  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const result: Record<string, string> = {};
  for (const key of utmKeys) {
    const value = searchParams.get(key);
    if (value) result[key] = value;
  }
  return result;
}

// Email de contato/suporte oficial
export const SUPPORT_EMAIL = "suportemeucorre@gmail.com";
