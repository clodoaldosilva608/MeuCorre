import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { z } from "zod";

// GET /api/admin/teams/:id — detalhe do time com membros e convites
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        orderBy: [{ role: "asc" }, { joinedAt: "desc" }],
      },
      invites: {
        where: { status: "pending" },
        orderBy: { invitedAt: "desc" },
      },
      _count: { select: { members: true, invites: true } },
    },
  });

  if (!team) {
    return NextResponse.json({ error: "Time não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ team });
}

// PATCH /api/admin/teams/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = sanitizeString(body.name as string, 100);
  if (body.description !== undefined)
    data.description = sanitizeString(body.description as string, 500) || null;
  if (body.companyName !== undefined)
    data.companyName = sanitizeString(body.companyName as string, 150) || null;
  if (body.cnpj !== undefined)
    data.cnpj = body.cnpj ? (body.cnpj as string).replace(/\D/g, "") : null;
  if (body.managerName !== undefined)
    data.managerName = sanitizeString(body.managerName as string, 100) || null;
  if (body.managerEmail !== undefined)
    data.managerEmail = sanitizeString(body.managerEmail as string, 100)?.toLowerCase() || null;
  if (body.managerPhone !== undefined)
    data.managerPhone = sanitizeString(body.managerPhone as string, 30) || null;
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.maxMembers !== undefined) {
    const m = Number(body.maxMembers);
    if (m > 0 && m <= 1000) data.maxMembers = m;
  }

  try {
    const team = await prisma.team.update({
      where: { id },
      data,
      include: { _count: { select: { members: true, invites: true } } },
    });
    return NextResponse.json({ team });
  } catch {
    return NextResponse.json({ error: "Time não encontrado" }, { status: 404 });
  }
}

// DELETE /api/admin/teams/:id (desativa — não deleta fisicamente)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const team = await prisma.team.update({
      where: { id },
      data: { active: false },
    });
    return NextResponse.json({ ok: true, team });
  } catch {
    return NextResponse.json({ error: "Time não encontrado" }, { status: 404 });
  }
}
