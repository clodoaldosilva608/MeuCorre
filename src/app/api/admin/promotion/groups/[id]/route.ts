import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";

// PATCH /api/admin/promotion/groups/[id] — atualiza grupo
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as {
    name?: string;
    platform?: string;
    inviteUrl?: string;
    memberCount?: number | null;
    category?: string | null;
    city?: string | null;
    notes?: string | null;
    active?: boolean;
    lastPostedAt?: string | null;
  };

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (name.length < 2) {
      return NextResponse.json({ error: "Nome muito curto" }, { status: 400 });
    }
    data.name = sanitizeString(name, 100);
  }

  if (body.platform !== undefined) {
    const validPlatforms = [
      "whatsapp",
      "telegram",
      "facebook",
      "instagram",
      "tiktok",
      "youtube",
    ];
    if (!validPlatforms.includes(body.platform)) {
      return NextResponse.json(
        { error: "Plataforma inválida" },
        { status: 400 },
      );
    }
    data.platform = body.platform;
  }

  if (body.inviteUrl !== undefined) {
    data.inviteUrl = sanitizeString(body.inviteUrl, 500);
  }
  if (body.memberCount !== undefined) data.memberCount = body.memberCount;
  if (body.category !== undefined) {
    data.category = body.category ? sanitizeString(body.category, 50) : null;
  }
  if (body.city !== undefined) {
    data.city = body.city ? sanitizeString(body.city, 100) : null;
  }
  if (body.notes !== undefined) {
    data.notes = body.notes ? sanitizeString(body.notes, 500) : null;
  }
  if (body.active !== undefined) data.active = body.active;
  if (body.lastPostedAt !== undefined) {
    data.lastPostedAt = body.lastPostedAt ? new Date(body.lastPostedAt) : null;
  }

  try {
    const updated = await prisma.socialGroup.update({
      where: { id },
      data,
    });
    return NextResponse.json({ group: updated });
  } catch (e: unknown) {
    const err = e as Error;
    if (err.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/promotion/groups/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.socialGroup.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const err = e as Error;
    if (err.message.includes("Record to delete not found")) {
      return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
