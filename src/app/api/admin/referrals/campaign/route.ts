import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";

// GET /api/admin/referrals/campaign — retorna configuração da campanha
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let campaign = await prisma.referralCampaign.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!campaign) {
    // Cria campanha padrão (inativa)
    campaign = await prisma.referralCampaign.create({
      data: {
        name: "Indique e Ganhe",
        active: false,
        rewardAmount: 5,
        maxReferrals: 0,
      },
    });
  }

  return NextResponse.json({
    campaign: {
      ...campaign,
      rewardAmount: Number(campaign.rewardAmount),
    },
  });
}

// PATCH /api/admin/referrals/campaign — atualiza configuração da campanha
// Body: { active?, rewardAmount?, maxReferrals?, startsAt?, endsAt? }
export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: {
    active?: boolean;
    rewardAmount?: number;
    maxReferrals?: number;
    startsAt?: string | null;
    endsAt?: string | null;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  let campaign = await prisma.referralCampaign.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!campaign) {
    campaign = await prisma.referralCampaign.create({
      data: { name: "Indique e Ganhe" },
    });
  }

  const data: Record<string, unknown> = {};
  if (body.active !== undefined) data.active = body.active;
  if (body.rewardAmount !== undefined) data.rewardAmount = body.rewardAmount;
  if (body.maxReferrals !== undefined) data.maxReferrals = body.maxReferrals;
  if (body.startsAt !== undefined) data.startsAt = body.startsAt ? new Date(body.startsAt) : null;
  if (body.endsAt !== undefined) data.endsAt = body.endsAt ? new Date(body.endsAt) : null;

  const updated = await prisma.referralCampaign.update({
    where: { id: campaign.id },
    data,
  });

  logger.info("Campanha de referral atualizada", {
    active: updated.active,
    rewardAmount: updated.rewardAmount,
  });

  return NextResponse.json({
    campaign: {
      ...updated,
      rewardAmount: Number(updated.rewardAmount),
    },
  });
}
