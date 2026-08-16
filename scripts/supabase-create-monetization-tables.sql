-- =====================================================================
-- MeuCorre — Criar tabelas AffiliateProduct e RevenueEntry
-- =====================================================================
-- Execute no Supabase Dashboard → SQL Editor → New query
--
-- Cria 2 tabelas para gerenciar monetização:
-- - AffiliateProduct: produtos de afiliados e digitais próprios
-- - RevenueEntry: tracking de receita por canal
-- =====================================================================

CREATE TABLE IF NOT EXISTS "AffiliateProduct" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "price" DOUBLE PRECISION,
    "commission" DOUBLE PRECISION,
    "category" TEXT,
    "platform" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateProduct_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AffiliateProduct_type_active_idx" ON "AffiliateProduct"("type", "active");
CREATE INDEX IF NOT EXISTS "AffiliateProduct_category_active_idx" ON "AffiliateProduct"("category", "active");
CREATE INDEX IF NOT EXISTS "AffiliateProduct_featured_active_idx" ON "AffiliateProduct"("featured", "active");

CREATE TABLE IF NOT EXISTS "RevenueEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "productId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RevenueEntry_source_date_idx" ON "RevenueEntry"("source", "date");
CREATE INDEX IF NOT EXISTS "RevenueEntry_date_idx" ON "RevenueEntry"("date");

-- =====================================================================
-- Seed: produtos de afiliados sugeridos (placeholder)
-- =====================================================================

INSERT INTO "AffiliateProduct" ("id", "type", "name", "description", "url", "price", "commission", "category", "platform", "active", "featured", "sortOrder", "notes", "updatedAt")
VALUES
  ('aff_mochila_hidratacao', 'affiliate', 'Mochila Hidratação Tática Moto', 'Mochila impermeável com bolsa de hidratação 2L para entregadores', 'https://shopee.com.br/search?keyword=mochila+moto+hidratacao', 89.90, 8.0, 'moto_acessorios', 'shopee', true, true, 1, 'Substituir por link de afiliado real quando cadastrar no Shopee Afiliados', NOW()),
  ('aff_celular_suporte', 'affiliate', 'Suporte de Celular para Moto', 'Suporte antivibração universal para GPS/celular na moto', 'https://shopee.com.br/search?keyword=suporte+celular+moto', 35.00, 10.0, 'moto_acessorios', 'shopee', true, true, 2, 'Substituir por link de afiliado real', NOW()),
  ('aff_capacete', 'affiliate', 'Capacete Integrável Bluetooth', 'Capacete com comunicação Bluetooth para chamadas e GPS', 'https://shopee.com.br/search?keyword=capacete+bluetooth', 299.00, 6.0, 'moto_acessorios', 'shopee', true, false, 3, 'Ticket alto — boa comissão', NOW()),
  ('aff_capa_chuva', 'affiliate', 'Capa de Chuva Moto Reforçada', 'Capa impermeável reforçada para entregas na chuva', 'https://shopee.com.br/search?keyword=capa+chuva+moto', 79.90, 9.0, 'moto_acessorios', 'shopee', true, false, 4, 'Essencial para entregadores', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "AffiliateProduct" ("id", "type", "name", "description", "url", "price", "commission", "category", "platform", "active", "featured", "sortOrder", "notes", "updatedAt")
VALUES
  ('course_gestao_financas', 'course', 'Curso Gestão Financeira para Entregadores', 'Curso completo: planilha, videoaulas, suporte. Aprenda a calcular lucro real, otimizar rotas e economizar.', 'https://pay.kiwify.com.br/placeholder', 97.00, null, 'cursos', 'kiwify', true, true, 1, 'Criar checkout real no Kiwify', NOW()),
  ('ebook_financas_entregador', 'ebook', 'E-book: 10 Erros que Entregadores Cometem', 'Guia prático com os 10 erros mais comuns e como evitá-los. PDF de 45 páginas.', 'https://pay.kiwify.com.br/placeholder', 27.00, null, 'ebooks', 'kiwify', true, false, 2, 'Produto de entrada (low-ticket)', NOW()),
  ('toolkit_entregador', 'toolkit', 'Toolkit Completo para Entregadores', 'Bundle: planilha Excel + PDF dedução fiscal + calculadora de lucro por km + checklist manutenção moto', 'https://pay.kiwify.com.br/placeholder', 47.00, null, 'toolkits', 'kiwify', true, true, 3, 'Maior valor percebido', NOW()),
  ('live_mentoria_mensal', 'live', 'Live Mentoria Mensal', 'Live ao vivo no Instagram/YouTube com Q&A, dicas e mentoria. Gravação incluída.', 'https://pay.kiwify.com.br/placeholder', 19.90, null, 'lives', 'kiwify', true, false, 4, 'Receita recorrente mensal', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "AffiliateProduct" ("id", "type", "name", "description", "url", "price", "commission", "category", "platform", "active", "featured", "sortOrder", "notes", "updatedAt")
VALUES
  ('vip_whatsapp', 'subscription', 'WhatsApp VIP - Lista Premium', 'Sinais de horários bons p/ corrida, alertas de promoções, suporte prioritário. Cobrança mensal via Pix.', 'https://wa.me/message/placeholder', 9.90, null, 'assinaturas', 'manual', true, true, 1, 'Receita recorrente — meta 100 assinantes', NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- Habilitar RLS nas novas tabelas (consistência)
-- =====================================================================
ALTER TABLE "AffiliateProduct" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AffiliateProduct" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_anon_AffiliateProduct" ON "AffiliateProduct";
CREATE POLICY "deny_all_anon_AffiliateProduct" ON "AffiliateProduct"
  FOR ALL USING (false) WITH CHECK (false);

ALTER TABLE "RevenueEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RevenueEntry" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_anon_RevenueEntry" ON "RevenueEntry";
CREATE POLICY "deny_all_anon_RevenueEntry" ON "RevenueEntry"
  FOR ALL USING (false) WITH CHECK (false);

-- =====================================================================
-- Verificação final
-- =====================================================================
SELECT
  c.relname AS tablename,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('AffiliateProduct', 'RevenueEntry')
ORDER BY c.relname;

-- Resultado esperado: 2 linhas com rls_enabled = true e rls_forced = true
