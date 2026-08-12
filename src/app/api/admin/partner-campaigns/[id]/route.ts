import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";

// GET /api/admin/partner-campaigns/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const campaign = await prisma.partnerCampaign.findUnique({
    where: { id },
    include: {
      partner: { select: { id: true, companyName: true, city: true, state: true, category: true } },
      proposal: { select: { id: true, number: true, title: true, billingModel: true, campaignPrice: true, leadPrice: true } },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ campaign });
}

// PATCH /api/admin/partner-campaigns/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const adminEmail = await getAdminEmail();
  const body = (await req.json()) as Record<string, unknown>;

  const before = await prisma.partnerCampaign.findUnique({ where: { id } });
  if (!before) {
    return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
  }

  // Só permite editar se draft ou pending_approval ou rejected
  const editableStatuses = new Set(["draft", "pending_approval", "rejected", "paused"]);
  if (!editableStatuses.has(before.status)) {
    return NextResponse.json(
      { error: `Não é possível editar campanha com status "${before.status}"` },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = {};
  const allowedStringFields: Array<[string, number]> = [
    ["name", 150],
    ["description", 500],
    ["offerTitle", 100],
    ["offerDescription", 500],
    ["offerCta", 30],
    ["offerUrl", 500],
    ["couponCode", 50],
    ["discountText", 50],
    ["imageUrl", 500],
    ["videoUrl", 500],
    ["category", 50],
    ["city", 100],
    ["notes", 2000],
  ];

  for (const [field, max] of allowedStringFields) {
    if (body[field] !== undefined) {
      const val = sanitizeString(body[field] as string, max);
      if (field === "state") {
        data[field] = val?.toUpperCase() || null;
      } else if (field === "city") {
        data[field] = val || null;
      } else {
        data[field] = val || null;
      }
    }
  }

  if (body.state !== undefined) {
    const state = sanitizeString(body.state as string, 2)?.toUpperCase();
    data.state = state || null;
  }

  if (body.proOnly !== undefined) data.proOnly = Boolean(body.proOnly);
  if (body.startsAt !== undefined) {
    data.startsAt = body.startsAt ? new Date(body.startsAt as string) : new Date();
  }
  if (body.endsAt !== undefined) {
    data.endsAt = body.endsAt ? new Date(body.endsAt as string) : null;
  }
  if (body.billingModel !== undefined) {
    const valid = new Set(["campaign", "lead", "both"]);
    if (valid.has(body.billingModel as string)) data.billingModel = body.billingModel;
  }
  if (body.campaignPrice !== undefined) {
    if (typeof body.campaignPrice === "number" && body.campaignPrice >= 0) {
      data.campaignPrice = body.campaignPrice;
    } else if (body.campaignPrice === null) {
      data.campaignPrice = null;
    }
  }
  if (body.leadPrice !== undefined) {
    if (typeof body.leadPrice === "number" && body.leadPrice >= 0) {
      data.leadPrice = body.leadPrice;
    } else if (body.leadPrice === null) {
      data.leadPrice = null;
    }
  }
  if (body.proposalId !== undefined) {
    data.proposalId = body.proposalId || null;
  }

  try {
    const campaign = await prisma.partnerCampaign.update({
      where: { id },
      data,
    });
    return NextResponse.json({ campaign });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// DELETE /api/admin/partner-campaigns/:id
export async function DELETE(
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

  // Só permite deletar se draft ou canceled
  if (campaign.status !== "draft" && campaign.status !== "canceled") {
    return NextResponse.json(
      { error: `Não é possível remover campanha com status "${campaign.status}". Cancele primeiro.` },
      { status: 400 },
    );
  }

  await prisma.partnerCampaign.delete({ where: { id } });

  await prisma.partnerLog.create({
    data: {
      partnerId: campaign.partnerId,
      action: "campaign_deleted",
      details: JSON.stringify({ campaignId: id, name: campaign.name }),
      adminEmail,
      ipAddress: req.headers.get("x-forwarded-for") ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
