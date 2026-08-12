// Tipos compartilhados da Central de Divulgação
// Usado por: admin/divulgacao/* e api/admin/promotion/*

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  objective: string | null;
  startAt: string | null;
  endAt: string | null;
  timezone: string;
  status: "draft" | "active" | "paused" | "completed" | "archived";
  color: string;
  defaultUtm: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { posts: number };
}

export interface PromotionAsset {
  id: string;
  name: string;
  storageKey: string;
  publicUrl: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  altText: string | null;
  source: string | null;
  baseAssetName: string | null;
  tags: string | null;
  hash: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { posts: number };
}

export interface PromotionPost {
  id: string;
  campaignId: string;
  editorialDay: number;
  sequenceNumber: number;
  publishAt: string;
  timezone: string;
  platform: "Instagram" | "TikTok" | "Facebook" | "YouTube";
  format: string | null;
  pillar: string | null;
  title: string;
  description: string;
  hashtags: string | null;
  engagementText: string | null;
  cta: string | null;
  destinationUrl: string | null;
  altText: string | null;
  videoScript: string | null;
  durationSeconds: number | null;
  status: "pending" | "published" | "skipped" | "failed";
  publishedAt: string | null;
  notes: string | null;
  utmQuery: string | null;
  assetId: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  asset?: PromotionAsset | null;
  campaign?: Pick<Campaign, "id" | "name" | "color"> | null;
  reminders?: PromotionReminder[];
  _count?: { reminders: number };
}

export interface SocialChannel {
  id: string;
  name: string;
  platform: string;
  profileUrl: string;
  bannerUrl: string | null;
  promoTitle: string | null;
  promoText: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionReminder {
  id: string;
  postId: string;
  remindAt: string;
  minutesBefore: number;
  channel: "browser" | "email" | "whatsapp";
  status: "pending" | "sent" | "failed" | "canceled";
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  post?: Pick<
    PromotionPost,
    "id" | "title" | "platform" | "publishAt" | "editorialDay" | "sequenceNumber"
  >;
}

// Helpers
export const PLATFORMS = ["Instagram", "TikTok", "Facebook", "YouTube"] as const;
export const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "#E1306C",
  TikTok: "#00F2EA",
  Facebook: "#1877F2",
  YouTube: "#FF0000",
};
export const STATUS_COLORS: Record<string, string> = {
  pending: "#a1a1aa",
  published: "#10b981",
  skipped: "#f59e0b",
  failed: "#ef4444",
};
export const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  published: "Publicada",
  skipped: "Pulada",
  failed: "Falhou",
};

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

export function formatDateBR(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}
