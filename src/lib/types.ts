// Tipos centrais do MeuCorre
// Arquitetura Local-First: o dispositivo é a única fonte da verdade.

export type AppName =
  | "iFood"
  | "99Food"
  | "Lalamove"
  | "Rappi"
  | "Loggi"
  | "Independente/Outros";

export interface Delivery {
  id?: number;
  app: AppName;
  value: number;
  km: number;
  date: string; // YYYY-MM-DD (ISO local)
  timestamp: number; // epoch ms
  notes?: string;
}

export type PeriodFilter = "hoje" | "semana" | "mes" | "tudo";

export interface AppStat {
  app: AppName;
  total: number;
  count: number;
  km: number;
}

export interface PeriodStat {
  total: number;
  count: number;
  km: number;
  byApp: AppStat[];
}
