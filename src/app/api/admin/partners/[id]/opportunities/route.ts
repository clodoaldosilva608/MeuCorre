import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";

// GET /api/admin/partners/:id/opportunities — lista oportunidades do parceiro
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const opportunities = await prisma.opportunity.findMany({
    where: { partnerId: id },
    include: {
      contact: true,
      _count: { select: { activities: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ opportunities });
}

// POST /api/admin/partners/:id/opportunities — cria oportunidade
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const adminEmail = await getAdminEmail();
  const body = (await req.json()) as {
    title?: string;
    description?: string;
    stage?: string;
    contactId?: string;
    potentialValue?: number;
    expectedCloseAt?: string;
    billingModel?: string;
  };

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title é obrigatório" }, { status: 400 });
  }

  const partner = await prisma.partner.findUnique({ where: { id } });
  if (!partner) {
    return NextResponse.json({ error: "Parceiro não encontrado" }, { status: 404 });
  }

  const validStages = new Set([
    "novo_lead", "qualificando", "contato_iniciado", "descoberta",
    "proposta_enviada", "negociacao", "aguardando_aprovacao",
    "ativacao", "ativo", "renovacao", "perdido", "desqualificado",
  ]);
  const stage = validStages.has(body.stage ?? "") ? body.stage! : "novo_lead";

  const validBilling = new Set(["campaign", "lead", "both"]);
  const billingModel = validBilling.has(body.billingModel ?? "")
    ? body.billingModel!
    : null;

  // Se contactId informado, valida que pertence ao parceiro
  if (body.contactId) {
    const contact = await prisma.partnerContact.findFirst({
      where: { id: body.contactId, partnerId: id },
    });
    if (!contact) {
      return NextResponse.json(
        { error: "Contato não pertence a este parceiro" },
        { status: 400 },
      );
    }
  }

  try {
    const opportunity = await prisma.opportunity.create({
      data: {
        partnerId: id,
        contactId: body.contactId || null,
        title: sanitizeString(body.title, 200),
        description: sanitizeString(body.description, 2000) || null,
        stage,
        potentialValue:
          typeof body.potentialValue === "number" && body.potentialValue >= 0
            ? body.potentialValue
            : null,
        expectedCloseAt: body.expectedCloseAt ? new Date(body.expectedCloseAt) : null,
        billingModel,
      },
    });

    // Sincroniza stage do Partner com a oportunidade mais recente
    await prisma.partner.update({
      where: { id },
      data: { stage },
    });

    await prisma.partnerLog.create({
      data: {
        partnerId: id,
        action: "opportunity_created",
        details: JSON.stringify({ opportunityId: opportunity.id, title: opportunity.title, stage }),
        adminEmail,
        ipAddress: req.headers.get("x-forwarded-for") ?? null,
      },
    });

    return NextResponse.json({ opportunity }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar oportunidade" }, { status: 500 });
  }
}
