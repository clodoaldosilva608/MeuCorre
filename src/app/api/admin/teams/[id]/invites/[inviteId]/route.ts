import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// PATCH /api/admin/teams/:id/invites/:inviteId
// Cancela convite (status → expired ou rejected)
// Body: { status: "expired" | "rejected" }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id, inviteId } = await params;
  const body = (await req.json()) as { status?: string };

  if (body.status !== "expired" && body.status !== "rejected" && body.status !== "cancelled") {
    return NextResponse.json(
      { error: "status deve ser 'expired', 'rejected' ou 'cancelled'" },
      { status: 400 },
    );
  }

  try {
    const invite = await prisma.teamInvite.update({
      where: { id: inviteId },
      data: { status: body.status },
    });
    return NextResponse.json({ invite });
  } catch {
    return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
  }
}

// DELETE /api/admin/teams/:id/invites/:inviteId (deleta fisicamente)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { inviteId } = await params;
  try {
    await prisma.teamInvite.delete({ where: { id: inviteId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
  }
}
