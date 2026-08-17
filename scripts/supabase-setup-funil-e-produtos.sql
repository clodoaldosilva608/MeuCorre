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

-- 2. Atualiza e-book "10 Erros" com URL real do Kiwify
UPDATE "AffiliateProduct" SET
  "url" = 'https://pay.kiwify.com.br/D7AebQz',
  "notes" = 'E-book criado e ativo na Kiwify. Conteúdo publicado na Área de Membros. Afiliados habilitados com 50% de comissão e cookie de 30 dias.',
  "updatedAt" = NOW()
WHERE "id" = 'ebook_financas_entregador';

-- 3. Atualiza e-book "Gestão Financeira" com URL real do Kiwify
UPDATE "AffiliateProduct" SET
  "url" = 'https://pay.kiwify.com.br/qUmn5jr',
  "notes" = 'E-book criado e ativo na Kiwify. Conteúdo publicado na Área de Membros. Afiliados habilitados com 30% de comissão e cookie de 30 dias.',
  "updatedAt" = NOW()
WHERE "id" = 'course_gestao_financas';

-- 4. Adiciona ou atualiza curso premium avançado (R$ 247)
INSERT INTO "AffiliateProduct" ("id", "type", "name", "description", "url", "price", "commission", "category", "platform", "active", "featured", "sortOrder", "notes", "updatedAt")
VALUES
  ('course_premium_avancado', 'course', 'Curso Premium Avançado: Negócio de Entregador',
   'Curso completo de 15 módulos (150 capítulos). De hobby a profissão: gestão financeira avançada, multi-app, frota, MEI, IR, investimentos e escala do negócio de entrega.',
   'https://pay.kiwify.com.br/Ku7IAdQ',
   247.00, 30.00, 'cursos', 'kiwify', true, true, 1,
   'Curso premium ativo na Kiwify. Conteúdo do Módulo 1 publicado na Área de Membros. Afiliados habilitados com 30% de comissão e cookie de 30 dias.',
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
