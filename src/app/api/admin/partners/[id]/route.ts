import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";

// GET /api/admin/partners/:id — ficha 360° (parceiro + contatos + oportunidades + atividades + logs)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const partner = await prisma.partner.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: [{ isPrimary: "desc" }, { name: "asc" }] },
      opportunities: {
        orderBy: { updatedAt: "desc" },
        include: { contact: true, _count: { select: { activities: true } } },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { opportunity: { select: { title: true } } },
      },
      logs: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      _count: {
        select: { contacts: true, opportunities: true, activities: true },
      },
    },
  });

  if (!partner) {
    return NextResponse.json({ error: "Parceiro não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ partner });
}

// PATCH /api/admin/partners/:id — atualiza parceiro
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

  // Busca estado atual para log de auditoria
  const before = await prisma.partner.findUnique({ where: { id } });
  if (!before) {
    return NextResponse.json({ error: "Parceiro não encontrado" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  const allowedStringFields: Array<[string, number]> = [
    ["companyName", 150],
    ["tradeName", 150],
    ["category", 50],
    ["origin", 30],
    ["city", 100],
    ["state", 2],
    ["address", 300],
    ["website", 300],
    ["phone", 30],
    ["email", 100],
    ["logoUrl", 500],
    ["assignedTo", 100],
    ["tags", 300],
    ["notes", 2000],
  ];

  for (const [field, max] of allowedStringFields) {
    if (body[field] !== undefined) {
      const val = sanitizeString(body[field] as string, max);
      if (field === "email" && val) {
        data[field] = val.toLowerCase();
      } else if (field === "state" && val) {
        data[field] = val.toUpperCase();
      } else {
        data[field] = val || null;
      }
    }
  }

  if (body.cnpj !== undefined) {
    const cnpj = (body.cnpj as string).replace(/\D/g, "");
    data.cnpj = cnpj || null;
  }

  const validPriorities = ["baixa", "media", "alta", "urgente"];
  if (body.priority !== undefined && validPriorities.includes(body.priority as string)) {
    data.priority = body.priority;
  }

  const validStatuses = ["active", "paused", "archived", "lost", "disqualified"];
  if (body.status !== undefined && validStatuses.includes(body.status as string)) {
    data.status = body.status;
  }

  const validStages = [
    "novo_lead", "qualificando", "contato_iniciado", "descoberta",
    "proposta_enviada", "negociacao", "aguardando_aprovacao",
    "ativacao", "ativo", "renovacao", "perdido", "desqualificado",
  ];
  if (body.stage !== undefined && validStages.includes(body.stage as string)) {
    data.stage = body.stage;
  }

  // Scores 0-100
  for (const field of ["relevanceScore", "benefitScore", "reputationScore", "capacityScore", "riskScore"]) {
    if (body[field] !== undefined) {
      const v = body[field];
      if (typeof v === "number" && v >= 0 && v <= 100) {
        data[field] = Math.round(v);
      } else if (v === null) {
        data[field] = null;
      }
    }
  }

  if (body.potentialValue !== undefined) {
    if (typeof body.potentialValue === "number" && body.potentialValue >= 0) {
      data.potentialValue = body.potentialValue;
    } else if (body.potentialValue === null) {
      data.potentialValue = null;
    }
  }

  try {
    const partner = await prisma.partner.update({
      where: { id },
      data,
    });

    // Detecta mudança de stage para log específico
    const changedFields = Object.keys(data);
    const isStageChange = changedFields.includes("stage");

    await prisma.partnerLog.create({
      data: {
        partnerId: id,
        action: isStageChange ? "stage_changed" : "updated",
        details: JSON.stringify({
          before: isStageChange ? { stage: before.stage } : before,
          after: isStageChange ? { stage: partner.stage } : partner,
          changedFields,
        }),
        adminEmail,
        ipAddress: req.headers.get("x-forwarded-for") ?? null,
      },
    });

    return NextResponse.json({ partner });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// DELETE /api/admin/partners/:id — remove parceiro (cascade)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const adminEmail = await getAdminEmail();

  try {
    await prisma.partner.delete({ where: { id } });

    // Log de auditoria via PartnerLog já criado acima
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Parceiro não encontrado" }, { status: 404 });
  }
}
