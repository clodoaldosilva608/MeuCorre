import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";

const VALID_STATUSES = new Set(["pending", "done", "canceled"]);

// PATCH /api/admin/partners/:id/activities/:actId
// Atualiza atividade. Se status muda para 'done' → completedAt=now.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; actId: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id, actId } = await params;
  const adminEmail = await getAdminEmail();
  const body = (await req.json()) as Record<string, unknown>;

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = sanitizeString(body.title as string, 200);
  if (body.description !== undefined)
    data.description = sanitizeString(body.description as string, 2000) || null;
  if (body.scheduledAt !== undefined) {
    data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt as string) : null;
  }
  if (body.status !== undefined && VALID_STATUSES.has(body.status as string)) {
    data.status = body.status;
    if (body.status === "done") {
      data.completedAt = new Date();
    }
  }
  if (body.assignedTo !== undefined)
    data.assignedTo = sanitizeString(body.assignedTo as string, 100) || "Clodoaldo Silva";
  if (body.metadata !== undefined) {
    data.metadata = body.metadata ? JSON.stringify(body.metadata) : null;
  }

  try {
    const activity = await prisma.partnerActivity.update({
      where: { id: actId },
      data,
    });

    if (data.status === "done") {
      await prisma.partnerLog.create({
        data: {
          partnerId: id,
          action: "activity_completed",
          details: JSON.stringify({
            activityId: actId,
            type: activity.type,
            title: activity.title,
          }),
          adminEmail,
          ipAddress: req.headers.get("x-forwarded-for") ?? null,
        },
      });
    }

    return NextResponse.json({ activity });
  } catch {
    return NextResponse.json({ error: "Atividade não encontrada" }, { status: 404 });
  }
}

// DELETE /api/admin/partners/:id/activities/:actId
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; actId: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id, actId } = await params;
  const adminEmail = await getAdminEmail();

  try {
    const activity = await prisma.partnerActivity.delete({ where: { id: actId } });

    await prisma.partnerLog.create({
      data: {
        partnerId: id,
        action: "activity_deleted",
        details: JSON.stringify({
          activityId: actId,
          type: activity.type,
          title: activity.title,
        }),
        adminEmail,
        ipAddress: req.headers.get("x-forwarded-for") ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Atividade não encontrada" }, { status: 404 });
  }
}
