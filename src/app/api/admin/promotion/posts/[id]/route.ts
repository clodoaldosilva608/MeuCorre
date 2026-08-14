import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";

// PATCH /api/admin/promotion/posts/:id — atualiza postagem
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
  const allowedFields: Array<[string, (v: unknown) => unknown]> = [
    ["editorialDay", (v) => (typeof v === "number" ? v : undefined)],
    ["sequenceNumber", (v) => (typeof v === "number" ? v : undefined)],
    ["publishAt", (v) => (typeof v === "string" ? new Date(v) : undefined)],
    ["timezone", (v) => (typeof v === "string" ? v : undefined)],
    ["platform", (v) => (typeof v === "string" ? v : undefined)],
    ["platforms", (v) => (typeof v === "string" ? v : v === null ? null : undefined)],
    ["format", (v) => (typeof v === "string" ? sanitizeString(v, 100) || null : undefined)],
    ["pillar", (v) => (typeof v === "string" ? sanitizeString(v, 100) || null : undefined)],
    ["title", (v) => (typeof v === "string" ? sanitizeString(v, 200) : undefined)],
    ["description", (v) => (typeof v === "string" ? v : undefined)],
    ["hashtags", (v) => (typeof v === "string" ? sanitizeString(v, 500) || null : undefined)],
    ["engagementText", (v) => (typeof v === "string" ? sanitizeString(v, 500) || null : undefined)],
    ["cta", (v) => (typeof v === "string" ? sanitizeString(v, 200) || null : undefined)],
    ["destinationUrl", (v) => (typeof v === "string" ? sanitizeString(v, 500) || null : undefined)],
    ["altText", (v) => (typeof v === "string" ? sanitizeString(v, 300) || null : undefined)],
    ["videoScript", (v) => (typeof v === "string" ? v : undefined)],
    ["durationSeconds", (v) => (typeof v === "number" ? v : undefined)],
    ["status", (v) => (typeof v === "string" ? v : undefined)],
    ["publishedAt", (v) => (typeof v === "string" ? new Date(v) : v === null ? null : undefined)],
    ["notes", (v) => (typeof v === "string" ? sanitizeString(v, 500) || null : undefined)],
    ["utmQuery", (v) => (typeof v === "string" ? sanitizeString(v, 500) || null : undefined)],
    ["assetId", (v) => (typeof v === "string" ? v : v === null ? null : undefined)],
  ];

  for (const [field, transform] of allowedFields) {
    if (body[field] !== undefined) {
      const val = transform(body[field]);
      if (val !== undefined) data[field] = val;
    }
  }

  try {
    const post = await prisma.promotionPost.update({
      where: { id },
      data,
      include: {
        asset: true,
        postAssets: { include: { asset: true }, orderBy: { sortOrder: "asc" } },
        campaign: { select: { id: true, name: true, color: true } },
      },
    });
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "Postagem não encontrada" }, { status: 404 });
  }
}

// DELETE /api/admin/promotion/posts/:id — remove postagem
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.promotionPost.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Postagem não encontrada" }, { status: 404 });
  }
}

// GET /api/admin/promotion/posts/:id — busca uma postagem específica
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.promotionPost.findUnique({
    where: { id },
    include: {
      asset: true,
      campaign: true,
      reminders: { orderBy: { remindAt: "asc" } },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Postagem não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ post });
}
