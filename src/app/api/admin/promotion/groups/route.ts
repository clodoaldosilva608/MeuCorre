import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { z } from "zod";

// GET /api/admin/promotion/groups — lista grupos com filtros
// Query params: platform, category, city, active, search, limit, offset
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const city = searchParams.get("city") ?? undefined;
  const active = searchParams.get("active");
  const search = searchParams.get("search") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 200), 500);
  const offset = Number(searchParams.get("offset") ?? 0);

  const where: Record<string, unknown> = {};
  if (platform) where.platform = platform;
  if (category) where.category = category;
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (active !== null && active !== undefined && active !== "") {
    where.active = active === "true";
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
      { inviteUrl: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [groups, total] = await Promise.all([
      prisma.socialGroup.findMany({
        where,
        orderBy: [{ platform: "asc" }, { createdAt: "desc" }],
        take: limit,
        skip: offset,
      }),
      prisma.socialGroup.count({ where }),
    ]);

    return NextResponse.json({ groups, total, limit, offset });
  } catch (e: unknown) {
    const err = e as Error;
    // Se a tabela não existe ainda, retorna erro amigável
    if (err.message.includes("does not exist") || err.message.includes("relation")) {
      return NextResponse.json(
        {
          error:
            "Tabela SocialGroup não existe no banco. Rode a migração: POST /api/admin/promotion/migrate",
          needsMigration: true,
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/promotion/groups — cria novo grupo
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as {
    name?: string;
    platform?: string;
    inviteUrl?: string;
    memberCount?: number;
    category?: string;
    city?: string;
    notes?: string;
    active?: boolean;
  };

  if (!body.name?.trim() || !body.platform?.trim() || !body.inviteUrl?.trim()) {
    return NextResponse.json(
      { error: "name, platform e inviteUrl são obrigatórios" },
      { status: 400 },
    );
  }

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
      { error: `Plataforma inválida. Válidas: ${validPlatforms.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const group = await prisma.socialGroup.create({
      data: {
        name: sanitizeString(body.name, 100),
        platform: body.platform,
        inviteUrl: sanitizeString(body.inviteUrl, 500),
        memberCount: body.memberCount ?? null,
        category: body.category ? sanitizeString(body.category, 50) : null,
        city: body.city ? sanitizeString(body.city, 100) : null,
        notes: body.notes ? sanitizeString(body.notes, 500) : null,
        active: body.active ?? true,
      },
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (e: unknown) {
    const err = e as Error;
    if (err.message.includes("does not exist") || err.message.includes("relation")) {
      return NextResponse.json(
        {
          error:
            "Tabela SocialGroup não existe. Rode: POST /api/admin/promotion/migrate",
          needsMigration: true,
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
