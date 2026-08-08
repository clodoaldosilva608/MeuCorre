import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { invalidateAdsCache } from "@/app/api/ads/route";
import {
  validateImageUrl,
  validateExternalUrl,
  sanitizeString,
} from "@/lib/validation";

// GET /api/admin/ads — lista TODOS os anúncios (inclusive inativos)
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const ads = await prisma.ad.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ ads });
}

// POST /api/admin/ads — cria novo anúncio
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as {
    title: string;
    description?: string;
    cta?: string;
    url?: string;
    imageUrl?: string;
    bgColor?: string;
    textColor?: string;
    placement: string;
    active?: boolean;
    startsAt?: string;
    endsAt?: string;
  };

  if (!body.title?.trim() || !body.placement) {
    return NextResponse.json(
      { error: "Título e placement são obrigatórios" },
      { status: 400 },
    );
  }

  // Valida placement
  const validPlacements = ["banner_top", "card_list", "splash"];
  if (!validPlacements.includes(body.placement)) {
    return NextResponse.json(
      { error: "Placement inválido" },
      { status: 400 },
    );
  }

  // Valida cores (hex)
  const hexRegex = /^#[0-9a-fA-F]{6}$/;
  const bgColor = hexRegex.test(body.bgColor ?? "") ? body.bgColor : "#10b981";
  const textColor = hexRegex.test(body.textColor ?? "")
    ? body.textColor
    : "#09090b";

  const ad = await prisma.ad.create({
    data: {
      title: sanitizeString(body.title, 80),
      description: sanitizeString(body.description, 150) || null,
      cta: sanitizeString(body.cta, 20) || "Saiba mais",
      url: validateExternalUrl(body.url),
      imageUrl: validateImageUrl(body.imageUrl),
      bgColor,
      textColor,
      placement: body.placement,
      active: body.active ?? true,
      startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
    },
  });

  // Invalida cache de anúncios
  invalidateAdsCache();

  return NextResponse.json({ ad }, { status: 201 });
}
