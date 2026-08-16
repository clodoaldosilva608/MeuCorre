import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/proposals/:token — acesso público à proposta via token
// Não requer auth — o token é a "senha"
// PUBLIC ROUTE — Esta rota é intencionalmente pública (não requer admin auth)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 });
  }

  const proposal = await prisma.proposal.findUnique({
    where: { publicToken: token },
    include: {
      partner: { select: { id: true, companyName: true, city: true, state: true } },
    },
  });

  if (!proposal) {
    return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });
  }

  // Não retorna propostas em rascunho ou canceladas
  if (proposal.status === "draft" || proposal.status === "canceled") {
    return NextResponse.json(
      { error: "Proposta não disponível publicamente" },
      { status: 403 },
    );
  }

  // Verifica expiração
  if (
    proposal.status === "sent" &&
    proposal.validUntil &&
    proposal.validUntil.getTime() < Date.now()
  ) {
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: "expired" },
    });
    return NextResponse.json(
      { error: "Proposta expirada", expiredAt: proposal.validUntil },
      { status: 410 },
    );
  }

  // Retorna apenas campos seguros (não retorna notes, approvedByEmail, etc.)
  return NextResponse.json({
    proposal: {
      id: proposal.id,
      number: proposal.number,
      title: proposal.title,
      body: proposal.body,
      summary: proposal.summary,
      billingModel: proposal.billingModel,
      campaignPrice: proposal.campaignPrice,
      leadPrice: proposal.leadPrice,
      validUntil: proposal.validUntil,
      sentAt: proposal.sentAt,
      status: proposal.status,
      version: proposal.version,
      partner: {
        companyName: proposal.partner.companyName,
        city: proposal.partner.city,
        state: proposal.partner.state,
      },
    },
  });
}
