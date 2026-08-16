-- =====================================================================
-- MeuCorre — Criar tabelas SocialProfile e SocialMetric
-- =====================================================================
-- Execute no Supabase Dashboard → SQL Editor → New query
--
-- Cria 2 tabelas para gerenciar redes sociais do MeuCorre:
-- - SocialProfile: perfis (Instagram, TikTok, YouTube, etc.)
-- - SocialMetric: métricas históricas para análise de crescimento
-- =====================================================================

-- SocialProfile: perfis de redes sociais
CREATE TABLE IF NOT EXISTS "SocialProfile" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "displayName" TEXT NOT NULL DEFAULT 'MeuCorre',
    "bio" TEXT,
    "description" TEXT,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,
    "posts" INTEGER NOT NULL DEFAULT 0,
    "monetization" TEXT,
    "monetizationNotes" TEXT,
    "contentStrategy" TEXT,
    "postFrequency" TEXT,
    "bestTimes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "brandColor" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncAt" TIMESTAMP(3),

    CONSTRAINT "SocialProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SocialProfile_platform_key" ON "SocialProfile"("platform");
CREATE INDEX IF NOT EXISTS "SocialProfile_platform_active_idx" ON "SocialProfile"("platform", "active");

-- SocialMetric: métricas históricas
CREATE TABLE IF NOT EXISTS "SocialMetric" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followers" INTEGER NOT NULL,
    "engagement" DOUBLE PRECISION,
    "reach" INTEGER,
    "impressions" INTEGER,
    "revenue" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialMetric_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SocialMetric_profileId_measuredAt_idx" ON "SocialMetric"("profileId", "measuredAt");

-- Foreign Key: SocialMetric → SocialProfile
ALTER TABLE "SocialMetric" ADD CONSTRAINT IF NOT EXISTS "SocialMetric_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "SocialProfile"("id") ON DELETE CASCADE;

-- =====================================================================
-- Seed inicial: redes sociais existentes do MeuCorre
-- =====================================================================

INSERT INTO "SocialProfile" ("id", "platform", "handle", "url", "displayName", "bio", "description", "monetization", "contentStrategy", "postFrequency", "bestTimes", "active", "brandColor", "updatedAt")
VALUES
  ('seed_instagram', 'instagram', '@meucorr', 'https://www.instagram.com/meucorr', 'MeuCorre',
   '📱 App de gestão financeira para entregadores de app. Controle corridas, despesas e lucro real. 100% offline. Baixe grátis!',
   'Instagram principal do MeuCorre. Foco em carrosséis educativos sobre finanças para entregadores, reels de dicas rápidas e stories do dia a dia.',
   'ads', 'Carrosséis educativos + Reels de dicas + Stories bastidores', '1x/dia carrossel + 3x/semana Reels', '12h, 19h, 21h', true, '#E1306C', NOW())
ON CONFLICT ("platform") DO NOTHING;

INSERT INTO "SocialProfile" ("id", "platform", "handle", "url", "displayName", "bio", "description", "monetization", "contentStrategy", "postFrequency", "bestTimes", "active", "brandColor", "updatedAt")
VALUES
  ('seed_tiktok', 'tiktok', '@meucorr', 'https://www.tiktok.com/@meucorr', 'MeuCorre',
   'Controle suas corridas e despesas 🏍️ Dicas de finanças para entregadores de app. App grátis no link da bio!',
   'TikTok principal do MeuCorre. Vídeos curtos (15-60s) com dicas de finanças, bastidores de entregador, trends adaptadas para o nicho.',
   'ads', 'Trends + dicas rápidas + bastidores', '2x/dia', '12h, 19h, 22h', true, '#000000', NOW())
ON CONFLICT ("platform") DO NOTHING;

INSERT INTO "SocialProfile" ("id", "platform", "handle", "url", "displayName", "bio", "description", "monetization", "contentStrategy", "postFrequency", "bestTimes", "active", "brandColor", "updatedAt")
VALUES
  ('seed_youtube', 'youtube', '@meucorre-z4j', 'https://youtube.com/@meucorre-z4j', 'MeuCorre',
   'App de gestão financeira para entregadores de aplicativo. Tutoriais, dicas de economia e histórias reais de quem vive da entrega.',
   'Canal principal do MeuCorre. Vídeos longos (8-15min) com tutoriais do app, histórias de entregadores, comparativos de plataformas.',
   'ads', 'Tutoriais longos + Shorts + histórias reais', '2x/semana vídeo longo + 3x/semana Shorts', '18h, 20h', true, '#FF0000', NOW())
