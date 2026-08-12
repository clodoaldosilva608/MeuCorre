import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";

const VALID_STAGES = new Set([
  "novo_lead", "qualificando", "contato_iniciado", "descoberta",
  "proposta_enviada", "negociacao", "aguardando_aprovacao",
  "ativacao", "ativo", "renovacao", "perdido", "desqualificado",
]);

// PATCH /api/admin/partners/:id/opportunities/:oppId
// Atualiza oportunidade. Se stage muda para 'ativo' → wonAt; se 'perdido' → lostAt.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; oppId: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id, oppId } = await params;
  const adminEmail = await getAdminEmail();
  const body = (await req.json()) as Record<string, unknown>;

  const before = await prisma.opportunity.findUnique({ where: { id: oppId } });
  if (!before) {
    return NextResponse.json({ error: "Oportunidade não encontrada" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = sanitizeString(body.title as string, 200);
  if (body.description !== undefined)
    data.description = sanitizeString(body.description as string, 2000) || null;
  if (body.stage !== undefined && VALID_STAGES.has(body.stage as string)) {
    data.stage = body.stage;
    // Se mudou para ativo → registra wonAt
    if (body.stage === "ativo" && !before.wonAt) {
      data.wonAt = new Date();
    }
    // Se mudou para perdido → registra lostAt
    if (body.stage === "perdido" && !before.lostAt) {
      data.lostAt = new Date();
    }
  }
  if (body.contactId !== undefined) {
    if (body.contactId === null) {
      data.contactId = null;
    } else {
      // Valida que contato pertence ao parceiro
      const contact = await prisma.partnerContact.findFirst({
        where: { id: body.contactId as string, partnerId: id },
      });
      if (!contact) {
        return NextResponse.json(
          { error: "Contato não pertence a este parceiro" },
          { status: 400 },
        );
      }
      data.contactId = body.contactId;
    }
  }
  if (body.potentialValue !== undefined) {
    if (typeof body.potentialValue === "number" && body.potentialValue >= 0) {
      data.potentialValue = body.potentialValue;
    } else if (body.potentialValue === null) {
      data.potentialValue = null;
    }
  }
  if (body.expectedCloseAt !== undefined) {
    data.expectedCloseAt = body.expectedCloseAt ? new Date(body.expectedCloseAt as string) : null;
  }
  if (body.billingModel !== undefined) {
    const valid = new Set(["campaign", "lead", "both"]);
    if (valid.has(body.billingModel as string) || body.billingModel === null) {
      data.billingModel = body.billingModel;
    }
  }
  if (body.lostReason !== undefined) {
    data.lostReason = sanitizeString(body.lostReason as string, 500) || null;
  }

  try {
    const opportunity = await prisma.opportunity.update({
      where: { id: oppId },
      data,
    });

    // Se stage mudou, sincroniza com Partner.stage
    if (data.stage) {
      await prisma.partner.update({
        where: { id },
        data: { stage: data.stage as string },
      });

      await prisma.partnerLog.create({
        data: {
          partnerId: id,
          action: "stage_changed",
          details: JSON.stringify({
            opportunityId: oppId,
            opportunityTitle: opportunity.title,
            before: { stage: before.stage },
            after: { stage: opportunity.stage },
          }),
          adminEmail,
          ipAddress: req.headers.get("x-forwarded-for") ?? null,
        },
      });
    }

    return NextResponse.json({ opportunity });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// DELETE /api/admin/partners/:id/opportunities/:oppId
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; oppId: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id, oppId } = await params;
  const adminEmail = await getAdminEmail();

  try {
    await prisma.opportunity.delete({ where: { id: oppId } });

    await prisma.partnerLog.create({
      data: {
        partnerId: id,
        action: "opportunity_deleted",
        details: JSON.stringify({ opportunityId: oppId }),
        adminEmail,
        ipAddress: req.headers.get("x-forwarded-for") ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Oportunidade não encontrada" }, { status: 404 });
  }
}
