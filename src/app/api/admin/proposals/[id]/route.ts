import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";

// GET /api/admin/proposals/:id — detalhe
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      partner: { select: { id: true, companyName: true, city: true, state: true, email: true, phone: true } },
      opportunity: { select: { id: true, title: true, potentialValue: true } },
    },
  });

  if (!proposal) {
    return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
  }

  // Busca versões anteriores (propostas com parentProposalId = id)
  const previousVersions = await prisma.proposal.findMany({
    where: { parentProposalId: id },
    select: {
      id: true,
      version: true,
      status: true,
      createdAt: true,
      title: true,
    },
    orderBy: { version: "desc" },
  });

  return NextResponse.json({ proposal, previousVersions });
}

// PATCH /api/admin/proposals/:id — atualiza
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

  const before = await prisma.proposal.findUnique({ where: { id } });
  if (!before) {
    return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
  }

  // Só permite editar se status for draft ou rejected
  if (before.status !== "draft" && before.status !== "rejected") {
    return NextResponse.json(
      { error: `Não é possível editar proposta com status "${before.status}"` },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = sanitizeString(body.title as string, 200);
  if (body.body !== undefined) data.body = body.body as string;
  if (body.summary !== undefined) data.summary = sanitizeString(body.summary as string, 1000) || null;
  if (body.billingModel !== undefined) {
    const valid = new Set(["campaign", "lead", "both", null]);
    if (valid.has(body.billingModel as string | null)) data.billingModel = body.billingModel;
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
  if (body.validUntil !== undefined) {
    data.validUntil = body.validUntil ? new Date(body.validUntil as string) : null;
  }
  if (body.notes !== undefined) data.notes = sanitizeString(body.notes as string, 2000) || null;
  if (body.opportunityId !== undefined) {
    data.opportunityId = body.opportunityId || null;
  }

  try {
    const proposal = await prisma.proposal.update({
      where: { id },
      data,
    });
    return NextResponse.json({ proposal });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// DELETE /api/admin/proposals/:id — remove (apenas draft)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const adminEmail = await getAdminEmail();

  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) {
    return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
  }

  if (proposal.status !== "draft") {
    return NextResponse.json(
      { error: `Não é possível remover proposta com status "${proposal.status}"` },
      { status: 400 },
    );
  }

  await prisma.proposal.delete({ where: { id } });

  await prisma.partnerLog.create({
    data: {
      partnerId: proposal.partnerId,
      action: "proposal_deleted",
      details: JSON.stringify({ proposalId: id, number: proposal.number }),
      adminEmail,
      ipAddress: req.headers.get("x-forwarded-for") ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
