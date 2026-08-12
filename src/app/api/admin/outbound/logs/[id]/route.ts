import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";

// GET /api/admin/outbound/logs/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const log = await prisma.outboundLog.findUnique({
    where: { id },
    include: {
      partner: { select: { id: true, companyName: true, city: true, state: true } },
      contact: { select: { id: true, name: true, email: true, phone: true, optOut: true } },
      template: { select: { id: true, name: true, channel: true, objective: true, version: true } },
    },
  });

  if (!log) {
    return NextResponse.json({ error: "Log não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ log });
}

// PATCH /api/admin/outbound/logs/:id
// Atualiza log (campos limitados: status, lostReason, followUpAt, followUpNotes, notes, responseText)
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

  const before = await prisma.outboundLog.findUnique({ where: { id } });
  if (!before) {
    return NextResponse.json({ error: "Log não encontrado" }, { status: 404 });
  }

  const validStatuses = new Set([
    "preparado", "aguardando_aprovacao", "enviado", "respondeu", "interessado",
    "reuniao_marcada", "proposta_enviada", "negociacao", "ganho", "ativo",
    "opt_out", "perdido", "erro",
  ]);

  const data: Record<string, unknown> = {};
  if (body.status !== undefined && validStatuses.has(body.status as string)) {
    data.status = body.status;
  }
  if (body.lostReason !== undefined) {
    data.lostReason = sanitizeString(body.lostReason as string, 500) || null;
  }
  if (body.followUpAt !== undefined) {
    data.followUpAt = body.followUpAt ? new Date(body.followUpAt as string) : null;
  }
  if (body.followUpNotes !== undefined) {
    data.followUpNotes = sanitizeString(body.followUpNotes as string, 500) || null;
  }
  if (body.notes !== undefined) {
    data.notes = sanitizeString(body.notes as string, 1000) || null;
  }
  if (body.responseText !== undefined) {
    data.responseText = sanitizeString(body.responseText as string, 5000) || null;
  }

  // Se status mudou para opt_out, marca o contato como optOut=true (PERMANENTE)
  if (body.status === "opt_out") {
    await prisma.partnerContact.update({
      where: { id: before.contactId },
      data: { optOut: true },
    });

    // Log no Partner
    await prisma.partnerLog.create({
      data: {
        partnerId: before.partnerId,
        action: "contact_opt_out",
        details: JSON.stringify({
          contactId: before.contactId,
          source: "outbound_response",
          outboundLogId: id,
        }),
        adminEmail,
        ipAddress: req.headers.get("x-forwarded-for") ?? null,
      },
    });
  }

  try {
    const log = await prisma.outboundLog.update({
      where: { id },
      data,
    });
    return NextResponse.json({ log });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// DELETE /api/admin/outbound/logs/:id (só permite se status=preparado)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const adminEmail = await getAdminEmail();

  const log = await prisma.outboundLog.findUnique({ where: { id } });
  if (!log) {
    return NextResponse.json({ error: "Log não encontrado" }, { status: 404 });
  }

  if (log.status !== "preparado") {
    return NextResponse.json(
      { error: `Não é possível remover log com status "${log.status}". Apenas "preparado" pode ser removido.` },
      { status: 400 },
    );
  }

  await prisma.outboundLog.delete({ where: { id } });

  await prisma.partnerLog.create({
    data: {
      partnerId: log.partnerId,
      action: "outbound_log_removed",
      details: JSON.stringify({ outboundLogId: id }),
      adminEmail,
      ipAddress: req.headers.get("x-forwarded-for") ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
