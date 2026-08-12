// Tipos compartilhados do CRM de Parceiros (Release D)
// Usado por: admin/parceiros/* e api/admin/partners/*

export type PartnerStage =
  | "novo_lead"
  | "qualificando"
  | "contato_iniciado"
  | "descoberta"
  | "proposta_enviada"
  | "negociacao"
  | "aguardando_aprovacao"
  | "ativacao"
  | "ativo"
  | "renovacao"
  | "perdido"
  | "desqualificado";

export type PartnerStatus = "active" | "paused" | "archived" | "lost" | "disqualified";
export type PartnerPriority = "baixa" | "media" | "alta" | "urgente";

export interface Partner {
  id: string;
  companyName: string;
  tradeName: string | null;
  cnpj: string | null;
  category: string | null;
  origin: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  assignedTo: string | null;
  priority: PartnerPriority;
  status: PartnerStatus;
  stage: PartnerStage;
  relevanceScore: number | null;
  benefitScore: number | null;
  reputationScore: number | null;
  capacityScore: number | null;
  riskScore: number | null;
  tags: string | null;
  potentialValue: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { contacts: number; opportunities: number; activities: number };
  contacts?: PartnerContact[];
  opportunities?: Opportunity[];
  activities?: PartnerActivity[];
  logs?: PartnerLog[];
}

export interface PartnerContact {
  id: string;
  partnerId: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  optOut: boolean;
  linkedinUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: string;
  partnerId: string;
  contactId: string | null;
  title: string;
  description: string | null;
  stage: PartnerStage;
  potentialValue: number | null;
  expectedCloseAt: string | null;
  wonAt: string | null;
  lostAt: string | null;
  lostReason: string | null;
  billingModel: "campaign" | "lead" | "both" | null;
  createdAt: string;
  updatedAt: string;
  contact?: PartnerContact | null;
  _count?: { activities: number };
}

export type ActivityType = "call" | "email" | "whatsapp" | "meeting" | "follow_up" | "note" | "document";
export type ActivityStatus = "pending" | "done" | "canceled";

export interface PartnerActivity {
  id: string;
  partnerId: string;
  opportunityId: string | null;
  type: ActivityType;
  title: string;
  description: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  status: ActivityStatus;
  assignedTo: string | null;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
  partner?: Pick<Partner, "id" | "companyName" | "city" | "category">;
  opportunity?: Pick<Opportunity, "title"> | null;
}

export interface PartnerLog {
  id: string;
  partnerId: string;
  action: string;
  details: string | null;
  adminId: string | null;
  adminEmail: string | null;
  ipAddress: string | null;
  createdAt: string;
  partner?: Pick<Partner, "companyName">;
}

// Constantes
export const STAGES: Array<{ value: PartnerStage; label: string; color: string }> = [
  { value: "novo_lead", label: "Novo Lead", color: "#71717a" },
  { value: "qualificando", label: "Qualificando", color: "#3b82f6" },
  { value: "contato_iniciado", label: "Contato Iniciado", color: "#06b6d4" },
  { value: "descoberta", label: "Descoberta", color: "#8b5cf6" },
  { value: "proposta_enviada", label: "Proposta Enviada", color: "#f59e0b" },
  { value: "negociacao", label: "Negociação", color: "#ec4899" },
  { value: "aguardando_aprovacao", label: "Aguardando Aprovação", color: "#a855f7" },
  { value: "ativacao", label: "Ativação", color: "#14b8a6" },
  { value: "ativo", label: "Ativo", color: "#10b981" },
  { value: "renovacao", label: "Renovação", color: "#22c55e" },
  { value: "perdido", label: "Perdido", color: "#ef4444" },
  { value: "desqualificado", label: "Desqualificado", color: "#6b7280" },
];

export const STAGE_COLORS: Record<PartnerStage, string> = STAGES.reduce(
  (acc, s) => ({ ...acc, [s.value]: s.color }),
  {} as Record<PartnerStage, string>,
);

export const STAGE_LABELS: Record<PartnerStage, string> = STAGES.reduce(
  (acc, s) => ({ ...acc, [s.value]: s.label }),
  {} as Record<PartnerStage, string>,
);

export const PRIORITY_LABELS: Record<PartnerPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export const PRIORITY_COLORS: Record<PartnerPriority, string> = {
  baixa: "#71717a",
  media: "#3b82f6",
  alta: "#f59e0b",
  urgente: "#ef4444",
};

export const STATUS_LABELS: Record<PartnerStatus, string> = {
  active: "Ativo",
  paused: "Pausado",
  archived: "Arquivado",
  lost: "Perdido",
  disqualified: "Desqualificado",
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: "Ligação",
  email: "Email",
  whatsapp: "WhatsApp",
  meeting: "Reunião",
  follow_up: "Follow-up",
  note: "Anotação",
  document: "Documento",
};

export const ACTIVITY_TYPE_ICONS: Record<ActivityType, string> = {
  call: "📞",
  email: "✉️",
  whatsapp: "💬",
  meeting: "📅",
  follow_up: "🔁",
  note: "📝",
  document: "📄",
};

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  pending: "Pendente",
  done: "Concluída",
  canceled: "Cancelada",
};

export const CATEGORIES = [
  { value: "oficina", label: "Oficina" },
  { value: "pneus", label: "Pneus" },
  { value: "acessorios", label: "Acessórios" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "protecao", label: "Proteção" },
  { value: "servicos", label: "Serviços" },
  { value: "outros", label: "Outros" },
];

export const CATEGORY_LABELS: Record<string, string> = CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.value]: c.label }),
  {} as Record<string, string>,
);

export function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "agora";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d atrás`;
  return formatDate(iso);
}
