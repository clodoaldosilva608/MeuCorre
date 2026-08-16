import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { z } from "zod";

const VALID_TYPES = new Set([
  "call", "email", "whatsapp", "meeting", "follow_up", "note", "document",
]);
const VALID_STATUSES = new Set(["pending", "done", "canceled"]);

// GET /api/admin/partners/:id/activities — lista atividades do parceiro
// Query: status, type, assignedTo, opportunityId, scheduledAfter, scheduledBefore
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const assignedTo = searchParams.get("assignedTo") ?? undefined;
  const opportunityId = searchParams.get("opportunityId") ?? undefined;
  const scheduledAfter = searchParams.get("scheduledAfter");
  const scheduledBefore = searchParams.get("scheduledBefore");

  const where: Record<string, unknown> = { partnerId: id };
  if (status) where.status = status;
  if (type) where.type = type;
  if (assignedTo) where.assignedTo = assignedTo;
  if (opportunityId) where.opportunityId = opportunityId;
  if (scheduledAfter || scheduledBefore) {
    where.scheduledAt = {};
    if (scheduledAfter) (where.scheduledAt as Record<string, unknown>).gte = new Date(scheduledAfter);
    if (scheduledBefore) (where.scheduledAt as Record<string, unknown>).lte = new Date(scheduledBefore);
  }

  const activities = await prisma.partnerActivity.findMany({
    where,
    include: { opportunity: { select: { title: true } } },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return NextResponse.json({ activities });
}

// POST /api/admin/partners/:id/activities — cria atividade
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
    type?: string;
    title?: string;
    description?: string;
    scheduledAt?: string;
    opportunityId?: string;
    assignedTo?: string;
    metadata?: Record<string, unknown>;
  };

  if (!body.title?.trim() || !body.type) {
    return NextResponse.json(
      { error: "title e type são obrigatórios" },
      { status: 400 },
    );
  }

  if (!VALID_TYPES.has(body.type)) {
    return NextResponse.json(
      { error: `type inválido. Válidos: ${Array.from(VALID_TYPES).join(", ")}` },
      { status: 400 },
    );
  }

  const partner = await prisma.partner.findUnique({ where: { id } });
  if (!partner) {
    return NextResponse.json({ error: "Parceiro não encontrado" }, { status: 404 });
  }

  // Se opportunityId informado, valida que pertence ao parceiro
  if (body.opportunityId) {
    const opp = await prisma.opportunity.findFirst({
      where: { id: body.opportunityId, partnerId: id },
    });
    if (!opp) {
      return NextResponse.json(
        { error: "Oportunidade não pertence a este parceiro" },
        { status: 400 },
      );
    }
  }

  try {
    const activity = await prisma.partnerActivity.create({
      data: {
        partnerId: id,
        opportunityId: body.opportunityId || null,
        type: body.type,
        title: sanitizeString(body.title, 200),
        description: sanitizeString(body.description, 2000) || null,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        status: "pending",
        assignedTo: sanitizeString(body.assignedTo, 100) || "Clodoaldo Silva",
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      },
    });

    await prisma.partnerLog.create({
      data: {
        partnerId: id,
        action: "activity_created",
        details: JSON.stringify({
          activityId: activity.id,
          type: activity.type,
          title: activity.title,
        }),
        adminEmail,
        ipAddress: req.headers.get("x-forwarded-for") ?? null,
      },
    });

    return NextResponse.json({ activity }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar atividade" }, { status: 500 });
  }
}
