import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import {  validateImageUrl,
  validateExternalUrl,
  sanitizeString,
} from "@/lib/validation";
import { z } from "zod";

// ===== Admin CRUD para Offers (Loja) =====
//
// GET /api/admin/offers — lista TODAS as ofertas (inclusive inativas e expiradas)
// POST /api/admin/offers — cria nova oferta

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const offers = await prisma.offer.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    offers: offers.map((o) => ({
      ...o,
      price: Number(o.price),
      originalPrice: o.originalPrice ? Number(o.originalPrice) : null,
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as {
    title: string;
    description: string;
    price: number;
    originalPrice?: number | null;
    imageUrl: string;
    videoUrl?: string | null;
    productUrl: string;
    category?: string;
    proOnly?: boolean;
    active?: boolean;
    startsAt?: string;
    endsAt?: string | null;
  };

  // Validações
  const title = sanitizeString(body.title, 120);
  if (!title || title.length < 3) {
    return NextResponse.json(
      { error: "Título inválido (mínimo 3 caracteres)" },
      { status: 400 },
    );
  }

  const description = sanitizeString(body.description, 1000);
  if (!description || description.length < 5) {
    return NextResponse.json(
      { error: "Descrição inválida (mínimo 5 caracteres)" },
      { status: 400 },
    );
  }

  // Validação de preço — rejeita NaN, negativo, e não-número
  if (
    typeof body.price !== "number" ||
    isNaN(body.price) ||
    body.price <= 0 ||
    body.price > 99999
  ) {
    return NextResponse.json(
      { error: "Preço inválido — digite apenas números (ex: 19.90)" },
      { status: 400 },
    );
  }

  if (
    body.originalPrice !== undefined &&
    body.originalPrice !== null &&
    (typeof body.originalPrice !== "number" ||
      isNaN(body.originalPrice) ||
      body.originalPrice <= 0 ||
      body.originalPrice > 99999)
  ) {
    return NextResponse.json(
      { error: "Preço original inválido — digite apenas números" },
      { status: 400 },
    );
  }

  if (!body.imageUrl || !validateImageUrl(body.imageUrl)) {
    return NextResponse.json(
      { error: "URL da imagem inválida (use HTTPS e extensão .jpg/.png/.webp/.gif/.svg)" },
      { status: 400 },
    );
  }

  if (!body.productUrl || !validateExternalUrl(body.productUrl)) {
    return NextResponse.json(
      { error: "URL do produto inválida (use HTTPS)" },
      { status: 400 },
    );
  }

  // VideoUrl é opcional — se fornecida, valida como URL externa
  let videoUrl: string | null = null;
  if (body.videoUrl && body.videoUrl.trim()) {
    const validatedVideo = validateExternalUrl(body.videoUrl);
    if (!validatedVideo) {
      return NextResponse.json(
        { error: "URL do vídeo inválida (use HTTPS — YouTube, Vimeo, etc)" },
        { status: 400 },
      );
    }
    videoUrl = validatedVideo;
  }

  const validCategories = [
    "equipamentos",
    "combustivel",
    "seguro",
    "ferramentas",
    "vestuario",
    "outros",
  ];
  const category = validCategories.includes(body.category ?? "")
    ? body.category!
    : "equipamentos";

  const offer = await prisma.offer.create({
    data: {
      title,
      description,
      price: body.price,
      originalPrice: body.originalPrice ?? null,
      imageUrl: body.imageUrl,
      videoUrl,
      productUrl: body.productUrl,
      category,
      proOnly: body.proOnly ?? false,
      active: body.active ?? true,
      startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
    },
  });

  return NextResponse.json({
    ok: true,
    offer: {
      ...offer,
      price: Number(offer.price),
      originalPrice: offer.originalPrice ? Number(offer.originalPrice) : null,
    },
  });
}
