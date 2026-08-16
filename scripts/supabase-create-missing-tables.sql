-- =====================================================================
-- MeuCorre — Criar tabelas faltantes no Supabase
-- =====================================================================
-- Você já criou: Ad, User, AdminUser
-- Este script cria as 40 tabelas restantes + índices + foreign keys
--
-- EXECUTE NO: Supabase Dashboard → SQL Editor → New query
-- =====================================================================

-- Subscription (compras do plano vitalício)
CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerPhone" TEXT,
    "buyerCity" TEXT,
    "pixKey" TEXT NOT NULL DEFAULT 'meucorre@pix.com',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 18.90,
    "paymentMethod" TEXT NOT NULL DEFAULT 'pix_manual',
    "receiptUrl" TEXT,
    "receiptNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "licenseKey" TEXT,
    "kiwifyTransactionId" TEXT,
    "kiwifyWebhookData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_buyerEmail_idx" ON "Subscription"("buyerEmail");

-- AdEvent (cliques/views de anúncios)
CREATE TABLE IF NOT EXISTS "AdEvent" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AdEvent_adId_eventType_createdAt_idx" ON "AdEvent"("adId", "eventType", "createdAt");

-- Feedback (feedbacks dos usuários)
CREATE TABLE IF NOT EXISTS "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "userEmail" TEXT,
    "rating" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminReply" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Feedback_status_createdAt_idx" ON "Feedback"("status", "createdAt");

-- Offer (ofertas especiais)
CREATE TABLE IF NOT EXISTS "Offer" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "cta" TEXT NOT NULL DEFAULT 'Aproveitar',
    "url" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- PasswordResetToken (tokens de recuperação de senha)
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- SyncedGoal (metas sincronizadas)
CREATE TABLE IF NOT EXISTS "SyncedGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "period" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncedGoal_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SyncedGoal_userId_idx" ON "SyncedGoal"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "SyncedGoal_userId_localId_key" ON "SyncedGoal"("userId", "localId");

-- SyncedWorkSession (sessões de trabalho sincronizadas)
CREATE TABLE IF NOT EXISTS "SyncedWorkSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "totalKm" DOUBLE PRECISION,
    "totalEarnings" DOUBLE PRECISION,
    "deliveryCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncedWorkSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SyncedWorkSession_userId_idx" ON "SyncedWorkSession"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "SyncedWorkSession_userId_localId_key" ON "SyncedWorkSession"("userId", "localId");

-- SyncedDelivery (corridas sincronizadas)
CREATE TABLE IF NOT EXISTS "SyncedDelivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "app" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "distance" DOUBLE PRECISION,
    "duration" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncedDelivery_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SyncedDelivery_userId_date_idx" ON "SyncedDelivery"("userId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "SyncedDelivery_userId_localId_key" ON "SyncedDelivery"("userId", "localId");

-- SyncedExpense (despesas sincronizadas)
CREATE TABLE IF NOT EXISTS "SyncedExpense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncedExpense_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SyncedExpense_userId_date_idx" ON "SyncedExpense"("userId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "SyncedExpense_userId_localId_key" ON "SyncedExpense"("userId", "localId");

-- BlogPost (posts do blog)
CREATE TABLE IF NOT EXISTS "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "imageUrl" TEXT,
    "tags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "bloggerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE INDEX IF NOT EXISTS "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt");

-- Setting (configurações key-value, usado para feature flags)
CREATE TABLE IF NOT EXISTS "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- AdminAction (log de ações administrativas)
CREATE TABLE IF NOT EXISTS "AdminAction" (
    "id" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "details" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AdminAction_adminEmail_createdAt_idx" ON "AdminAction"("adminEmail", "createdAt");

-- ReferralCode (códigos de indicação)
CREATE TABLE IF NOT EXISTS "ReferralCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ownerId" TEXT,
    "ownerName" TEXT,
    "ownerEmail" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ReferralCode_code_key" ON "ReferralCode"("code");

-- Referral (registros de indicação)
CREATE TABLE IF NOT EXISTS "Referral" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "referredUserId" TEXT,
    "referredEmail" TEXT NOT NULL,
    "referredName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rewardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Referral_code_status_idx" ON "Referral"("code", "status");

-- ReferralCampaign (campanhas de indicação)
CREATE TABLE IF NOT EXISTS "ReferralCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralCampaign_pkey" PRIMARY KEY ("id")
);

