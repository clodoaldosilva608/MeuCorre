import type { DeliveryApp, ExpenseCategory } from "./types";
import { db, ensureDefaultApps } from "./db";

// Apps de entrega suportados.
// No MeuCorre v2, apps são gerenciados pelo DB (tabela `apps`).
// Apps padrão são seedeados na primeira abertura; o usuário pode
// cadastrar apps customizados com upload de imagem oficial.

// Carrega apps visíveis (não hidden), ordenados por `order`.
export async function loadVisibleApps(): Promise<DeliveryApp[]> {
  await ensureDefaultApps();
  const all = await db.apps.toArray();
  return all
    .filter((a) => !a.hidden)
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

// Carrega todos os apps (inclui hidden) para a tela de gestão.
export async function loadAllApps(): Promise<DeliveryApp[]> {
  await ensureDefaultApps();
  const all = await db.apps.toArray();
  return all.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

// Mapa síncrono (para uso em hooks que precisam de lookup rápido).
export function appMap(apps: DeliveryApp[]): Map<string, DeliveryApp> {
  return new Map(apps.map((a) => [a.name, a]));
}

// Categorias de despesa — fixas, com emoji + cor.
export const EXPENSE_CATEGORIES: {
  key: ExpenseCategory;
  label: string;
  color: string;
  emoji: string;
}[] = [
  { key: "combustivel", label: "Combustível", color: "#ef4444", emoji: "⛽" },
  { key: "alimentacao", label: "Alimentação", color: "#f59e0b", emoji: "🍔" },
  { key: "manutencao", label: "Manutenção", color: "#3b82f6", emoji: "🔧" },
  { key: "bateria", label: "Bateria / Recarga", color: "#a855f7", emoji: "🔋" },
  { key: "pedagio", label: "Pedágio", color: "#06b6d4", emoji: "🚧" },
  { key: "outros", label: "Outros", color: "#71717a", emoji: "💸" },
];

export function expenseCategoryMeta(cat: ExpenseCategory) {
  return (
    EXPENSE_CATEGORIES.find((c) => c.key === cat) ?? EXPENSE_CATEGORIES[5]
  );
}

// Lookup de cor/emoji para um nome de app, com fallback.
export function appMeta(
  name: string,
  apps: DeliveryApp[],
): { color: string; emoji: string; label: string; image?: string } {
  const found = apps.find((a) => a.name === name);
  if (found) {
    return {
      color: found.color,
      emoji: found.emoji,
      label: found.label,
      image: found.image,
    };
  }
  return { color: "#10b981", emoji: "🚀", label: name };
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

// Subtrai N dias e retorna ISO.
export function daysAgoISO(n: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return todayISO(d);
}

// Converte arquivo File em data URL (base64) para armazenar imagem no IndexedDB.
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Redimensiona imagem para max 256x256 (economiza IndexedDB).
// Retorna data URL JPEG otimizado.
export async function resizeImage(file: File, maxSize = 256): Promise<string> {
  const dataUrl = await fileToDataURL(file);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ===== Parser de notificações =====
// Detecta app + valor em um texto livre de notificação.
// Suporta padrões comuns: "iFood: Você recebeu R$ 15,50", etc.

export interface ParsedNotification {
  app?: string;
  value?: number;
  raw: string;
}

export function parseNotification(
  text: string,
  apps: DeliveryApp[],
): ParsedNotification {
  const raw = text.trim();
  const lower = raw.toLowerCase();
  const result: ParsedNotification = { raw };

  // Detecta app: procura por nome do app no texto (case-insensitive)
  for (const app of apps) {
    if (lower.includes(app.name.toLowerCase())) {
      result.app = app.name;
      break;
    }
    // também checa o label sem acentos/espaços
    if (lower.includes(app.label.toLowerCase().split(" ")[0])) {
      result.app = app.name;
      break;
    }
  }

  // Detecta valor: padrões "R$ 15,50", "R$15.50", "15,50", "R$ 1.234,56"
  // Tentativa 1: R$ X.YXX,XX
  const brMatch = raw.match(/r\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/i);
  if (brMatch) {
    result.value = parseFloat(brMatch[1].replace(/\./g, "").replace(",", "."));
    return result;
  }
  // Tentativa 2: R$ XX.XX (formato americano)
  const usMatch = raw.match(/r\$\s*(\d+(?:\.\d{2})?)/i);
  if (usMatch) {
    result.value = parseFloat(usMatch[1]);
    return result;
  }
  // Tentativa 3: número decimal sozinho com vírgula (15,50)
  const decMatch = raw.match(/(?<![\d.])\b(\d+),(\d{2})\b/);
  if (decMatch) {
    result.value = parseFloat(`${decMatch[1]}.${decMatch[2]}`);
    return result;
  }
  // Tentativa 4: número decimal sozinho com ponto (15.50)
  const decUsMatch = raw.match(/(?<![\d,])\b(\d+)\.(\d{2})\b/);
  if (decUsMatch) {
    result.value = parseFloat(decUsMatch[0]);
  }

  return result;
}
