// Tipos compartilhados das Campanhas de Parceiros (Release F)
// Usado por: admin/campanhas/* e api/admin/partner-campaigns/*

export type CampaignStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "published"
  | "paused"
  | "expired"
  | "rejected"
  | "canceled";

export type BillingModel = "campaign" | "lead" | "both";

export interface PartnerCampaign {
  id: string;
  partnerId: string;
  proposalId: string | null;
  name: string;
  description: string | null;
  // Oferta
  offerTitle: string;
  offerDescription: string;
  offerCta: string;
  offerUrl: string;
  couponCode: string | null;
  discountText: string | null;
  // Assets
  imageUrl: string | null;
  videoUrl: string | null;
  // Segmentação
  category: string;
  city: string | null;
  state: string | null;
  proOnly: boolean;
  // Vigência
  startsAt: string;
  endsAt: string | null;
  // Cobrança
  billingModel: string;
  campaignPrice: number | null;
  leadPrice: number | null;
  // Status
  status: CampaignStatus;
  approvedAt: string | null;
  approvedBy: string | null;
  approvedByEmail: string | null;
  publishedAt: string | null;
  pausedAt: string | null;
  rejectedReason: string | null;
  // Métricas
  views: number;
  clicks: number;
  leads: number;
  redemptions: number;
  // Denúncia
  reportsCount: number;
  reportedAt: string | null;
  reportedReason: string | null;
  // Metadata
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  notes: string | null;
  createdBy: string | null;
  createdByEmail: string | null;
  createdAt: string;
  updatedAt: string;
  partner?: {
    id: string;
    companyName: string;
    city: string | null;
    state: string | null;
    category: string | null;
  };
  proposal?: {
    id: string;
    number: string;
    title: string;
  } | null;
}

export const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Rascunho",
  pending_approval: "Pendente",
  approved: "Aprovada",
  published: "Publicada",
  paused: "Pausada",
  expired: "Expirada",
  rejected: "Rejeitada",
  canceled: "Cancelada",
};

export const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: "#71717a",
  pending_approval: "#f59e0b",
  approved: "#3b82f6",
  published: "#10b981",
  paused: "#a855f7",
  expired: "#6b7280",
  rejected: "#ef4444",
  canceled: "#6b7280",
};

export const BILLING_LABELS: Record<BillingModel, string> = {
  campaign: "Por Campanha",
  lead: "Por Lead",
  both: "Campanha + Lead",
};

export function formatBRL(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
