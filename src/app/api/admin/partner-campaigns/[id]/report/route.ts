import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { z } from "zod";

// POST /api/admin/partner-campaigns/:id/report
// Registra denúncia contra campanha (qualquer status). Body: { reason } obrigatório.
// Se reportsCount >= 3, pausa automaticamente a campanha.
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

  if (!body.reason?.trim()) {
    return NextResponse.json(
      { error: "Motivo da denúncia é obrigatório" },
      { status: 400 },
    );
  }

  const campaign = await prisma.partnerCampaign.findUnique({ where: { id } });
  if (!campaign) {
    return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
  }

  const newReportsCount = campaign.reportsCount + 1;
  const shouldAutoPause = newReportsCount >= 3 && campaign.status === "published";

  const updated = await prisma.partnerCampaign.update({
    where: { id },
    data: {
      reportsCount: newReportsCount,
      reportedAt: new Date(),
      reportedReason: sanitizeString(body.reason, 1000),
      ...(shouldAutoPause
        ? { status: "paused" as const, pausedAt: new Date() }
        : {}),
    },
  });

  await prisma.partnerLog.create({
    data: {
      partnerId: campaign.partnerId,
      action: shouldAutoPause ? "campaign_auto_paused_report" : "campaign_reported",
      details: JSON.stringify({
        campaignId: id,
        name: campaign.name,
        reason: body.reason,
        reportsCount: newReportsCount,
        autoPaused: shouldAutoPause,
      }),
      adminEmail,
      ipAddress: req.headers.get("x-forwarded-for") ?? null,
    },
  });

  return NextResponse.json({
    campaign: updated,
    autoPaused: shouldAutoPause,
    reportsCount: newReportsCount,
  });
}
