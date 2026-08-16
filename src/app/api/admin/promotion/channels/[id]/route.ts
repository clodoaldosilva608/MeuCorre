import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { z } from "zod";

// PATCH /api/admin/promotion/channels/:id
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
  if (body.name !== undefined) data.name = sanitizeString(body.name as string, 50);
  if (body.platform !== undefined) data.platform = body.platform;
  if (body.profileUrl !== undefined)
    data.profileUrl = sanitizeString(body.profileUrl as string, 500) || "";
  if (body.bannerUrl !== undefined)
    data.bannerUrl = sanitizeString(body.bannerUrl as string, 500) || null;
  if (body.promoTitle !== undefined)
    data.promoTitle = sanitizeString(body.promoTitle as string, 100) || null;
  if (body.promoText !== undefined)
    data.promoText = sanitizeString(body.promoText as string, 300) || null;
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.sortOrder !== undefined)
    data.sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : 0;

  try {
    const channel = await prisma.socialChannel.update({
      where: { id },
      data,
    });
    return NextResponse.json({ channel });
  } catch {
    return NextResponse.json({ error: "Canal não encontrado" }, { status: 404 });
  }
}

// DELETE /api/admin/promotion/channels/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.socialChannel.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Canal não encontrado" }, { status: 404 });
  }
}
