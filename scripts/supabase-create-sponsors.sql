-- MeuCorre — Criar tabela Sponsor (Marcas Patrocinadas)
-- Execute no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "Sponsor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "bannerLink" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "whatsapp" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "showInCarousel" BOOLEAN NOT NULL DEFAULT true,
    "showBanner" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Sponsor_active_showInCarousel_idx" ON "Sponsor"("active", "showInCarousel");
CREATE INDEX IF NOT EXISTS "Sponsor_active_showBanner_idx" ON "Sponsor"("active", "showBanner");

-- Habilitar RLS
ALTER TABLE "Sponsor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sponsor" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_anon_Sponsor" ON "Sponsor";
CREATE POLICY "deny_all_anon_Sponsor" ON "Sponsor"
  FOR ALL USING (false) WITH CHECK (false);

-- Seed: 5 marcas fictícias com dados de exemplo (sem logo — admin faz upload)
INSERT INTO "Sponsor" ("id", "name", "description", "category", "website", "active", "showInCarousel", "showBanner", "sortOrder", "updatedAt")
VALUES
  ('sponsor_1', 'MotoParts BR', 'Peças e acessórios para moto com desconto exclusivo', 'Acessórios', 'https://motoparts.com.br', true, true, false, 1, NOW()),
  ('sponsor_2', 'MotoSeguro', 'Seguro de moto com preço especial para entregadores', 'Seguros', 'https://motoseguro.com.br', true, true, false, 2, NOW()),
  ('sponsor_3', 'RotaCerta GPS', 'App de navegação otimizado para motos', 'Tecnologia', 'https://rotacerta.com.br', true, true, false, 3, NOW()),
  ('sponsor_4', 'Mochilas Táticas', 'Mochilas térmicas resistentes para entrega', 'Equipamentos', 'https://mochilastaticas.com.br', true, true, false, 4, NOW()),
  ('sponsor_5', 'Gasolina+', 'Postos com desconto para entregadores', 'Combustível', 'https://gasolinamais.com.br', true, true, false, 5, NOW())
ON CONFLICT (id) DO NOTHING;

SELECT id, name, category, "logoUrl", active, "showInCarousel", "showBanner"
FROM "Sponsor"
ORDER BY "sortOrder";
