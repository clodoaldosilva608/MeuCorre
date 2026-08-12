import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";

// PATCH /api/admin/commercial-assets/:id
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
  if (body.type !== undefined) {
    const valid = new Set([
      "media_kit", "case", "contract", "presentation",
      "one_pager", "pricing_table", "video", "other",
    ]);
    if (valid.has(body.type as string)) data.type = body.type;
  }
  if (body.name !== undefined) data.name = sanitizeString(body.name as string, 150);
  if (body.description !== undefined)
    data.description = sanitizeString(body.description as string, 500) || null;
  if (body.storageKey !== undefined)
    data.storageKey = sanitizeString(body.storageKey as string, 500);
  if (body.publicUrl !== undefined)
    data.publicUrl = sanitizeString(body.publicUrl as string, 2000) || null;
  if (body.mimeType !== undefined)
    data.mimeType = sanitizeString(body.mimeType as string, 100);
  if (body.fileSize !== undefined)
    data.fileSize = typeof body.fileSize === "number" ? body.fileSize : null;
  if (body.version !== undefined)
    data.version = sanitizeString(body.version as string, 50) || null;
  if (body.tags !== undefined)
    data.tags = sanitizeString(body.tags as string, 300) || null;
  if (body.active !== undefined) data.active = Boolean(body.active);

  try {
    const asset = await prisma.commercialAsset.update({
      where: { id },
      data,
    });
    return NextResponse.json({ asset });
  } catch {
    return NextResponse.json({ error: "Asset não encontrado" }, { status: 404 });
  }
}

// DELETE /api/admin/commercial-assets/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.commercialAsset.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Asset não encontrado" }, { status: 404 });
  }
}
