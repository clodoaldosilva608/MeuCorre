import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";

// POST /api/admin/partner-campaigns/:id/reject
// Rejeita campanha (draft/pending_approval → rejected). Body: { reason } obrigatório.
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
      { error: "Motivo da rejeição é obrigatório" },
      { status: 400 },
    );
  }

  const campaign = await prisma.partnerCampaign.findUnique({ where: { id } });
  if (!campaign) {
    return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
  }

  if (campaign.status !== "draft" && campaign.status !== "pending_approval") {
    return NextResponse.json(
      { error: `Campanha com status "${campaign.status}" não pode ser rejeitada` },
      { status: 400 },
    );
  }

  const updated = await prisma.partnerCampaign.update({
    where: { id },
    data: {
      status: "rejected",
      rejectedReason: sanitizeString(body.reason, 1000),
    },
  });

  await prisma.partnerLog.create({
    data: {
      partnerId: campaign.partnerId,
      action: "campaign_rejected",
      details: JSON.stringify({
        campaignId: id,
        name: campaign.name,
        reason: body.reason,
      }),
      adminEmail,
      ipAddress: req.headers.get("x-forwarded-for") ?? null,
    },
  });

  return NextResponse.json({ campaign: updated });
}
