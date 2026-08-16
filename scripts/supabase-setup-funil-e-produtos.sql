-- =====================================================================
-- MeuCorre — Setup Funil WhatsApp + Atualização de Produtos
-- =====================================================================
-- Execute no Supabase Dashboard → SQL Editor → New query
--
-- 1. Adiciona grupo secundário WhatsApp (funil)
-- 2. Atualiza produtos com URLs reais do Kiwify (afiliados)
-- 3. Adiciona curso premium avançado
-- =====================================================================

-- 1. Adiciona grupo WhatsApp secundário (funil)
INSERT INTO "SocialProfile" ("id", "platform", "handle", "url", "displayName", "bio", "description", "monetization", "contentStrategy", "postFrequency", "bestTimes", "active", "brandColor", "notes", "updatedAt")
VALUES
  ('seed_whatsapp_funil', 'whatsapp', 'MeuCorre VIP (Funil)', 'https://chat.whatsapp.com/PLACEHOLDER_VIP', 'MeuCorre VIP',
   'Grupo VIP: sinais de horários bons, alertas de promoções e suporte prioritário. R$ 9,90/mês.',
   'GRUPO SECUNDÁRIO — Funil vinculado ao grupo principal. Topo do funil: membros VIP pagantes (R$ 9,90/mês) indicam novos membros para o grupo principal (gratuito). Grupo principal faz onboarding para o app MeuCorre. Estrutura: Grupo VIP (pago) → Grupo Principal (gratuito) → App MeuCorre. ATUALIZAR URL quando criar o grupo VIP no WhatsApp Business.',
   'products', 'Sinais diários + suporte prioritário + bastidores', 'Diário (manhã, almoço, noite)', '7h, 12h, 19h, 22h', true, '#25D366', 'FUNIL: VIP pago (R$ 9,90/mês) → indica para grupo principal gratuito → onboarding para app. Meta: 100 assinantes VIP = R$ 990/mês recorrente.', NOW())
ON CONFLICT ("platform") DO UPDATE SET
  "handle" = EXCLUDED."handle",
  "url" = EXCLUDED."url",
  "displayName" = EXCLUDED."displayName",
  "bio" = EXCLUDED."bio",
  "description" = EXCLUDED."description",
  "notes" = EXCLUDED."notes",
  "updatedAt" = NOW();

-- 2. Atualiza e-book "10 Erros" com URL do Kiwify (substitua PLACEHOLDER pelo slug real)
UPDATE "AffiliateProduct" SET
  "url" = 'https://pay.kiwify.com.br/PLACEHOLDER_10_ERROS',
  "notes" = 'E-book criado! 20+ páginas. Substituir PLACEHOLDER pelo slug real do Kiwify após criar o produto.',
  "updatedAt" = NOW()
WHERE "id" = 'ebook_financas_entregador';

-- 3. Atualiza curso/e-book "Gestão Financeira" com URL do Kiwify
UPDATE "AffiliateProduct" SET
  "url" = 'https://pay.kiwify.com.br/PLACEHOLDER_GESTAO_FINANCAS',
  "notes" = 'E-book criado! 60+ páginas. Substituir PLACEHOLDER pelo slug real do Kiwify após criar o produto.',
  "updatedAt" = NOW()
WHERE "id" = 'course_gestao_financas';

-- 4. Adiciona curso premium avançado (R$ 247)
INSERT INTO "AffiliateProduct" ("id", "type", "name", "description", "url", "price", "commission", "category", "platform", "active", "featured", "sortOrder", "notes", "updatedAt")
VALUES
  ('course_premium_avancado', 'course', 'Curso Premium Avançado: Negócio de Entregador',
   'Curso completo de 15 módulos (150 capítulos). De hobby a profissão: gestão financeira avançada, multi-app, frota, MEI, IR, investimentos e escala do negócio de entrega.',
   'https://pay.kiwify.com.br/PLACEHOLDER_PREMIUM',
   247.00, null, 'cursos', 'kiwify', true, true, 1,
   'Curso premium com 15 módulos × 10 capítulos × 16 páginas = 2.400 páginas. Estrutura completa + Módulo 1 já escrito. Substituir PLACEHOLDER pelo slug real do Kiwify.',
   NOW())
ON CONFLICT (id) DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "price" = EXCLUDED."price",
  "featured" = EXCLUDED."featured",
  "notes" = EXCLUDED."notes",
  "updatedAt" = NOW();

-- 5. Verificação
SELECT id, type, name, price, featured, active
FROM "AffiliateProduct"
ORDER BY "featured" DESC, "sortOrder" ASC;

SELECT id, platform, handle, "displayName"
FROM "SocialProfile"
WHERE platform = 'whatsapp';
