import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";

// GET /api/admin/promotion/posts — lista postagens com filtros
// Query params: campaignId, platform, status, pillar, editorialDay, search, limit, offset
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaignId") ?? undefined;
  const platform = searchParams.get("platform") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const pillar = searchParams.get("pillar") ?? undefined;
  const editorialDay = searchParams.get("editorialDay")
    ? Number(searchParams.get("editorialDay"))
    : undefined;
  const search = searchParams.get("search") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);
  const offset = Number(searchParams.get("offset") ?? 0);

  const where: Record<string, unknown> = {};
  if (campaignId) where.campaignId = campaignId;
  if (platform) where.platform = platform;
  if (status) where.status = status;
  if (pillar) where.pillar = pillar;
  if (editorialDay) where.editorialDay = editorialDay;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { hashtags: { contains: search, mode: "insensitive" } },
    ];
  }

  const [posts, total] = await Promise.all([
    prisma.promotionPost.findMany({
      where,
      include: {
        asset: true,
        postAssets: {
          include: { asset: true },
          orderBy: { sortOrder: "asc" },
        },
        campaign: { select: { id: true, name: true, color: true } },
        _count: { select: { reminders: true, postAssets: true } },
      },
      orderBy: [{ editorialDay: "asc" }, { sequenceNumber: "asc" }],
      take: limit,
      skip: offset,
    }),
    prisma.promotionPost.count({ where }),
  ]);

  return NextResponse.json({ posts, total, limit, offset });
}

// POST /api/admin/promotion/posts — cria postagem individual
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as {
    campaignId?: string;
    editorialDay?: number;
    sequenceNumber?: number;
    publishAt?: string;
    timezone?: string;
    platform?: string;
    platforms?: string; // CSV multi-rede
    format?: string;
    pillar?: string;
    title?: string;
    description?: string;
    hashtags?: string;
    engagementText?: string;
    cta?: string;
    destinationUrl?: string;
    altText?: string;
    videoScript?: string;
    durationSeconds?: number;
    status?: string;
    notes?: string;
    utmQuery?: string;
    assetId?: string;
  };

  if (
    !body.campaignId ||
    !body.title?.trim() ||
    !body.description?.trim() ||
    !body.platform
  ) {
    return NextResponse.json(
      { error: "campaignId, title, description e platform são obrigatórios" },
      { status: 400 },
    );
  }

  const validPlatforms = ["Instagram", "TikTok", "Facebook", "YouTube", "WhatsApp", "Telegram"];
  if (!validPlatforms.includes(body.platform)) {
    return NextResponse.json(
      { error: "Plataforma inválida (use Instagram, TikTok, Facebook, YouTube, WhatsApp ou Telegram)" },
      { status: 400 },
    );
  }

  // Valida platforms (multi-rede CSV) se fornecido
  if (body.platforms) {
    const platformsList = body.platforms.split(",").map((p) => p.trim()).filter(Boolean);
    const invalid = platformsList.filter((p) => !validPlatforms.includes(p));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Plataformas inválidas em 'platforms': ${invalid.join(", ")}` },
        { status: 400 },
      );
    }
  }

  const editorialDay = body.editorialDay ?? 1;
  const sequenceNumber = body.sequenceNumber ?? 1;
  if (editorialDay < 1 || editorialDay > 90) {
    return NextResponse.json(
      { error: "editorialDay deve estar entre 1 e 90" },
      { status: 400 },
    );
  }
  if (sequenceNumber < 1 || sequenceNumber > 5) {
    return NextResponse.json(
      { error: "sequenceNumber deve estar entre 1 e 5" },
      { status: 400 },
    );
  }

  const validStatuses = ["pending", "published", "skipped", "failed"];
  const status = validStatuses.includes(body.status ?? "")
    ? body.status!
    : "pending";

  try {
    const post = await prisma.promotionPost.create({
      data: {
        campaignId: body.campaignId,
        editorialDay,
        sequenceNumber,
        publishAt: body.publishAt ? new Date(body.publishAt) : new Date(),
        timezone: body.timezone || "America/Sao_Paulo",
        platform: body.platform,
        platforms: body.platforms || null,
        format: sanitizeString(body.format, 100) || null,
        pillar: sanitizeString(body.pillar, 100) || null,
        title: sanitizeString(body.title, 200),
        description: body.description,
        hashtags: sanitizeString(body.hashtags, 500) || null,
        engagementText: sanitizeString(body.engagementText, 500) || null,
        cta: sanitizeString(body.cta, 200) || null,
        destinationUrl: sanitizeString(body.destinationUrl, 500) || null,
        altText: sanitizeString(body.altText, 300) || null,
        videoScript: body.videoScript || null,
        durationSeconds: body.durationSeconds ?? null,
        status,
        notes: sanitizeString(body.notes, 500) || null,
        utmQuery: sanitizeString(body.utmQuery, 500) || null,
        assetId: body.assetId || null,
      },
      include: {
        asset: true,
        postAssets: { include: { asset: true }, orderBy: { sortOrder: "asc" } },
        campaign: { select: { id: true, name: true, color: true } },
      },
    });
    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        {
          error:
            "Já existe uma postagem com esta combinação (campanha + dia + sequência + plataforma)",
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Erro ao criar postagem" }, { status: 500 });
  }
}
