import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { z } from "zod";

const VALID_CHANNELS = new Set(["email", "whatsapp", "linkedin", "phone"]);
const VALID_OBJECTIVES = new Set([
  "permission", "discovery", "proposal", "follow_up", "renewal",
]);
const VALID_STATUSES = new Set(["draft", "approved", "paused", "archived"]);

// GET /api/admin/outbound/templates/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const template = await prisma.outboundTemplate.findUnique({
    where: { id },
    include: {
      _count: { select: { logs: true } },
    },
  });

  if (!template) {
    return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
  }

  // Busca versões anteriores
  const previousVersions = await prisma.outboundTemplate.findMany({
    where: { parentTemplateId: id },
    select: { id: true, version: true, status: true, createdAt: true, name: true },
    orderBy: { version: "desc" },
  });

  return NextResponse.json({ template, previousVersions });
}

// PATCH /api/admin/outbound/templates/:id
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

  const before = await prisma.outboundTemplate.findUnique({ where: { id } });
  if (!before) {
    return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = sanitizeString(body.name as string, 150);
  if (body.channel !== undefined && VALID_CHANNELS.has(body.channel as string)) {
    data.channel = body.channel;
  }
  if (body.segment !== undefined)
    data.segment = sanitizeString(body.segment as string, 100) || null;
  if (body.objective !== undefined && VALID_OBJECTIVES.has(body.objective as string)) {
    data.objective = body.objective;
  }
  if (body.subject !== undefined)
    data.subject = sanitizeString(body.subject as string, 200) || null;
  if (body.body !== undefined) data.body = body.body as string;
  if (body.cta !== undefined)
    data.cta = sanitizeString(body.cta as string, 200) || null;
  if (body.optOutText !== undefined)
    data.optOutText = sanitizeString(body.optOutText as string, 200) || null;
  if (body.variables !== undefined)
    data.variables = sanitizeString(body.variables as string, 500) || null;
  if (body.status !== undefined && VALID_STATUSES.has(body.status as string)) {
    data.status = body.status;
  }
  if (body.notes !== undefined)
    data.notes = sanitizeString(body.notes as string, 2000) || null;

  // Revalida: subject obrigatório para email
  if (data.channel === "email" && (data.subject === "" || data.subject === null) && before.channel !== "email") {
    return NextResponse.json(
      { error: "subject é obrigatório para channel=email" },
      { status: 400 },
    );
  }

  try {
    const template = await prisma.outboundTemplate.update({
      where: { id },
      data,
    });
    return NextResponse.json({ template });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// DELETE /api/admin/outbound/templates/:id (marca como archived — não deleta fisicamente)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    // Soft delete — marca como archived
    const template = await prisma.outboundTemplate.update({
      where: { id },
      data: { status: "archived" },
    });
    return NextResponse.json({ ok: true, template });
  } catch {
    return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
  }
}