-- Lead (leads capturados)
CREATE TABLE IF NOT EXISTS "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");

-- Campaign (campanhas de marketing)
CREATE TABLE IF NOT EXISTS "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- PromotionPost (posts de divulgação)
CREATE TABLE IF NOT EXISTS "PromotionPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "platforms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionPost_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PromotionPost_status_scheduledAt_idx" ON "PromotionPost"("status", "scheduledAt");

-- PromotionPostAsset (assets de posts)
CREATE TABLE IF NOT EXISTS "PromotionPostAsset" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionPostAsset_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PromotionPostAsset_postId_idx" ON "PromotionPostAsset"("postId");

-- PromotionAsset (assets de divulgação)
CREATE TABLE IF NOT EXISTS "PromotionAsset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionAsset_pkey" PRIMARY KEY ("id")
);

-- SocialChannel (canais sociais)
CREATE TABLE IF NOT EXISTS "SocialChannel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT,
    "handle" TEXT,
    "followers" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialChannel_pkey" PRIMARY KEY ("id")
);

-- SocialGroup (grupos sociais)
CREATE TABLE IF NOT EXISTS "SocialGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "members" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialGroup_pkey" PRIMARY KEY ("id")
);

-- PromotionReminder (lembretes de postagem)
CREATE TABLE IF NOT EXISTS "PromotionReminder" (
    "id" TEXT NOT NULL,
    "postId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionReminder_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PromotionReminder_remindAt_sentAt_idx" ON "PromotionReminder"("remindAt", "sentAt");

-- Partner (parceiros do CRM)
CREATE TABLE IF NOT EXISTS "Partner" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "cnpj" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "category" TEXT,
    "origin" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'prospect',
    "status" TEXT NOT NULL DEFAULT 'active',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assignedTo" TEXT,
    "potentialValue" DOUBLE PRECISION,
    "relevanceScore" INTEGER,
    "benefitScore" INTEGER,
    "reputationScore" INTEGER,
    "capacityScore" INTEGER,
    "riskScore" INTEGER,
    "tags" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Partner_stage_status_idx" ON "Partner"("stage", "status");
CREATE INDEX IF NOT EXISTS "Partner_companyName_idx" ON "Partner"("companyName");

-- PartnerContact (contatos de parceiros)
CREATE TABLE IF NOT EXISTS "PartnerContact" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "optOut" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerContact_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PartnerContact_partnerId_idx" ON "PartnerContact"("partnerId");

-- Opportunity (oportunidades de negócio)
CREATE TABLE IF NOT EXISTS "Opportunity" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "value" DOUBLE PRECISION,
    "stage" TEXT NOT NULL DEFAULT 'identified',
    "expectedCloseAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Opportunity_partnerId_stage_idx" ON "Opportunity"("partnerId", "stage");

-- PartnerActivity (atividades de parceiros)
CREATE TABLE IF NOT EXISTS "PartnerActivity" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "opportunityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerActivity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PartnerActivity_partnerId_status_idx" ON "PartnerActivity"("partnerId", "status");

-- PartnerLog (log de mudanças de parceiros)
CREATE TABLE IF NOT EXISTS "PartnerLog" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "adminEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PartnerLog_partnerId_createdAt_idx" ON "PartnerLog"("partnerId", "createdAt");

-- Proposal (propostas)
CREATE TABLE IF NOT EXISTS "Proposal" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "token" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Proposal_status_createdAt_idx" ON "Proposal"("status", "createdAt");

-- CommercialAsset (assets comerciais)
CREATE TABLE IF NOT EXISTS "CommercialAsset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialAsset_pkey" PRIMARY KEY ("id")
);

-- PartnerCampaign (campanhas de parceiros)
CREATE TABLE IF NOT EXISTS "PartnerCampaign" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerCampaign_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PartnerCampaign_status_idx" ON "PartnerCampaign"("status");

-- OutboundTemplate (templates de mensagem outbound)
CREATE TABLE IF NOT EXISTS "OutboundTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "variables" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboundTemplate_pkey" PRIMARY KEY ("id")
);

