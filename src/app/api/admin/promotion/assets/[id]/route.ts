import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";

// PATCH /api/admin/promotion/assets/:id
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
  if (body.name !== undefined)
    data.name = sanitizeString(body.name as string, 200);
  if (body.storageKey !== undefined)
    data.storageKey = sanitizeString(body.storageKey as string, 500);
  if (body.publicUrl !== undefined)
    data.publicUrl = sanitizeString(body.publicUrl as string, 2000) || null;
  if (body.mimeType !== undefined)
    data.mimeType = sanitizeString(body.mimeType as string, 100);
  if (body.width !== undefined)
    data.width = typeof body.width === "number" ? body.width : null;
  if (body.height !== undefined)
    data.height = typeof body.height === "number" ? body.height : null;
  if (body.fileSize !== undefined)
    data.fileSize = typeof body.fileSize === "number" ? body.fileSize : null;
  if (body.altText !== undefined)
    data.altText = sanitizeString(body.altText as string, 300) || null;
  if (body.source !== undefined)
    data.source = sanitizeString(body.source as string, 50) || null;
  if (body.baseAssetName !== undefined)
    data.baseAssetName =
      sanitizeString(body.baseAssetName as string, 200) || null;
  if (body.tags !== undefined)
    data.tags = sanitizeString(body.tags as string, 500) || null;
  if (body.hash !== undefined)
    data.hash = sanitizeString(body.hash as string, 100) || null;

  try {
    const asset = await prisma.promotionAsset.update({
      where: { id },
      data,
    });
    return NextResponse.json({ asset });
  } catch {
    return NextResponse.json({ error: "Asset não encontrado" }, { status: 404 });
  }
}

// DELETE /api/admin/promotion/assets/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    // SetNull no relacionamento — posts ficam sem asset mas não são removidos
    await prisma.promotionAsset.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Asset não encontrado" }, { status: 404 });
  }
}
