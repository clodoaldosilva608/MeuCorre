import type { AppName } from "./types";

// Apps de entrega suportados, com cor de marca (para o resumo por app).
// Cores hex para usar em badges/barras de progresso.
export const DELIVERY_APPS: { name: AppName; color: string; emoji: string }[] = [
  { name: "iFood", color: "#ef4444", emoji: "🍽️" },
  { name: "99Food", color: "#f97316", emoji: "🟠" },
  { name: "Lalamove", color: "#f59e0b", emoji: "📦" },
  { name: "Rappi", color: "#ec4899", emoji: "🛍️" },
  { name: "Loggi", color: "#3b82f6", emoji: "📮" },
  { name: "Independente/Outros", color: "#10b981", emoji: "🚀" },
];

export const APP_LABELS: Record<AppName, string> = {
  iFood: "iFood",
  "99Food": "99Food",
  Lalamove: "Lalamove",
  Rappi: "Rappi",
  Loggi: "Loggi",
  "Independente/Outros": "Independente / Outros",
};

export function appColor(app: AppName): string {
  return DELIVERY_APPS.find((a) => a.name === app)?.color ?? "#10b981";
}

export function appEmoji(app: AppName): string {
  return DELIVERY_APPS.find((a) => a.name === app)?.emoji ?? "🚀";
}

// Formatação BRL: R$ 1.234,56
export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Formatação BRL compacta para cabeçalhos: R$ 1.234,56
export function formatBRLPlain(value: number): string {
  return `R$ ${value
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    .replace(".", ",")}`;
}

// Distância formatada: 4,2 km
export function formatKm(km: number): string {
  if (!km) return "0 km";
  return `${km.toFixed(1).replace(".", ",")} km`;
}

// Retorna YYYY-MM-DD no fuso local (não UTC) — evita bug de "dia anterior".
export function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Início da semana (domingo) em ISO.
export function startOfWeekISO(d: Date = new Date()): string {
  const date = new Date(d);
  const day = date.getDay(); // 0 = domingo
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return todayISO(date);
}

// Início do mês em ISO.
export function startOfMonthISO(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

// Data por extenso curta: "Ter, 7 Ago"
export function formatShortDate(d: Date = new Date()): string {
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// Hora: 18:42
export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
