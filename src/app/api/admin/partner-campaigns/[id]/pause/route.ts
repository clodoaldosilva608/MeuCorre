import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { z } from "zod";

// POST /api/admin/partner-campaigns/:id/pause
// Pausa campanha (published → paused). Pode ser reativada com publish.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const adminEmail = await getAdminEmail();
  const body = (await req.json().catch(() => ({}))) as { reason?: string };

  const campaign = await prisma.partnerCampaign.findUnique({ where: { id } });
  if (!campaign) {
    return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
  }

  if (campaign.status !== "published") {
    return NextResponse.json(
      { error: `Campanha com status "${campaign.status}" não pode ser pausada` },
      { status: 400 },
    );
  }

  const updated = await prisma.partnerCampaign.update({
    where: { id },
    data: {
      status: "paused",
      pausedAt: new Date(),
      notes: body.reason
        ? `${campaign.notes ?? ""}\n\n[Pausa] ${body.reason}`.trim()
        : campaign.notes,
    },
  });

  await prisma.partnerLog.create({
    data: {
      partnerId: campaign.partnerId,
      action: "campaign_paused",
      details: JSON.stringify({
        campaignId: id,
        name: campaign.name,
        reason: body.reason ?? null,
      }),
      adminEmail,
      ipAddress: req.headers.get("x-forwarded-for") ?? null,
    },
  });

  return NextResponse.json({ campaign: updated });
}
