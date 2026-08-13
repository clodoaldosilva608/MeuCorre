// ===== Schemas de validação Zod para endpoints críticos =====
//
// Uso:
//   import { loginSchema, partnerCreateSchema } from "@/lib/zod-schemas";
//
//   const result = loginSchema.safeParse(body);
//   if (!result.success) {
//     return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
//   }
//   const { email, password } = result.data;

import { z } from "zod";

// ===== Auth =====
export const loginSchema = z.object({
  email: z.string().email("Email inválido").max(200),
  password: z.string().min(1, "Senha obrigatória").max(200),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto").max(100),
  email: z.string().email("Email inválido").max(200),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").max(200),
  phone: z.string().max(30).optional(),
  city: z.string().max(100).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido").max(200),
});

// ===== Quiz =====
export const quizSubmitSchema = z.object({
  email: z.string().email("Email inválido").max(200),
  phone: z.string().max(30).optional(),
  name: z.string().max(100).optional(),
  quizAnswers: z.record(z.string(), z.string()).optional(),
  source: z.string().max(50).optional(),
  referrerCode: z.string().max(50).optional(),
});

export const quizConvertSchema = z.object({
  email: z.string().email("Email inválido").max(200),
  userId: z.string().max(100).optional(),
});

// ===== Admin — Partners =====
export const partnerCreateSchema = z.object({
  companyName: z.string().min(1, "companyName obrigatório").max(150),
  tradeName: z.string().max(150).optional(),
  cnpj: z.string().max(20).optional(),
  category: z.string().max(50).optional(),
  origin: z.string().max(30).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  address: z.string().max(300).optional(),
  website: z.string().max(300).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email("Email inválido").max(100).optional().or(z.literal("")),
  assignedTo: z.string().max(100).optional(),
  priority: z.enum(["baixa", "media", "alta", "urgente"]).optional(),
  status: z.enum(["active", "paused", "archived", "lost", "disqualified"]).optional(),
  stage: z.enum([
    "novo_lead", "qualificando", "contato_iniciado", "descoberta",
    "proposta_enviada", "negociacao", "aguardando_aprovacao",
    "ativacao", "ativo", "renovacao", "perdido", "desqualificado",
  ]).optional(),
  tags: z.string().max(300).optional(),
  potentialValue: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

export const partnerContactSchema = z.object({
  name: z.string().min(1, "name obrigatório").max(150),
  role: z.string().max(80).optional(),
  email: z.string().email("Email inválido").max(100).optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  isPrimary: z.boolean().optional(),
  optOut: z.boolean().optional(),
  linkedinUrl: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});

// ===== Admin — Feature Flags =====
export const featureFlagSchema = z.object({
  key: z.string().min(1, "key obrigatório").max(100),
  value: z.boolean("value deve ser boolean"),
});

// ===== Admin — Settings =====
export const settingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(1000),
});

// ===== Admin — Ads =====
export const adCreateSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(80),
  description: z.string().max(150).optional(),
  cta: z.string().max(20).optional(),
  url: z.string().max(500).optional(),
  imageUrl: z.string().max(2048).optional(),
  bgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  placement: z.enum(["banner_top", "card_list", "splash"]),
  active: z.boolean().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

// ===== Admin — Offers =====
export const offerCreateSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(200),
  description: z.string().max(500).optional(),
  price: z.number().min(0, "Preço deve ser positivo"),
  originalPrice: z.number().min(0).optional(),
  imageUrl: z.string().min(1, "Imagem obrigatória").max(2048),
  videoUrl: z.string().max(500).optional(),
  productUrl: z.string().min(1, "URL do produto obrigatória").max(500),
  category: z.string().max(50).optional(),
  proOnly: z.boolean().optional(),
  active: z.boolean().optional(),
});

