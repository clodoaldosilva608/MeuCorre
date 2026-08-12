import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";

// POST /api/admin/partner-campaigns/:id/approve
// Aprova campanha (draft ou pending_approval → approved)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const adminEmail = await getAdminEmail();

  const campaign = await prisma.partnerCampaign.findUnique({ where: { id } });
  if (!campaign) {
    return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
  }

  if (campaign.status !== "draft" && campaign.status !== "pending_approval") {
    return NextResponse.json(
      { error: `Campanha com status "${campaign.status}" não pode ser aprovada` },
      { status: 400 },
    );
  }

  const updated = await prisma.partnerCampaign.update({
    where: { id },
    data: {
      status: "approved",
      approvedAt: new Date(),
      approvedBy: adminEmail ?? "admin",
      approvedByEmail: adminEmail,
    },
  });

  await prisma.partnerLog.create({
    data: {
      partnerId: campaign.partnerId,
      action: "campaign_approved",
      details: JSON.stringify({
        campaignId: id,
        name: campaign.name,
      }),
      adminEmail,
      ipAddress: req.headers.get("x-forwarded-for") ?? null,
    },
  });

  return NextResponse.json({ campaign: updated });
}
