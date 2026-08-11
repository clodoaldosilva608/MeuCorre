// Tipos centrais do MeuCorre
// Arquitetura Local-First: o dispositivo é a única fonte da verdade.

export type DefaultAppName =
  | "iFood"
  | "99Food"
  | "Lalamove"
  | "Rappi"
  | "Loggi"
  | "Independente/Outros";

// App de entrega — pode ser padrão (built-in) ou customizado pelo usuário.
export interface DeliveryApp {
  id?: number;
  name: string; // identificador único (chave)
  label: string; // nome exibido
  color: string; // cor hex para badges/barras
  emoji: string; // emoji fallback
  image?: string; // data URL (base64) da imagem oficial do app (opcional)
  isDefault?: boolean; // true se for built-in (não pode excluir)
  hidden?: boolean; // true se o usuário ocultou
  order?: number; // ordem de exibição
}

export interface Delivery {
  id?: number;
  app: string; // nome (chave) do DeliveryApp
  value: number;
  km: number;
  date: string; // YYYY-MM-DD (ISO local)
  timestamp: number; // epoch ms
  notes?: string;
}

export interface Expense {
  id?: number;
  category: ExpenseCategory;
  value: number;
  description?: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export type ExpenseCategory =
  | "combustivel"
  | "alimentacao"
  | "manutencao"
  | "bateria"
  | "pedagio"
  | "outros";

export type PeriodFilter = "hoje" | "semana" | "mes" | "tudo";

export interface AppStat {
  app: string;
  label: string;
  color: string;
  emoji: string;
  image?: string;
  total: number;
  count: number;
  km: number;
}

export interface PeriodStat {
  total: number;
  count: number;
  km: number;
  byApp: AppStat[];
  expenses: number;
  netProfit: number; // total - expenses
}

// ===== Metas financeiras =====
export type GoalType = "daily" | "weekly" | "monthly";

export interface Goal {
  id?: number;
  type: GoalType;
  targetValue: number;
  label?: string;
  active: boolean;
  createdAt: number;
}

// ===== Sessões de trabalho ("Corre do dia") =====
export interface WorkSession {
  id?: number;
  startTime: number;
  endTime: number | null;
  durationMs: number;
  distanceKm: number;
  pointCount: number;
  notes?: string;
}
