import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { z } from "zod";

// POST /api/admin/proposals/:id/reject
// Marca proposta como rejeitada. Body: { "reason": "..." } (obrigatório)
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

  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) {
    return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
  }

  if (proposal.status !== "sent" && proposal.status !== "draft") {
    return NextResponse.json(
      { error: `Proposta com status "${proposal.status}" não pode ser rejeitada` },
      { status: 400 },
    );
  }

  const updated = await prisma.proposal.update({
    where: { id },
    data: {
      status: "rejected",
      rejectedAt: new Date(),
      rejectedReason: sanitizeString(body.reason, 1000),
    },
  });

  await prisma.partnerLog.create({
    data: {
      partnerId: proposal.partnerId,
      action: "proposal_rejected",
      details: JSON.stringify({
        proposalId: id,
        number: proposal.number,
        reason: body.reason,
      }),
      adminEmail,
      ipAddress: req.headers.get("x-forwarded-for") ?? null,
    },
  });

  return NextResponse.json({ proposal: updated });
}
