-- ===== MeuCorre — RLS (Row Level Security) no Supabase =====
--
-- EXECUTAR ESTE SCRIPT NO SUPABASE SQL EDITOR:
-- https://supabase.com/dashboard/project/PROJECT_REF/sql/new
--
-- Este script habilita RLS em TODAS as tabelas e cria policies básicas.
-- O MeuCorre usa Prisma (server-side) com service_role, que bypassa RLS.
-- RLS é uma camada DE SEGURANÇA ADICIONAL — protege contra acesso direto ao banco.
--
-- IMPORTANTE: O MeuCorre NÃO usa o client do Supabase no frontend.
-- Toda comunicação passa por API Routes (Next.js server-side) com Prisma.
-- RLS é uma defesa em profundidade (defense-in-depth).

-- ===== 1. HABILITAR RLS EM TODAS AS TABELAS =====

ALTER TABLE public."Ad" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Offer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SyncedGoal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SyncedWorkSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SyncedDelivery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SyncedExpense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BlogPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Setting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AdminAction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ReferralCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Referral" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ReferralCampaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Campaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PromotionPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PromotionAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SocialChannel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PromotionReminder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Partner" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PartnerContact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Opportunity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PartnerActivity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PartnerLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Proposal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CommercialAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PartnerCampaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OutboundTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OutboundLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TeamMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TeamInvite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PartnerPortalToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RadarAlert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ScoreSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ChallengeParticipant" ENABLE ROW LEVEL SECURITY;

-- ===== 2. POLICIES — TABELAS PÚBLICAS (leitura sem auth) =====

-- BlogPost: leitura pública (posts publicados)
CREATE POLICY "blog_public_read" ON public."BlogPost" FOR SELECT USING (true);

-- Ad: leitura pública (anúncios ativos)
CREATE POLICY "ads_public_read" ON public."Ad" FOR SELECT USING (active = true);

-- Offer: leitura pública (ofertas ativas)
CREATE POLICY "offers_public_read" ON public."Offer" FOR SELECT USING (active = true);

-- SocialChannel: leitura pública (canais oficiais)
CREATE POLICY "channels_public_read" ON public."SocialChannel" FOR SELECT USING (active = true);

-- ReferralCampaign: leitura pública (campanha de indicação ativa)
CREATE POLICY "referral_campaign_public_read" ON public."ReferralCampaign" FOR SELECT USING (true);

-- ===== 3. POLICIES — TABELAS DE USUÁRIO (só dono vê) =====

-- User: só o próprio usuário pode ver/editar seus dados
CREATE POLICY "users_self_select" ON public."User" FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "users_self_update" ON public."User" FOR UPDATE USING (auth.uid()::text = id);

-- SyncedGoal: só dono
CREATE POLICY "synced_goals_owner" ON public."SyncedGoal" FOR ALL USING (auth.uid()::text = "userId");

-- SyncedWorkSession: só dono
CREATE POLICY "synced_work_sessions_owner" ON public."SyncedWorkSession" FOR ALL USING (auth.uid()::text = "userId");

-- SyncedDelivery: só dono
CREATE POLICY "synced_deliveries_owner" ON public."SyncedDelivery" FOR ALL USING (auth.uid()::text = "userId");

-- SyncedExpense: só dono
CREATE POLICY "synced_expenses_owner" ON public."SyncedExpense" FOR ALL USING (auth.uid()::text = "userId");

-- RadarAlert: só dono
CREATE POLICY "radar_alerts_owner" ON public."RadarAlert" FOR ALL USING (auth.uid()::text = "userId");

-- ScoreSnapshot: só dono
CREATE POLICY "score_snapshots_owner" ON public."ScoreSnapshot" FOR ALL USING (auth.uid()::text = "userId");

-- ChallengeParticipant: só dono
CREATE POLICY "challenge_participant_owner" ON public."ChallengeParticipant" FOR ALL USING (auth.uid()::text = "userId");

-- PasswordResetToken: negar tudo via RLS (só acessível via service_role)
CREATE POLICY "password_reset_deny" ON public."PasswordResetToken" FOR ALL USING (false);

-- ===== 4. POLICIES — TABELAS ADMIN (negar acesso via client) =====

-- Todas as tabelas admin são acessíveis APENAS via service_role (server-side)
-- O client do Supabase (anon key) não consegue ler/escrever

CREATE POLICY "admin_only_ad" ON public."Ad" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_subscription" ON public."Subscription" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_adevent" ON public."AdEvent" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_feedback" ON public."Feedback" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_setting" ON public."Setting" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_adminuser" ON public."AdminUser" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_adminaction" ON public."AdminAction" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_referralcode" ON public."ReferralCode" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_referral" ON public."Referral" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_lead" ON public."Lead" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_campaign" ON public."Campaign" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_promotion_post" ON public."PromotionPost" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_promotion_asset" ON public."PromotionAsset" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_promotion_reminder" ON public."PromotionReminder" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_partner" ON public."Partner" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_partner_contact" ON public."PartnerContact" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_opportunity" ON public."Opportunity" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_partner_activity" ON public."PartnerActivity" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_partner_log" ON public."PartnerLog" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_proposal" ON public."Proposal" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_commercial_asset" ON public."CommercialAsset" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_partner_campaign" ON public."PartnerCampaign" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_outbound_template" ON public."OutboundTemplate" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_outbound_log" ON public."OutboundLog" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_team" ON public."Team" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_team_member" ON public."TeamMember" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_team_invite" ON public."TeamInvite" FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin_only_partner_portal_token" ON public."PartnerPortalToken" FOR ALL USING (false) WITH CHECK (false);

-- ===== 5. REMOVER POLICIES DE LEITURA PÚBLICA QUE CONFLITAM =====
-- As policies "public_read" acima usam true para SELECT, mas as "admin_only" 
-- usam false para ALL. Como RLS usa OR entre policies, o SELECT público prevalece.
-- Para tabelas que NÃO devem ser públicas, removemos a policy de leitura:

-- Ad: já tem ads_public_read (SELECT true WHERE active=true) — OK
-- Offer: já tem offers_public_read (SELECT true WHERE active=true) — OK
-- BlogPost: já tem blog_public_read (SELECT true) — OK
-- SocialChannel: já tem channels_public_read (SELECT true WHERE active=true) — OK

-- ===== NOTAS =====
-- 1. O MeuCorre usa Prisma com service_role (server-side), que BYPASSA RLS.
--    RLS protege contra acesso direto via Supabase client (anon key).
-- 2. O frontend NUNCA usa Supabase client diretamente — tudo passa por API Routes.
-- 3. Esta é uma camada de DEFESA EM PROFUNDIDADE (defense-in-depth).
-- 4. Se alguém roubar a anon key (que é pública), RLS impede acesso a dados sensíveis.
