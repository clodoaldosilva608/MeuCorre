import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";

// GET /api/admin/promotion/assets — lista assets
// Query: search, baseAssetName, source, limit, offset
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? undefined;
  const baseAssetName = searchParams.get("baseAssetName") ?? undefined;
  const source = searchParams.get("source") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 200), 500);
  const offset = Number(searchParams.get("offset") ?? 0);

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { baseAssetName: { contains: search, mode: "insensitive" } },
      { altText: { contains: search, mode: "insensitive" } },
      { tags: { contains: search, mode: "insensitive" } },
    ];
  }
  if (baseAssetName) where.baseAssetName = baseAssetName;
  if (source) where.source = source;

  const [assets, total] = await Promise.all([
    prisma.promotionAsset.findMany({
      where,
      include: {
        _count: { select: { posts: true } },
      },
      orderBy: { name: "asc" },
      take: limit,
      skip: offset,
    }),
    prisma.promotionAsset.count({ where }),
  ]);

  // Estatísticas extras
  const withUrl = await prisma.promotionAsset.count({
    where: { ...where, publicUrl: { not: null } },
  });
  const withoutUrl = total - withUrl;

  return NextResponse.json({
    assets,
    total,
    withUrl,
    withoutUrl,
    limit,
    offset,
  });
}

// POST /api/admin/promotion/assets — registra um asset (sem upload)
// Para upload real de arquivo, use POST /api/admin/promotion/assets/upload
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as {
    name?: string;
    storageKey?: string;
    publicUrl?: string;
    mimeType?: string;
    width?: number;
    height?: number;
    fileSize?: number;
    altText?: string;
    source?: string;
    baseAssetName?: string;
    tags?: string;
    hash?: string;
  };

  if (!body.name?.trim() || !body.storageKey?.trim()) {
    return NextResponse.json(
      { error: "name e storageKey são obrigatórios" },
      { status: 400 },
    );
  }

  // Verifica duplicação por name
  const existing = await prisma.promotionAsset.findFirst({
    where: { name: body.name },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Já existe um asset com este nome", asset: existing },
      { status: 409 },
    );
  }

  const asset = await prisma.promotionAsset.create({
    data: {
      name: sanitizeString(body.name, 200),
      storageKey: sanitizeString(body.storageKey, 500),
      publicUrl: sanitizeString(body.publicUrl, 2000) || null,
      mimeType: sanitizeString(body.mimeType, 100) || "image/png",
      width: typeof body.width === "number" ? body.width : null,
      height: typeof body.height === "number" ? body.height : null,
      fileSize: typeof body.fileSize === "number" ? body.fileSize : null,
      altText: sanitizeString(body.altText, 300) || null,
      source: sanitizeString(body.source, 50) || null,
      baseAssetName: sanitizeString(body.baseAssetName, 200) || null,
      tags: sanitizeString(body.tags, 500) || null,
      hash: sanitizeString(body.hash, 100) || null,
    },
  });

  return NextResponse.json({ asset }, { status: 201 });
}
