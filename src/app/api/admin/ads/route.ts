import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

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

  const ad = await prisma.ad.create({
    data: {
      title: body.title.trim(),
      description: body.description?.trim() || null,
      cta: body.cta?.trim() || "Saiba mais",
      url: body.url?.trim() || null,
      imageUrl: body.imageUrl?.trim() || null,
      bgColor: body.bgColor || "#10b981",
      textColor: body.textColor || "#09090b",
      placement: body.placement,
      active: body.active ?? true,
      startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
    },
  });

  return NextResponse.json({ ad }, { status: 201 });
}
