import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";

// POST /api/admin/proposals/:id/approve
// Marca proposta como aprovada. Registra quem aprovou e quando.
// Body opcional: { "notes": "..." }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const adminEmail = await getAdminEmail();
  const body = (await req.json().catch(() => ({}))) as { notes?: string };

  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) {
    return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
  }

  if (proposal.status !== "sent" && proposal.status !== "draft") {
    return NextResponse.json(
      { error: `Proposta com status "${proposal.status}" não pode ser aprovada` },
      { status: 400 },
    );
  }

  const updated = await prisma.proposal.update({
    where: { id },
    data: {
      status: "approved",
      approvedAt: new Date(),
      approvedBy: adminEmail ?? "admin",
      approvedByEmail: adminEmail,
      notes: body.notes ? `${proposal.notes ?? ""}\n\n[Aprovação] ${body.notes}`.trim() : proposal.notes,
    },
  });

  // Atualiza stage do parceiro para "aguardando_aprovacao" → "ativacao"
  await prisma.partner.update({
    where: { id: proposal.partnerId },
    data: { stage: "ativacao" },
  });

  await prisma.partnerLog.create({
    data: {
      partnerId: proposal.partnerId,
      action: "proposal_approved",
      details: JSON.stringify({
        proposalId: id,
        number: proposal.number,
        title: proposal.title,
      }),
      adminEmail,
      ipAddress: req.headers.get("x-forwarded-for") ?? null,
    },
  });

  return NextResponse.json({ proposal: updated });
}
