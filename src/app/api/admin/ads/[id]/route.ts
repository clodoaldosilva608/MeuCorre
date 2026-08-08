import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { invalidateAdsCache } from "@/app/api/ads/route";

// PATCH /api/admin/ads/[id] — atualiza anúncio
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as {
    title?: string;
    description?: string;
    cta?: string;
    url?: string;
    imageUrl?: string;
    bgColor?: string;
    textColor?: string;
    placement?: string;
    active?: boolean;
    startsAt?: string;
    endsAt?: string | null;
  };

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title.trim();
  if (body.description !== undefined)
    data.description = body.description?.trim() || null;
  if (body.cta !== undefined) data.cta = body.cta.trim() || "Saiba mais";
  if (body.url !== undefined) data.url = body.url?.trim() || null;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl?.trim() || null;
  if (body.bgColor !== undefined) data.bgColor = body.bgColor;
  if (body.textColor !== undefined) data.textColor = body.textColor;
  if (body.placement !== undefined) data.placement = body.placement;
  if (body.active !== undefined) data.active = body.active;
  if (body.startsAt !== undefined) data.startsAt = new Date(body.startsAt);
  if (body.endsAt !== undefined)
    data.endsAt = body.endsAt ? new Date(body.endsAt) : null;

  try {
    const ad = await prisma.ad.update({ where: { id }, data });
    invalidateAdsCache();
    return NextResponse.json({ ad });
  } catch {
    return NextResponse.json({ error: "Anúncio não encontrado" }, { status: 404 });
  }
}

// DELETE /api/admin/ads/[id] — exclui anúncio
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.ad.delete({ where: { id } });
    invalidateAdsCache();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Anúncio não encontrado" }, { status: 404 });
  }
}
