// Tipos compartilhados das Propostas (Release E)
// Usado por: admin/propostas/* e api/admin/proposals/*

export type ProposalStatus =
  | "draft"
  | "sent"
  | "approved"
  | "rejected"
  | "expired"
  | "canceled";

export type BillingModel = "campaign" | "lead" | "both";

export type CommercialAssetType =
  | "media_kit"
  | "case"
  | "contract"
  | "presentation"
  | "one_pager"
  | "pricing_table"
  | "video"
  | "other";

export interface Proposal {
  id: string;
  partnerId: string;
  opportunityId: string | null;
  number: string;
  title: string;
  body: string;
  summary: string | null;
  billingModel: BillingModel | null;
  campaignPrice: number | null;
  leadPrice: number | null;
  validUntil: string | null;
  sentAt: string | null;
  status: ProposalStatus;
  approvedAt: string | null;
  approvedBy: string | null;
  approvedByEmail: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
  version: number;
  parentProposalId: string | null;
  publicToken: string | null;
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
    email: string | null;
    phone: string | null;
  };
  opportunity?: {
    id: string;
    title: string;
    potentialValue: number | null;
  } | null;
}

export interface CommercialAsset {
  id: string;
  type: CommercialAssetType;
  name: string;
  description: string | null;
  storageKey: string;
  publicUrl: string | null;
  mimeType: string;
  fileSize: number | null;
  version: string | null;
  tags: string | null;
  active: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalTemplate {
  key: string;
  name: string;
  description: string;
  billingModel: BillingModel | null;
}

export const STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: "Rascunho",
  sent: "Enviada",
  approved: "Aprovada",
  rejected: "Rejeitada",
  expired: "Expirada",
  canceled: "Cancelada",
};

export const STATUS_COLORS: Record<ProposalStatus, string> = {
  draft: "#71717a",
  sent: "#3b82f6",
  approved: "#10b981",
  rejected: "#ef4444",
  expired: "#f59e0b",
  canceled: "#6b7280",
};

export const BILLING_LABELS: Record<BillingModel, string> = {
  campaign: "Por Campanha",
  lead: "Por Lead",
  both: "Campanha + Lead (Duplo)",
};

export const ASSET_TYPE_LABELS: Record<CommercialAssetType, string> = {
  media_kit: "Media Kit",
  case: "Case",
  contract: "Contrato",
  presentation: "Apresentação",
  one_pager: "One-Pager",
  pricing_table: "Tabela de Preços",
  video: "Vídeo",
  other: "Outro",
};

export const ASSET_TYPE_COLORS: Record<CommercialAssetType, string> = {
  media_kit: "#3b82f6",
  case: "#10b981",
  contract: "#a855f7",
  presentation: "#f59e0b",
  one_pager: "#06b6d4",
  pricing_table: "#ec4899",
  video: "#ef4444",
  other: "#71717a",
};

export const ASSET_TYPE_ICONS: Record<CommercialAssetType, string> = {
  media_kit: "📦",
  case: "🏆",
  contract: "📄",
  presentation: "📊",
  one_pager: "📝",
  pricing_table: "💰",
  video: "🎬",
  other: "📎",
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

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