// ===== Admin — Outbound =====
export const outboundTemplateSchema = z.object({
  name: z.string().min(1, "name obrigatório").max(150),
  channel: z.enum(["email", "whatsapp", "linkedin", "phone"]),
  segment: z.string().max(100).optional(),
  objective: z.enum(["permission", "discovery", "proposal", "follow_up", "renewal"]),
  subject: z.string().max(200).optional(),
  body: z.string().min(1, "body obrigatório"),
  cta: z.string().max(200).optional(),
  optOutText: z.string().max(200).optional(),
  variables: z.string().max(500).optional(),
  status: z.enum(["draft", "approved", "paused", "archived"]).optional(),
  notes: z.string().max(2000).optional(),
});

export const outboundPrepareSchema = z.object({
  items: z.array(z.object({
    partnerId: z.string().min(1),
    contactId: z.string().min(1),
    templateId: z.string().min(1),
    channel: z.enum(["email", "whatsapp", "linkedin", "phone"]),
  })).min(1, "Pelo menos 1 item").max(100, "Máximo 100 itens"),
});

export const outboundClassifySchema = z.object({
  method: z.enum(["manual", "ai"]),
  classification: z.enum([
    "permission_to_send", "interessado", "pricing_question",
    "meeting_ready", "opt_out", "nurture_future", "ambiguous", "risk",
  ]).optional(),
  responseText: z.string().max(5000).optional(),
});

// ===== Admin — Proposals =====
export const proposalCreateSchema = z.object({
  partnerId: z.string().min(1, "partnerId obrigatório"),
  opportunityId: z.string().optional(),
  title: z.string().min(1, "title obrigatório").max(200),
  body: z.string().min(1, "body obrigatório"),
  summary: z.string().max(1000).optional(),
  billingModel: z.enum(["campaign", "lead", "both"]).optional(),
  campaignPrice: z.number().min(0).optional(),
  leadPrice: z.number().min(0).optional(),
  validUntil: z.string().optional(),
  notes: z.string().max(2000).optional(),
  fromTemplate: z.string().max(100).optional(),
});

// ===== Admin — Partner Campaigns =====
export const campaignCreateSchema = z.object({
  partnerId: z.string().min(1, "partnerId obrigatório"),
  proposalId: z.string().optional(),
  name: z.string().min(1, "name obrigatório").max(150),
  description: z.string().max(500).optional(),
  offerTitle: z.string().min(1, "offerTitle obrigatório").max(100),
  offerDescription: z.string().min(1, "offerDescription obrigatório").max(500),
  offerCta: z.string().max(30).optional(),
  offerUrl: z.string().min(1, "offerUrl obrigatório").max(500),
  couponCode: z.string().max(50).optional(),
  discountText: z.string().max(50).optional(),
  imageUrl: z.string().max(500).optional(),
  videoUrl: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  proOnly: z.boolean().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  billingModel: z.enum(["campaign", "lead", "both"]).optional(),
  campaignPrice: z.number().min(0).optional(),
  leadPrice: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

// ===== Admin — Teams =====
export const teamCreateSchema = z.object({
  name: z.string().min(1, "name obrigatório").max(100),
  description: z.string().max(500).optional(),
  companyName: z.string().max(150).optional(),
  cnpj: z.string().max(20).optional(),
  managerName: z.string().max(100).optional(),
  managerEmail: z.string().email("Email inválido").max(100).optional().or(z.literal("")),
  managerPhone: z.string().max(30).optional(),
  maxMembers: z.number().min(1).max(1000).optional(),
});

export const teamInviteSchema = z.object({
  email: z.string().email("Email inválido").max(200),
  name: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  role: z.enum(["owner", "admin", "member"]).optional(),
});

// ===== Admin — Partner Portal Token =====
export const portalTokenCreateSchema = z.object({
  partnerId: z.string().min(1, "partnerId obrigatório"),
  canViewCampaigns: z.boolean().optional(),
  canViewMetrics: z.boolean().optional(),
  canViewProposals: z.boolean().optional(),
  expiresAt: z.string().optional(),
});

// ===== Public — Tracking =====
export const trackEventSchema = z.object({
  event: z.enum(["view", "click"]),
});

// ===== Helper — valida e retorna dados ou erro =====
export function validateOrError<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.issues[0]?.message ?? "Dados inválidos",
  };
}