-- OutboundLog (log de mensagens outbound)
CREATE TABLE IF NOT EXISTS "OutboundLog" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "partnerId" TEXT,
    "contactId" TEXT,
    "channel" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "responseAt" TIMESTAMP(3),
    "response" TEXT,
    "classification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboundLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "OutboundLog_status_createdAt_idx" ON "OutboundLog"("status", "createdAt");

-- Team (equipes)
CREATE TABLE IF NOT EXISTS "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT,
    "ownerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- TeamMember (membros de equipes)
CREATE TABLE IF NOT EXISTS "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TeamMember_teamId_idx" ON "TeamMember"("teamId");
CREATE INDEX IF NOT EXISTS "TeamMember_email_idx" ON "TeamMember"("email");

-- TeamInvite (convites para equipes)
CREATE TABLE IF NOT EXISTS "TeamInvite" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "invitedBy" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamInvite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TeamInvite_token_key" ON "TeamInvite"("token");
CREATE INDEX IF NOT EXISTS "TeamInvite_email_status_idx" ON "TeamInvite"("email", "status");

-- PartnerPortalToken (tokens de acesso ao portal de parceiros)
CREATE TABLE IF NOT EXISTS "PartnerPortalToken" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerPortalToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PartnerPortalToken_token_key" ON "PartnerPortalToken"("token");

-- RadarAlert (alertas do radar)
CREATE TABLE IF NOT EXISTS "RadarAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RadarAlert_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "RadarAlert_userId_readAt_idx" ON "RadarAlert"("userId", "readAt");

-- ScoreSnapshot (snapshots de score)
CREATE TABLE IF NOT EXISTS "ScoreSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "score" INTEGER NOT NULL,
    "level" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ScoreSnapshot_userId_createdAt_idx" ON "ScoreSnapshot"("userId", "createdAt");

-- ChallengeParticipant (participantes de desafios)
CREATE TABLE IF NOT EXISTS "ChallengeParticipant" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "challengeId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "rewardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeParticipant_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ChallengeParticipant_userId_challengeId_idx" ON "ChallengeParticipant"("userId", "challengeId");

-- =====================================================================
-- Foreign Keys (relacionamentos)
-- =====================================================================
-- Estas FKs conectam as tabelas conforme o schema do Prisma

-- AdEvent → Ad
ALTER TABLE "AdEvent" ADD CONSTRAINT IF NOT EXISTS "AdEvent_adId_fkey"
  FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE;

-- PartnerContact → Partner
ALTER TABLE "PartnerContact" ADD CONSTRAINT IF NOT EXISTS "PartnerContact_partnerId_fkey"
  FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE;

-- Opportunity → Partner
ALTER TABLE "Opportunity" ADD CONSTRAINT IF NOT EXISTS "Opportunity_partnerId_fkey"
  FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE;

-- PartnerActivity → Partner
ALTER TABLE "PartnerActivity" ADD CONSTRAINT IF NOT EXISTS "PartnerActivity_partnerId_fkey"
  FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE;

-- PartnerLog → Partner
ALTER TABLE "PartnerLog" ADD CONSTRAINT IF NOT EXISTS "PartnerLog_partnerId_fkey"
  FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE;

-- PromotionPostAsset → PromotionPost
ALTER TABLE "PromotionPostAsset" ADD CONSTRAINT IF NOT EXISTS "PromotionPostAsset_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "PromotionPost"("id") ON DELETE CASCADE;

-- TeamMember → Team
ALTER TABLE "TeamMember" ADD CONSTRAINT IF NOT EXISTS "TeamMember_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE;

-- TeamInvite → Team
ALTER TABLE "TeamInvite" ADD CONSTRAINT IF NOT EXISTS "TeamInvite_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE;

-- =====================================================================
-- Verificação final
-- =====================================================================
SELECT
  tablename,
  COUNT(*) as total_tabelas
FROM pg_tables
WHERE schemaname = 'public'
GROUP BY ()
ORDER BY tablename;

-- Deve retornar 43 tabelas no total

-- =====================================================================
-- PRÓXIMO PASSO: Habilitar RLS em todas as tabelas
-- =====================================================================
-- Após criar as tabelas, rode o script:
-- scripts/supabase-enable-rls.sql
-- (Também no SQL Editor do Supabase)
