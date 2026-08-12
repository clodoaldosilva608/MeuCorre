// Tipos compartilhados do Outbound Supervisionado (Release G)

export type OutboundChannel = "email" | "whatsapp" | "linkedin" | "phone";
export type OutboundObjective =
  | "permission"
  | "discovery"
  | "proposal"
  | "follow_up"
  | "renewal";
export type OutboundTemplateStatus = "draft" | "approved" | "paused" | "archived";

export type OutboundLogStatus =
  | "preparado"
  | "aguardando_aprovacao"
  | "enviado"
  | "respondeu"
  | "interessado"
  | "reuniao_marcada"
  | "proposta_enviada"
  | "negociacao"
  | "ganho"
  | "ativo"
  | "opt_out"
  | "perdido"
  | "erro";

export type ResponseClassification =
  | "permission_to_send"
  | "interessado"
  | "pricing_question"
  | "meeting_ready"
  | "opt_out"
  | "nurture_future"
  | "ambiguous"
  | "risk";

export interface OutboundTemplate {
  id: string;
  name: string;
  channel: OutboundChannel;
  segment: string | null;
  objective: OutboundObjective;
  subject: string | null;
  body: string;
  cta: string | null;
  optOutText: string | null;
  variables: string | null;
  status: OutboundTemplateStatus;
  version: number;
  parentTemplateId: string | null;
  notes: string | null;
  createdBy: string | null;
  createdByEmail: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { logs: number };
}

export interface OutboundLog {
  id: string;
  partnerId: string;
  contactId: string;
  templateId: string | null;
  channel: OutboundChannel;
  renderedSubject: string | null;
  renderedBody: string;
  renderedCta: string | null;
  status: OutboundLogStatus;
  responseText: string | null;
  responseClassification: ResponseClassification | null;
  responseClassifiedAt: string | null;
  responseClassifiedBy: string | null;
  responseClassifiedByEmail: string | null;
  responseClassifiedByMethod: "manual" | "ai" | null;
  lostReason: string | null;
  followUpAt: string | null;
  followUpNotes: string | null;
  sentAt: string | null;
  sentBy: string | null;
  sentByEmail: string | null;
  sentManuallyAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  approvedByEmail: string | null;
  errorMessage: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  partner?: { id: string; companyName: string; city: string | null; state: string | null };
  contact?: { id: string; name: string; email: string | null; phone: string | null; optOut: boolean };
  template?: { id: string; name: string; channel: OutboundChannel; objective: OutboundObjective; version: number } | null;
}

export const CHANNEL_LABELS: Record<OutboundChannel, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  linkedin: "LinkedIn",
  phone: "Telefone",
};

export const CHANNEL_COLORS: Record<OutboundChannel, string> = {
  email: "#3b82f6",
  whatsapp: "#10b981",
  linkedin: "#0a66c2",
  phone: "#f59e0b",
};

export const CHANNEL_ICONS: Record<OutboundChannel, string> = {
  email: "✉️",
  whatsapp: "💬",
  linkedin: "in",
  phone: "📞",
};

export const OBJECTIVE_LABELS: Record<OutboundObjective, string> = {
  permission: "Permissão",
  discovery: "Descoberta",
  proposal: "Proposta",
  follow_up: "Follow-up",
  renewal: "Renovação",
};

export const TEMPLATE_STATUS_LABELS: Record<OutboundTemplateStatus, string> = {
  draft: "Rascunho",
  approved: "Aprovado",
  paused: "Pausado",
  archived: "Arquivado",
};

export const TEMPLATE_STATUS_COLORS: Record<OutboundTemplateStatus, string> = {
  draft: "#71717a",
  approved: "#10b981",
  paused: "#f59e0b",
  archived: "#6b7280",
};

export const LOG_STATUS_LABELS: Record<OutboundLogStatus, string> = {
  preparado: "Preparado",
  aguardando_aprovacao: "Aguardando Aprovação",
  enviado: "Enviado",
  respondeu: "Respondeu",
  interessado: "Interessado",
  reuniao_marcada: "Reunião Marcada",
  proposta_enviada: "Proposta Enviada",
  negociacao: "Negociação",
  ganho: "Ganho",
  ativo: "Ativo",
  opt_out: "Opt-out",
  perdido: "Perdido",
  erro: "Erro",
};

export const LOG_STATUS_COLORS: Record<OutboundLogStatus, string> = {
  preparado: "#71717a",
  aguardando_aprovacao: "#f59e0b",
  enviado: "#3b82f6",
  respondeu: "#06b6d4",
  interessado: "#10b981",
  reuniao_marcada: "#8b5cf6",
  proposta_enviada: "#a855f7",
  negociacao: "#ec4899",
  ganho: "#22c55e",
  ativo: "#14b8a6",
  opt_out: "#ef4444",
  perdido: "#6b7280",
  erro: "#dc2626",
};

export const CLASSIFICATION_LABELS: Record<ResponseClassification, string> = {
  permission_to_send: "Permissão para enviar",
  interessado: "Interessado",
  pricing_question: "Pergunta de preço",
  meeting_ready: "Pronto para reunião",
  opt_out: "Opt-out (não contactar)",
  nurture_future: "Cultivar futuro",
  ambiguous: "Ambígua",
  risk: "Risco / Reclamação",
};

export const CLASSIFICATION_COLORS: Record<ResponseClassification, string> = {
  permission_to_send: "#3b82f6",
  interessado: "#10b981",
  pricing_question: "#f59e0b",
  meeting_ready: "#8b5cf6",
  opt_out: "#ef4444",
  nurture_future: "#06b6d4",
  ambiguous: "#71717a",
  risk: "#dc2626",
};

export const CLASSIFICATION_NEXT_ACTIONS: Record<ResponseClassification, string> = {
  permission_to_send: "Enviar resumo curto com a proposta",
  interessado: "Perguntar objetivo, região, capacidade",
  pricing_question: "Explicar formato e oferecer conversa",
  meeting_ready: "Oferecer dois horários para reunião",
  opt_out: "Confirmar respeito ao opt-out. Bloquear follow-up. NUNCA mais contactar.",
  nurture_future: "Perguntar quando retomar o contato",
  ambiguous: "Fazer pergunta curta para esclarecer ou escalar para humano",
  risk: "PARAR contato imediatamente. Registrar, revisar, escalar se necessário.",
};

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
