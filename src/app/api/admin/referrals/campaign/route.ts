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
  const validatedBody = parsed.data;

  let campaign = await prisma.referralCampaign.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!campaign) {
    campaign = await prisma.referralCampaign.create({
      data: { name: "Indique e Ganhe" },
    });
  }

  const data: Record<string, unknown> = {};
  if (validatedBody.active !== undefined) data.active = validatedBody.active;
  if (validatedBody.rewardAmount !== undefined) data.rewardAmount = validatedBody.rewardAmount;
  if (validatedBody.maxReferrals !== undefined) data.maxReferrals = validatedBody.maxReferrals;
  if (validatedBody.startsAt !== undefined) data.startsAt = validatedBody.startsAt ? new Date(validatedBody.startsAt) : null;
  if (validatedBody.endsAt !== undefined) data.endsAt = validatedBody.endsAt ? new Date(validatedBody.endsAt) : null;

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
