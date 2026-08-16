import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { z } from "zod";

// PATCH /api/admin/promotion/reminders/:id
// Atualiza lembrete (status, sentAt, remindAt, channel)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as {
    status?: string;
    remindAt?: string;
    minutesBefore?: number;
    channel?: string;
    sentAt?: string | null;
  };

  const data: Record<string, unknown> = {};
  if (body.status !== undefined) {
    const valid = ["pending", "sent", "failed", "canceled"];
    if (valid.includes(body.status)) data.status = body.status;
  }
  if (body.remindAt !== undefined) data.remindAt = new Date(body.remindAt);
  if (body.minutesBefore !== undefined) data.minutesBefore = body.minutesBefore;
  if (body.channel !== undefined) {
    const valid = ["browser", "email", "whatsapp"];
    if (valid.includes(body.channel)) data.channel = body.channel;
  }
  if (body.sentAt !== undefined) {
    data.sentAt = body.sentAt ? new Date(body.sentAt) : null;
  }

  try {
    const reminder = await prisma.promotionReminder.update({
      where: { id },
      data,
    });
    return NextResponse.json({ reminder });
  } catch {
    return NextResponse.json({ error: "Lembrete não encontrado" }, { status: 404 });
  }
}

// DELETE /api/admin/promotion/reminders/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.promotionReminder.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Lembrete não encontrado" }, { status: 404 });
  }
}