ON CONFLICT ("platform") DO NOTHING;

INSERT INTO "SocialProfile" ("id", "platform", "handle", "url", "displayName", "bio", "description", "monetization", "contentStrategy", "postFrequency", "bestTimes", "active", "brandColor", "updatedAt")
VALUES
  ('seed_facebook', 'facebook', 'MeuCorre', 'https://www.facebook.com/share/1QqGSn22NC/', 'MeuCorre',
   'App de gestão financeira para entregadores de aplicativo. Controle corridas, despesas e lucro real.',
   'Página do Facebook para distribuição de conteúdo do blog e reposts do Instagram. Foco em grupos de entregadores.',
   'ads', 'Reposts Instagram + artigos do blog + grupos', '3x/semana', '10h, 14h, 19h', true, '#1877F2', NOW())
ON CONFLICT ("platform") DO NOTHING;

INSERT INTO "SocialProfile" ("id", "platform", "handle", "url", "displayName", "bio", "description", "monetization", "contentStrategy", "postFrequency", "bestTimes", "active", "brandColor", "updatedAt")
VALUES
  ('seed_whatsapp', 'whatsapp', 'Grupo MeuCorre', 'https://chat.whatsapp.com/FOH9IYGwee19NIYOSEVe3z', 'MeuCorre',
   'Grupo no WhatsApp para entregadores trocarem experiências, dicas e tirarem dúvidas sobre o app.',
   'Grupo comunitário no WhatsApp. Espaço para suporte, networking e feedback dos usuários.',
   'none', 'Suporte + networking + feedback', 'Diário (moderação)', 'Durante o dia', true, '#25D366', NOW())
ON CONFLICT ("platform") DO NOTHING;

INSERT INTO "SocialProfile" ("id", "platform", "handle", "url", "displayName", "bio", "description", "monetization", "contentStrategy", "postFrequency", "bestTimes", "active", "brandColor", "updatedAt")
VALUES
  ('seed_telegram', 'telegram', '@meucorre', 'https://t.me/meucorre', 'MeuCorre',
   'Canal no Telegram com dicas rápidas, atualizações do app e avisos importantes para entregadores.',
   'Canal de broadcast no Telegram para avisos, dicas e novidades. Foco em entrega de conteúdo curto e direto.',
   'none', 'Broadcast de dicas + novidades', '3x/semana', '10h, 18h', true, '#0088CC', NOW())
ON CONFLICT ("platform") DO NOTHING;

INSERT INTO "SocialProfile" ("id", "platform", "handle", "url", "displayName", "bio", "description", "monetization", "contentStrategy", "postFrequency", "bestTimes", "active", "brandColor", "updatedAt")
VALUES
  ('seed_twitter', 'twitter', '@meucorre', 'https://twitter.com/meucorre', 'MeuCorre',
   'App de gestão para entregadores de app. Dicas de finanças, economia e produtividade.',
   'Twitter/X para distribuição de conteúdo curto, threads educativas e interação com a comunidade de entregadores.',
   'ads', 'Threads + dicas curtas + interação', '1-2x/dia', '8h, 12h, 19h', false, '#000000', NOW())
ON CONFLICT ("platform") DO NOTHING;

-- =====================================================================
-- Habilitar RLS nas novas tabelas (consistência com as outras 43)
-- =====================================================================
ALTER TABLE "SocialProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialProfile" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_anon_SocialProfile" ON "SocialProfile";
CREATE POLICY "deny_all_anon_SocialProfile" ON "SocialProfile"
  FOR ALL USING (false) WITH CHECK (false);

ALTER TABLE "SocialMetric" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialMetric" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deny_all_anon_SocialMetric" ON "SocialMetric";
CREATE POLICY "deny_all_anon_SocialMetric" ON "SocialMetric"
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
  AND c.relname IN ('SocialProfile', 'SocialMetric')
ORDER BY c.relname;

-- Resultado esperado: 2 linhas com rls_enabled = true e rls_forced = true
