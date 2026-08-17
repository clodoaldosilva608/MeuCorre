-- =====================================================================
-- MeuCorre — Atualizar URLs reais dos produtos Kiwify
-- =====================================================================
-- Execute no Supabase Dashboard → SQL Editor → New query
--
-- Atualiza as URLs dos 3 produtos com os links reais de checkout da Kiwify
-- (confirmados na sessão de 17/08/2026)
-- =====================================================================

-- Produto 1: E-book "10 Erros" (R$ 27) — 50% comissão para afiliados
UPDATE "AffiliateProduct" SET
  "url" = 'https://pay.kiwify.com.br/D7AebQz',
  "notes" = 'Produto ativo na Kiwify. Entrega automática via Área de Membros. Afiliados habilitados: 50% comissão, cookie 30 dias. Link real confirmado em 17/08/2026.',
  "active" = true,
  "featured" = true,
  "updatedAt" = NOW()
WHERE "id" = 'ebook_financas_entregador';

-- Produto 2: E-book "Gestão Financeira" (R$ 97) — 30% comissão para afiliados
UPDATE "AffiliateProduct" SET
  "url" = 'https://pay.kiwify.com.br/qUmn5jr',
  "notes" = 'Produto ativo na Kiwify. Entrega automática via Área de Membros. Afiliados habilitados: 30% comissão, cookie 30 dias. Link real confirmado em 17/08/2026.',
  "active" = true,
  "featured" = true,
  "updatedAt" = NOW()
WHERE "id" = 'course_gestao_financas';

-- Produto 3: Curso Premium (R$ 247) — 30% comissão para afiliados
UPDATE "AffiliateProduct" SET
  "url" = 'https://pay.kiwify.com.br/Ku7IAdQ',
  "notes" = 'Produto ativo na Kiwify. Entrega automática via Área de Membros (Módulo 1 publicado). Afiliados habilitados: 30% comissão, cookie 30 dias. Link real confirmado em 17/08/2026. Módulos 2-15 pendentes de produção.',
  "active" = true,
  "featured" = true,
  "price" = 247.00,
  "updatedAt" = NOW()
WHERE "id" = 'course_premium_avancado';

-- Verificação final
SELECT
  id,
  name,
  price,
  url,
  active,
  featured,
  notes
FROM "AffiliateProduct"
WHERE id IN ('ebook_financas_entregador', 'course_gestao_financas', 'course_premium_avancado')
ORDER BY price;

-- Resultado esperado: 3 linhas com URLs reais (pay.kiwify.com.br/...)
