import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";

// GET /api/admin/commercial-assets — lista assets
// Query: type, search, active, limit, offset
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const active = searchParams.get("active");
  const limit = Math.min(Number(searchParams.get("limit") ?? 200), 500);
  const offset = Number(searchParams.get("offset") ?? 0);

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (active !== null && active !== undefined) {
    where.active = active === "true";
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { tags: { contains: search, mode: "insensitive" } },
    ];
  }

  const [assets, total] = await Promise.all([
    prisma.commercialAsset.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.commercialAsset.count({ where }),
  ]);

  // Estatísticas por tipo
  const byType = await prisma.commercialAsset.groupBy({
    by: ["type"],
    _count: true,
    where: { active: true },
  });

  return NextResponse.json({
    assets,
    total,
    byType,
    limit,
    offset,
  });
}

// POST /api/admin/commercial-assets — cria registro de asset (sem upload)
// Para upload real, use POST /api/admin/commercial-assets/upload
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as {
    type?: string;
    name?: string;
    description?: string;
    storageKey?: string;
    publicUrl?: string;
    mimeType?: string;
    fileSize?: number;
    version?: string;
    tags?: string;
    active?: boolean;
  };

  if (!body.type?.trim() || !body.name?.trim() || !body.storageKey?.trim()) {
    return NextResponse.json(
      { error: "type, name e storageKey são obrigatórios" },
      { status: 400 },
    );
  }

  const validTypes = new Set([
    "media_kit", "case", "contract", "presentation",
    "one_pager", "pricing_table", "video", "other",
  ]);
  if (!validTypes.has(body.type)) {
    return NextResponse.json(
      { error: `Tipo inválido. Válidos: ${Array.from(validTypes).join(", ")}` },
      { status: 400 },
    );
  }

  const asset = await prisma.commercialAsset.create({
    data: {
      type: body.type,
      name: sanitizeString(body.name, 150),
      description: sanitizeString(body.description, 500) || null,
      storageKey: sanitizeString(body.storageKey, 500),
      publicUrl: sanitizeString(body.publicUrl, 2000) || null,
      mimeType: sanitizeString(body.mimeType, 100) || "application/octet-stream",
      fileSize: typeof body.fileSize === "number" ? body.fileSize : null,
      version: sanitizeString(body.version, 50) || null,
      tags: sanitizeString(body.tags, 300) || null,
      active: body.active ?? true,
    },
  });

  return NextResponse.json({ asset }, { status: 201 });
}
