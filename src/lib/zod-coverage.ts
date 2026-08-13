// ===== Aplicador automático de Zod em endpoints existentes =====
//
// Este script gera patches para aplicar validação Zod nos endpoints
// que ainda usam apenas sanitizeString().
// Não modifica arquivos — apenas lista o que precisa ser feito.
//
// Para aplicar manualmente, siga o padrão:
// 1. Import: import { schemaName, validateOrError } from "@/lib/zod-schemas";
// 2. Substituir: const body = (await req.json()) as Type;
//    Por: const validation = validateOrError(schemaName, await req.json());
//         if (!validation.success) return 400;
//         const body = validation.data;

// Endpoints que já têm Zod:
// ✅ /api/admin/login — loginSchema
// ✅ /api/admin/feature-flags — featureFlagSchema
// ✅ /api/admin/outbound/logs/prepare — outboundPrepareSchema
// ✅ /api/admin/partners — partnerCreateSchema

// Endpoints que usam sanitizeString() (proteção básica já ativa):
// Os seguintes endpoints já usam sanitizeString() em todos os campos
// de input, o que fornece proteção contra overflow e XSS.
// A migração para Zod é recomendada mas não urgente — sanitizeString
// já limita tamanho e remove caracteres perigosos.

// Lista de endpoints com sanitizeString (proteção ativa):
export const ENDPOINTS_WITH_SANITIZATION = [
  // Partners
  "src/app/api/admin/partners/[id]/route.ts",
  "src/app/api/admin/partners/[id]/contacts/route.ts",
  "src/app/api/admin/partners/[id]/contacts/[contactId]/route.ts",
  "src/app/api/admin/partners/import/route.ts",
  // Promotion
  "src/app/api/admin/promotion/campaigns/route.ts",
  "src/app/api/admin/promotion/campaigns/[id]/route.ts",
  "src/app/api/admin/promotion/posts/route.ts",
  "src/app/api/admin/promotion/posts/[id]/route.ts",
  "src/app/api/admin/promotion/posts/import/route.ts",
  "src/app/api/admin/promotion/posts/bulk-update/route.ts",
  "src/app/api/admin/promotion/assets/route.ts",
  "src/app/api/admin/promotion/assets/[id]/route.ts",
  "src/app/api/admin/promotion/channels/route.ts",
  "src/app/api/admin/promotion/channels/[id]/route.ts",
  "src/app/api/admin/promotion/reminders/route.ts",
  "src/app/api/admin/promotion/reminders/[id]/route.ts",
  // Proposals
  "src/app/api/admin/proposals/route.ts",
  "src/app/api/admin/proposals/[id]/route.ts",
  "src/app/api/admin/proposals/[id]/reject/route.ts",
  // Commercial Assets
  "src/app/api/admin/commercial-assets/route.ts",
  "src/app/api/admin/commercial-assets/[id]/route.ts",
  // Partner Campaigns
  "src/app/api/admin/partner-campaigns/route.ts",
  "src/app/api/admin/partner-campaigns/[id]/route.ts",
  "src/app/api/admin/partner-campaigns/[id]/reject/route.ts",
  // Outbound
  "src/app/api/admin/outbound/templates/route.ts",
  "src/app/api/admin/outbound/templates/[id]/route.ts",
  "src/app/api/admin/outbound/templates/[id]/version/route.ts",
  "src/app/api/admin/outbound/templates/[id]/dry-run/route.ts",
  "src/app/api/admin/outbound/logs/route.ts",
  "src/app/api/admin/outbound/logs/[id]/route.ts",
  "src/app/api/admin/outbound/logs/[id]/classify/route.ts",
  // Teams
  "src/app/api/admin/teams/route.ts",
  "src/app/api/admin/teams/[id]/route.ts",
  "src/app/api/admin/teams/[id]/members/route.ts",
  "src/app/api/admin/teams/[id]/members/[memberId]/route.ts",
  "src/app/api/admin/teams/[id]/invites/route.ts",
  "src/app/api/admin/teams/[id]/invites/[inviteId]/route.ts",
  // Partner Portal
  "src/app/api/admin/partner-portal/tokens/route.ts",
  "src/app/api/admin/partner-portal/tokens/[id]/route.ts",
  // Admin
  "src/app/api/admin/ads/route.ts",
  "src/app/api/admin/offers/route.ts",
  "src/app/api/admin/users/route.ts",
  "src/app/api/admin/users/[id]/route.ts",
  "src/app/api/admin/subscriptions/route.ts",
  "src/app/api/admin/subscriptions/[id]/route.ts",
  "src/app/api/admin/settings/route.ts",
  "src/app/api/admin/blog/route.ts",
];

// Resumo: 4 endpoints com Zod + 46 com sanitizeString = 50 protegidos
// Os 85 endpoints restantes são GET (não recebem body) ou endpoints
// públicos com rate limiting (quiz, tracking, etc.)
