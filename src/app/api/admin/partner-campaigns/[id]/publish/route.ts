import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";

// POST /api/admin/partner-campaigns/:id/publish
// Publica campanha (approved → published). Disponibiliza no app do entregador.
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

  if (campaign.status !== "approved" && campaign.status !== "paused") {
    return NextResponse.json(
      { error: `Campanha com status "${campaign.status}" não pode ser publicada. Aprove primeiro.` },
      { status: 400 },
    );
  }

  // Verifica vigência
  const now = new Date();
  if (campaign.endsAt && campaign.endsAt.getTime() < now.getTime()) {
    // Marca como expirada
    const expired = await prisma.partnerCampaign.update({
      where: { id },
      data: { status: "expired" },
    });
    return NextResponse.json(
      { error: "Campanha expirou (endsAt no passado)", campaign: expired },
      { status: 400 },
    );
  }

  const updated = await prisma.partnerCampaign.update({
    where: { id },
    data: {
      status: "published",
      publishedAt: new Date(),
      pausedAt: null,
    },
  });

  // Atualiza stage do parceiro para "ativo"
  await prisma.partner.update({
    where: { id: campaign.partnerId },
    data: { stage: "ativo" },
  });

  await prisma.partnerLog.create({
    data: {
      partnerId: campaign.partnerId,
      action: "campaign_published",
      details: JSON.stringify({
        campaignId: id,
        name: campaign.name,
        publishedAt: updated.publishedAt,
      }),
      adminEmail,
      ipAddress: req.headers.get("x-forwarded-for") ?? null,
    },
  });

  return NextResponse.json({ campaign: updated });
}
