import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { z } from "zod";

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
const bodySchema = z.object({
  active: z.string().max(500).optional(),
  rewardAmount: z.string().max(500).optional(),
  maxReferrals: z.string().max(500).optional(),
  startsAt: z.string().max(500).optional(),
  endsAt: z.string().max(500).optional()
});

export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
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
