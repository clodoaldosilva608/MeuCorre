import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { z } from "zod";

const VALID_ROLES = new Set(["owner", "admin", "member"]);
const VALID_STATUSES = new Set(["active", "suspended", "removed"]);

// PATCH /api/admin/teams/:id/members/:memberId
// Atualiza role ou status do membro
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { memberId } = await params;
  const body = (await req.json()) as { role?: string; status?: string };

  const data: Record<string, unknown> = {};
  if (body.role !== undefined && VALID_ROLES.has(body.role)) {
    data.role = body.role;
  }
  if (body.status !== undefined && VALID_STATUSES.has(body.status)) {
    data.status = body.status;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Forneça role ou status para atualizar" },
      { status: 400 },
    );
  }

  try {
    const member = await prisma.teamMember.update({
      where: { id: memberId },
      data,
    });
    return NextResponse.json({ member });
  } catch {
    return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
  }
}

// DELETE /api/admin/teams/:id/members/:memberId (marca como removed)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { memberId } = await params;
  try {
    const member = await prisma.teamMember.update({
      where: { id: memberId },
      data: { status: "removed" },
    });
    return NextResponse.json({ ok: true, member });
  } catch {
    return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
  }
}
