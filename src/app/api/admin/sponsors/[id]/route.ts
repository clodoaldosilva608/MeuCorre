import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// PATCH /api/admin/sponsors/[id] — atualiza
// DELETE /api/admin/sponsors/[id] — remove

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const sponsor = await prisma.sponsor.update({ where: { id }, data: body });
    return NextResponse.json({ sponsor });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao atualizar", details: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await prisma.sponsor.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao remover", details: String(err) }, { status: 500 });
  }
}
