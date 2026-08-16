import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { z } from "zod";

// GET /api/admin/promotion/channels
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const channels = await prisma.socialChannel.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ channels });
}

// POST /api/admin/promotion/channels
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as {
    name?: string;
    platform?: string;
    profileUrl?: string;
    bannerUrl?: string;
    promoTitle?: string;
    promoText?: string;
    active?: boolean;
    sortOrder?: number;
  };

  if (!body.name?.trim() || !body.platform?.trim() || !body.profileUrl?.trim()) {
    return NextResponse.json(
      { error: "name, platform e profileUrl são obrigatórios" },
      { status: 400 },
    );
  }

  const validPlatforms = [
    "instagram",
    "tiktok",
    "youtube",
    "facebook",
    "whatsapp",
    "telegram",
    "app",
    "quiz",
  ];
  if (!validPlatforms.includes(body.platform)) {
    return NextResponse.json(
      { error: `Plataforma inválida. Válidas: ${validPlatforms.join(", ")}` },
      { status: 400 },
    );
  }

  const channel = await prisma.socialChannel.create({
    data: {
      name: sanitizeString(body.name, 50),
      platform: body.platform,
      profileUrl: sanitizeString(body.profileUrl, 500) || "",
      bannerUrl: sanitizeString(body.bannerUrl, 500) || null,
      promoTitle: sanitizeString(body.promoTitle, 100) || null,
      promoText: sanitizeString(body.promoText, 300) || null,
      active: body.active ?? true,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return NextResponse.json({ channel }, { status: 201 });
}
