import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";

// POST /api/admin/proposals/:id/send
// Marca proposta como enviada (status: draft → sent).
// Não envia email automaticamente — o administrador deve enviar manualmente
// usando o link público gerado.
//
// Body opcional: { "validUntil": "2026-09-12" } — se informado, atualiza validade.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const adminEmail = await getAdminEmail();
  const body = (await req.json().catch(() => ({}))) as { validUntil?: string };

  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) {
    return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
  }

  if (proposal.status !== "draft" && proposal.status !== "rejected") {
    return NextResponse.json(
      { error: `Proposta com status "${proposal.status}" não pode ser enviada` },
      { status: 400 },
    );
  }

  // Valida validUntil se informado
  let validUntil = proposal.validUntil;
  if (body.validUntil) {
    const d = new Date(body.validUntil);
    if (d.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "validUntil deve ser no futuro" },
        { status: 400 },
      );
    }
    validUntil = d;
  } else if (!validUntil) {
    // Default: 30 dias a partir de agora
    validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  const updated = await prisma.proposal.update({
    where: { id },
    data: {
      status: "sent",
      sentAt: new Date(),
      validUntil,
    },
  });

  // Atualiza stage do parceiro
  await prisma.partner.update({
    where: { id: proposal.partnerId },
    data: { stage: "proposta_enviada" },
  });

  await prisma.partnerLog.create({
    data: {
      partnerId: proposal.partnerId,
      action: "proposal_sent",
      details: JSON.stringify({
        proposalId: id,
        number: proposal.number,
        title: proposal.title,
        publicToken: proposal.publicToken,
        publicUrl: `/propostas/${proposal.publicToken}`,
      }),
      adminEmail,
      ipAddress: req.headers.get("x-forwarded-for") ?? null,
    },
  });

  return NextResponse.json({
    proposal: updated,
    publicUrl: `/propostas/${proposal.publicToken}`,
  });
}
