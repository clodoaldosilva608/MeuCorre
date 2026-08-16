-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cta" TEXT NOT NULL DEFAULT 'Saiba mais',
    "url" TEXT,
    "imageUrl" TEXT,
    "bgColor" TEXT NOT NULL DEFAULT '#10b981',
    "textColor" TEXT NOT NULL DEFAULT '#09090b',
    "placement" TEXT NOT NULL DEFAULT 'banner_top',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
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
    "kiwifyOrderId" TEXT,
    "kiwifyChargeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "plan" TEXT,
    "licenseKey" TEXT,
    "deviceId" TEXT,
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdEvent" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "userAgent" TEXT,
    "page" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isPro" BOOLEAN NOT NULL DEFAULT false,
    "licenseKey" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "trialExtendedUntil" TIMESTAMP(3),
    "subscriptionPlan" TEXT,
    "subscriptionStatus" TEXT,
    "subscriptionExpiresAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "originalPrice" DOUBLE PRECISION,
    "imageUrl" TEXT NOT NULL,
    "videoUrl" TEXT,
    "productUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'equipamentos',
    "proOnly" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncedGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "label" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" BIGINT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SyncedGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncedWorkSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localId" INTEGER NOT NULL,
    "startTime" BIGINT NOT NULL,
    "endTime" BIGINT,
    "durationMs" BIGINT NOT NULL DEFAULT 0,
    "distanceKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pointCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" BIGINT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SyncedWorkSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncedDelivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localId" INTEGER NOT NULL,
    "app" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "date" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "notes" TEXT,
    "updatedAt" BIGINT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SyncedDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncedExpense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "date" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SyncedExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'dicas',
    "labels" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "bloggerPostId" TEXT,
    "bloggerUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "totpSecret" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAction" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "pixKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referrerCode" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "referredEmail" TEXT NOT NULL,
    "referredName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "convertedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "payoutAmount" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "payoutPixKey" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Indique e Ganhe',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "rewardAmount" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "maxReferrals" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "termsUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT,
    "quizAnswers" TEXT,
    "resultScore" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'quiz',
    "referrerCode" TEXT,
    "convertedAt" TIMESTAMP(3),
    "convertedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "objective" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "color" TEXT NOT NULL DEFAULT '#10b981',
    "defaultUtm" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionPost" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "editorialDay" INTEGER NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "publishAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "platform" TEXT NOT NULL,
    "platforms" TEXT,
    "format" TEXT,
    "pillar" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hashtags" TEXT,
    "engagementText" TEXT,
    "cta" TEXT,
    "destinationUrl" TEXT,
    "altText" TEXT,
    "videoScript" TEXT,
    "durationSeconds" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "publishedAt" TIMESTAMP(3),
    "notes" TEXT,
    "utmQuery" TEXT,
    "assetId" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionPostAsset" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionPostAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionAsset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT,
    "mimeType" TEXT NOT NULL DEFAULT 'image/png',
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" INTEGER,
    "altText" TEXT,
    "source" TEXT,
    "baseAssetName" TEXT,
    "tags" TEXT,
    "hash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialChannel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "bannerUrl" TEXT,
    "promoTitle" TEXT,
    "promoText" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "inviteUrl" TEXT NOT NULL,
    "memberCount" INTEGER,
    "category" TEXT,
    "city" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastPostedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionReminder" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "minutesBefore" INTEGER NOT NULL DEFAULT 15,
    "channel" TEXT NOT NULL DEFAULT 'browser',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "tradeName" TEXT,
    "cnpj" TEXT,
    "category" TEXT,
    "origin" TEXT,
    "city" TEXT,
    "state" TEXT,
    "address" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "assignedTo" TEXT DEFAULT 'Clodoaldo Silva',
    "priority" TEXT NOT NULL DEFAULT 'media',
    "status" TEXT NOT NULL DEFAULT 'active',
    "stage" TEXT NOT NULL DEFAULT 'novo_lead',
    "relevanceScore" INTEGER,
    "benefitScore" INTEGER,
    "reputationScore" INTEGER,
    "capacityScore" INTEGER,
    "riskScore" INTEGER,
    "tags" TEXT,
    "potentialValue" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerContact" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "optOut" BOOLEAN NOT NULL DEFAULT false,
    "linkedinUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "contactId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'novo_lead',
    "potentialValue" DOUBLE PRECISION,
    "expectedCloseAt" TIMESTAMP(3),
    "wonAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "billingModel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerActivity" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assignedTo" TEXT DEFAULT 'Clodoaldo Silva',
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerLog" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "adminId" TEXT,
    "adminEmail" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "summary" TEXT,
    "billingModel" TEXT,
    "campaignPrice" DOUBLE PRECISION,
    "leadPrice" DOUBLE PRECISION,
    "validUntil" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedByEmail" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentProposalId" TEXT,
    "publicToken" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdByEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialAsset" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER,
    "version" TEXT,
    "tags" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerCampaign" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "proposalId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "offerTitle" TEXT NOT NULL,
    "offerDescription" TEXT NOT NULL,
    "offerCta" TEXT NOT NULL DEFAULT 'Aproveitar',
    "offerUrl" TEXT NOT NULL,
    "couponCode" TEXT,
    "discountText" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'servicos',
    "city" TEXT,
    "state" TEXT,
    "proOnly" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "billingModel" TEXT NOT NULL DEFAULT 'campaign',
    "campaignPrice" DOUBLE PRECISION,
    "leadPrice" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedByEmail" TEXT,
    "publishedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "redemptions" INTEGER NOT NULL DEFAULT 0,
    "reportsCount" INTEGER NOT NULL DEFAULT 0,
    "reportedAt" TIMESTAMP(3),
    "reportedReason" TEXT,
    "utmSource" TEXT DEFAULT 'parceiro',
    "utmMedium" TEXT DEFAULT 'app',
    "utmCampaign" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdByEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboundTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "segment" TEXT,
    "objective" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "cta" TEXT,
    "optOutText" TEXT,
    "variables" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentTemplateId" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdByEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboundTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboundLog" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "templateId" TEXT,
    "channel" TEXT NOT NULL,
    "renderedSubject" TEXT,
    "renderedBody" TEXT NOT NULL,
    "renderedCta" TEXT,
    "status" TEXT NOT NULL DEFAULT 'preparado',
    "responseText" TEXT,
    "responseClassification" TEXT,
    "responseClassifiedAt" TIMESTAMP(3),
    "responseClassifiedBy" TEXT,
    "responseClassifiedByEmail" TEXT,
    "responseClassifiedByMethod" TEXT,
    "lostReason" TEXT,
    "followUpAt" TIMESTAMP(3),
    "followUpNotes" TEXT,
    "sentAt" TIMESTAMP(3),
    "sentBy" TEXT,
    "sentByEmail" TEXT,
    "sentManuallyAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedByEmail" TEXT,
    "errorMessage" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboundLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "companyName" TEXT,
    "cnpj" TEXT,
    "managerName" TEXT,
    "managerEmail" TEXT,
    "managerPhone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "maxMembers" INTEGER NOT NULL DEFAULT 50,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamInvite" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "token" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "acceptedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerPortalToken" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "canViewCampaigns" BOOLEAN NOT NULL DEFAULT true,
    "canViewMetrics" BOOLEAN NOT NULL DEFAULT true,
    "canViewProposals" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerPortalToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadarAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "triggerData" TEXT,
    "suggestedAction" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'active',
    "dismissedAt" TIMESTAMP(3),
    "dismissedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadarAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "regularityScore" INTEGER NOT NULL,
    "consistencyScore" INTEGER NOT NULL,
    "goalAdherenceScore" INTEGER NOT NULL,
    "details" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeParticipant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentDay" INTEGER NOT NULL DEFAULT 1,
    "tasksJson" TEXT NOT NULL DEFAULT '[]',
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "rewardClaimedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ad_placement_active_idx" ON "Ad"("placement", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_kiwifyOrderId_key" ON "Subscription"("kiwifyOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_licenseKey_key" ON "Subscription"("licenseKey");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_buyerEmail_idx" ON "Subscription"("buyerEmail");

-- CreateIndex
CREATE INDEX "Subscription_kiwifyOrderId_idx" ON "Subscription"("kiwifyOrderId");

-- CreateIndex
CREATE INDEX "Subscription_plan_status_idx" ON "Subscription"("plan", "status");

-- CreateIndex
CREATE INDEX "AdEvent_adId_eventType_idx" ON "AdEvent"("adId", "eventType");

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- CreateIndex
CREATE INDEX "Feedback_rating_idx" ON "Feedback"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_licenseKey_key" ON "User"("licenseKey");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_isPro_idx" ON "User"("isPro");

-- CreateIndex
CREATE INDEX "User_active_idx" ON "User"("active");

-- CreateIndex
CREATE INDEX "User_subscriptionStatus_idx" ON "User"("subscriptionStatus");

-- CreateIndex
CREATE INDEX "Offer_active_startsAt_idx" ON "Offer"("active", "startsAt");

-- CreateIndex
CREATE INDEX "Offer_category_idx" ON "Offer"("category");

-- CreateIndex
CREATE INDEX "Offer_proOnly_idx" ON "Offer"("proOnly");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "SyncedGoal_userId_updatedAt_idx" ON "SyncedGoal"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "SyncedGoal_userId_type_active_idx" ON "SyncedGoal"("userId", "type", "active");

-- CreateIndex
CREATE UNIQUE INDEX "SyncedGoal_userId_localId_key" ON "SyncedGoal"("userId", "localId");

-- CreateIndex
CREATE INDEX "SyncedWorkSession_userId_updatedAt_idx" ON "SyncedWorkSession"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "SyncedWorkSession_userId_startTime_idx" ON "SyncedWorkSession"("userId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "SyncedWorkSession_userId_localId_key" ON "SyncedWorkSession"("userId", "localId");

-- CreateIndex
CREATE INDEX "SyncedDelivery_userId_updatedAt_idx" ON "SyncedDelivery"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "SyncedDelivery_userId_date_idx" ON "SyncedDelivery"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SyncedDelivery_userId_localId_key" ON "SyncedDelivery"("userId", "localId");

-- CreateIndex
CREATE INDEX "SyncedExpense_userId_updatedAt_idx" ON "SyncedExpense"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "SyncedExpense_userId_date_idx" ON "SyncedExpense"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SyncedExpense_userId_localId_key" ON "SyncedExpense"("userId", "localId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_published_createdAt_idx" ON "BlogPost"("published", "createdAt");

-- CreateIndex
CREATE INDEX "BlogPost_slug_idx" ON "BlogPost"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_email_idx" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_active_idx" ON "AdminUser"("active");

-- CreateIndex
CREATE INDEX "AdminAction_adminId_createdAt_idx" ON "AdminAction"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAction_resource_createdAt_idx" ON "AdminAction"("resource", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_userId_key" ON "ReferralCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "ReferralCode"("code");

-- CreateIndex
CREATE INDEX "ReferralCode_userId_idx" ON "ReferralCode"("userId");

-- CreateIndex
CREATE INDEX "ReferralCode_code_idx" ON "ReferralCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredId_key" ON "Referral"("referredId");

-- CreateIndex
CREATE INDEX "Referral_referrerId_status_idx" ON "Referral"("referrerId", "status");

-- CreateIndex
CREATE INDEX "Referral_referredId_idx" ON "Referral"("referredId");

-- CreateIndex
CREATE INDEX "Referral_status_createdAt_idx" ON "Referral"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_key" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_referrerCode_idx" ON "Lead"("referrerCode");

-- CreateIndex
CREATE INDEX "Lead_convertedAt_idx" ON "Lead"("convertedAt");

-- CreateIndex
CREATE INDEX "Lead_source_createdAt_idx" ON "Lead"("source", "createdAt");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_startAt_endAt_idx" ON "Campaign"("startAt", "endAt");

-- CreateIndex
CREATE INDEX "PromotionPost_campaignId_editorialDay_idx" ON "PromotionPost"("campaignId", "editorialDay");

-- CreateIndex
CREATE INDEX "PromotionPost_platform_status_idx" ON "PromotionPost"("platform", "status");

-- CreateIndex
CREATE INDEX "PromotionPost_publishAt_idx" ON "PromotionPost"("publishAt");

-- CreateIndex
CREATE INDEX "PromotionPost_status_idx" ON "PromotionPost"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionPost_campaignId_editorialDay_sequenceNumber_platfo_key" ON "PromotionPost"("campaignId", "editorialDay", "sequenceNumber", "platform");

-- CreateIndex
CREATE INDEX "PromotionPostAsset_postId_sortOrder_idx" ON "PromotionPostAsset"("postId", "sortOrder");

-- CreateIndex
CREATE INDEX "PromotionPostAsset_assetId_idx" ON "PromotionPostAsset"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionPostAsset_postId_assetId_key" ON "PromotionPostAsset"("postId", "assetId");

-- CreateIndex
CREATE INDEX "PromotionAsset_name_idx" ON "PromotionAsset"("name");

-- CreateIndex
CREATE INDEX "PromotionAsset_baseAssetName_idx" ON "PromotionAsset"("baseAssetName");

-- CreateIndex
CREATE INDEX "PromotionAsset_hash_idx" ON "PromotionAsset"("hash");

-- CreateIndex
CREATE INDEX "SocialChannel_platform_active_idx" ON "SocialChannel"("platform", "active");

-- CreateIndex
CREATE INDEX "SocialChannel_sortOrder_idx" ON "SocialChannel"("sortOrder");

-- CreateIndex
CREATE INDEX "SocialGroup_platform_active_idx" ON "SocialGroup"("platform", "active");

-- CreateIndex
CREATE INDEX "SocialGroup_category_active_idx" ON "SocialGroup"("category", "active");

-- CreateIndex
CREATE INDEX "SocialGroup_city_idx" ON "SocialGroup"("city");

-- CreateIndex
CREATE INDEX "SocialGroup_active_createdAt_idx" ON "SocialGroup"("active", "createdAt");

-- CreateIndex
CREATE INDEX "PromotionReminder_postId_idx" ON "PromotionReminder"("postId");

-- CreateIndex
CREATE INDEX "PromotionReminder_status_remindAt_idx" ON "PromotionReminder"("status", "remindAt");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_cnpj_key" ON "Partner"("cnpj");

-- CreateIndex
CREATE INDEX "Partner_city_state_idx" ON "Partner"("city", "state");

-- CreateIndex
CREATE INDEX "Partner_category_idx" ON "Partner"("category");

-- CreateIndex
CREATE INDEX "Partner_stage_idx" ON "Partner"("stage");

-- CreateIndex
CREATE INDEX "Partner_status_idx" ON "Partner"("status");

-- CreateIndex
CREATE INDEX "Partner_assignedTo_idx" ON "Partner"("assignedTo");

-- CreateIndex
CREATE INDEX "Partner_priority_idx" ON "Partner"("priority");

-- CreateIndex
CREATE INDEX "PartnerContact_partnerId_idx" ON "PartnerContact"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerContact_email_idx" ON "PartnerContact"("email");

-- CreateIndex
CREATE INDEX "PartnerContact_phone_idx" ON "PartnerContact"("phone");

-- CreateIndex
CREATE INDEX "PartnerContact_optOut_idx" ON "PartnerContact"("optOut");

-- CreateIndex
CREATE INDEX "Opportunity_partnerId_idx" ON "Opportunity"("partnerId");

-- CreateIndex
CREATE INDEX "Opportunity_stage_idx" ON "Opportunity"("stage");

-- CreateIndex
CREATE INDEX "Opportunity_expectedCloseAt_idx" ON "Opportunity"("expectedCloseAt");

-- CreateIndex
CREATE INDEX "PartnerActivity_partnerId_idx" ON "PartnerActivity"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerActivity_opportunityId_idx" ON "PartnerActivity"("opportunityId");

-- CreateIndex
CREATE INDEX "PartnerActivity_status_scheduledAt_idx" ON "PartnerActivity"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "PartnerActivity_assignedTo_idx" ON "PartnerActivity"("assignedTo");

-- CreateIndex
CREATE INDEX "PartnerLog_partnerId_createdAt_idx" ON "PartnerLog"("partnerId", "createdAt");

-- CreateIndex
CREATE INDEX "PartnerLog_action_idx" ON "PartnerLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_number_key" ON "Proposal"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_publicToken_key" ON "Proposal"("publicToken");

-- CreateIndex
CREATE INDEX "Proposal_partnerId_idx" ON "Proposal"("partnerId");

-- CreateIndex
CREATE INDEX "Proposal_opportunityId_idx" ON "Proposal"("opportunityId");

-- CreateIndex
CREATE INDEX "Proposal_status_idx" ON "Proposal"("status");

-- CreateIndex
CREATE INDEX "Proposal_validUntil_idx" ON "Proposal"("validUntil");

-- CreateIndex
CREATE INDEX "Proposal_publicToken_idx" ON "Proposal"("publicToken");

-- CreateIndex
CREATE INDEX "CommercialAsset_type_active_idx" ON "CommercialAsset"("type", "active");

-- CreateIndex
CREATE INDEX "CommercialAsset_name_idx" ON "CommercialAsset"("name");

-- CreateIndex
CREATE INDEX "CommercialAsset_tags_idx" ON "CommercialAsset"("tags");

-- CreateIndex
CREATE INDEX "PartnerCampaign_partnerId_idx" ON "PartnerCampaign"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerCampaign_status_idx" ON "PartnerCampaign"("status");

-- CreateIndex
CREATE INDEX "PartnerCampaign_category_idx" ON "PartnerCampaign"("category");

-- CreateIndex
CREATE INDEX "PartnerCampaign_city_state_idx" ON "PartnerCampaign"("city", "state");

-- CreateIndex
CREATE INDEX "PartnerCampaign_startsAt_endsAt_idx" ON "PartnerCampaign"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "PartnerCampaign_proOnly_idx" ON "PartnerCampaign"("proOnly");

-- CreateIndex
CREATE INDEX "OutboundTemplate_channel_status_idx" ON "OutboundTemplate"("channel", "status");

-- CreateIndex
CREATE INDEX "OutboundTemplate_objective_idx" ON "OutboundTemplate"("objective");

-- CreateIndex
CREATE INDEX "OutboundTemplate_status_idx" ON "OutboundTemplate"("status");

-- CreateIndex
CREATE INDEX "OutboundTemplate_parentTemplateId_idx" ON "OutboundTemplate"("parentTemplateId");

-- CreateIndex
CREATE INDEX "OutboundLog_partnerId_idx" ON "OutboundLog"("partnerId");

-- CreateIndex
CREATE INDEX "OutboundLog_contactId_idx" ON "OutboundLog"("contactId");

-- CreateIndex
CREATE INDEX "OutboundLog_templateId_idx" ON "OutboundLog"("templateId");

-- CreateIndex
CREATE INDEX "OutboundLog_status_idx" ON "OutboundLog"("status");

-- CreateIndex
CREATE INDEX "OutboundLog_channel_status_idx" ON "OutboundLog"("channel", "status");

-- CreateIndex
CREATE INDEX "OutboundLog_followUpAt_idx" ON "OutboundLog"("followUpAt");

-- CreateIndex
CREATE INDEX "OutboundLog_responseClassification_idx" ON "OutboundLog"("responseClassification");

-- CreateIndex
CREATE INDEX "Team_active_idx" ON "Team"("active");

-- CreateIndex
CREATE INDEX "Team_companyName_idx" ON "Team"("companyName");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_status_idx" ON "TeamMember"("teamId", "status");

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE INDEX "TeamMember_email_idx" ON "TeamMember"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_email_key" ON "TeamMember"("teamId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvite_token_key" ON "TeamInvite"("token");

-- CreateIndex
CREATE INDEX "TeamInvite_teamId_status_idx" ON "TeamInvite"("teamId", "status");

-- CreateIndex
CREATE INDEX "TeamInvite_email_idx" ON "TeamInvite"("email");

-- CreateIndex
CREATE INDEX "TeamInvite_token_idx" ON "TeamInvite"("token");

-- CreateIndex
CREATE INDEX "TeamInvite_expiresAt_idx" ON "TeamInvite"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerPortalToken_token_key" ON "PartnerPortalToken"("token");

-- CreateIndex
CREATE INDEX "PartnerPortalToken_partnerId_idx" ON "PartnerPortalToken"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerPortalToken_token_idx" ON "PartnerPortalToken"("token");

-- CreateIndex
CREATE INDEX "PartnerPortalToken_active_idx" ON "PartnerPortalToken"("active");

-- CreateIndex
CREATE INDEX "RadarAlert_userId_status_idx" ON "RadarAlert"("userId", "status");

-- CreateIndex
CREATE INDEX "RadarAlert_type_status_idx" ON "RadarAlert"("type", "status");

-- CreateIndex
CREATE INDEX "RadarAlert_severity_status_idx" ON "RadarAlert"("severity", "status");

-- CreateIndex
CREATE INDEX "RadarAlert_createdAt_idx" ON "RadarAlert"("createdAt");

-- CreateIndex
CREATE INDEX "ScoreSnapshot_userId_createdAt_idx" ON "ScoreSnapshot"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ScoreSnapshot_periodStart_periodEnd_idx" ON "ScoreSnapshot"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "ChallengeParticipant_userId_status_idx" ON "ChallengeParticipant"("userId", "status");

-- CreateIndex
CREATE INDEX "ChallengeParticipant_status_expiresAt_idx" ON "ChallengeParticipant"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "PromotionPost" ADD CONSTRAINT "PromotionPost_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionPost" ADD CONSTRAINT "PromotionPost_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "PromotionAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionPostAsset" ADD CONSTRAINT "PromotionPostAsset_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PromotionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionPostAsset" ADD CONSTRAINT "PromotionPostAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "PromotionAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionReminder" ADD CONSTRAINT "PromotionReminder_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PromotionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerContact" ADD CONSTRAINT "PartnerContact_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "PartnerContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerActivity" ADD CONSTRAINT "PartnerActivity_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerActivity" ADD CONSTRAINT "PartnerActivity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerLog" ADD CONSTRAINT "PartnerLog_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerCampaign" ADD CONSTRAINT "PartnerCampaign_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerCampaign" ADD CONSTRAINT "PartnerCampaign_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundLog" ADD CONSTRAINT "OutboundLog_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundLog" ADD CONSTRAINT "OutboundLog_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "PartnerContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundLog" ADD CONSTRAINT "OutboundLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "OutboundTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerPortalToken" ADD CONSTRAINT "PartnerPortalToken_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

