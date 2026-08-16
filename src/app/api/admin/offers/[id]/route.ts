import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import {  validateImageUrl,
  validateExternalUrl,
  sanitizeString,
} from "@/lib/validation";
import { z } from "zod";

// ===== Admin CRUD para Offer individual =====
//
// PATCH /api/admin/offers/[id] — atualiza oferta
// DELETE /api/admin/offers/[id] — remove oferta (soft delete via active=false)

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as Partial<{
    title: string;
    description: string;
    price: number;
    originalPrice?: number | null;
    imageUrl: string;
    videoUrl?: string | null;
    productUrl: string;
    category: string;
    proOnly: boolean;
    active: boolean;
    startsAt: string;
    endsAt: string | null;
  }>;

  // Verifica se a oferta existe
  const existing = await prisma.offer.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Oferta não encontrada" },
      { status: 404 },
    );
  }

  // Constrói o objeto de update apenas com campos fornecidos
  const update: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = sanitizeString(body.title, 120);
    if (!title || title.length < 3) {
      return NextResponse.json(
        { error: "Título inválido (mínimo 3 caracteres)" },
        { status: 400 },
      );
    }
    update.title = title;
  }

  if (body.description !== undefined) {
    const description = sanitizeString(body.description, 1000);
    if (!description || description.length < 5) {
      return NextResponse.json(
        { error: "Descrição inválida (mínimo 5 caracteres)" },
        { status: 400 },
      );
    }
    update.description = description;
  }

  if (body.price !== undefined) {
    if (typeof body.price !== "number" || isNaN(body.price) || body.price <= 0 || body.price > 99999) {
      return NextResponse.json(
        { error: "Preço inválido — digite apenas números (ex: 19.90)" },
        { status: 400 },
      );
    }
    update.price = body.price;
  }

  if (body.originalPrice !== undefined) {
    if (
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
    update.originalPrice = body.originalPrice ?? null;
  }

  if (body.imageUrl !== undefined) {
    if (!validateImageUrl(body.imageUrl)) {
      return NextResponse.json(
        { error: "URL da imagem inválida (use HTTPS e extensão .jpg/.png/.webp/.gif/.svg)" },
        { status: 400 },
      );
    }
    update.imageUrl = body.imageUrl;
  }

  if (body.videoUrl !== undefined) {
    if (body.videoUrl && body.videoUrl.trim()) {
      const validatedVideo = validateExternalUrl(body.videoUrl);
      if (!validatedVideo) {
        return NextResponse.json(
          { error: "URL do vídeo inválida (use HTTPS — YouTube, Vimeo, etc)" },
          { status: 400 },
        );
      }
      update.videoUrl = validatedVideo;
    } else {
      update.videoUrl = null;
    }
  }

  if (body.productUrl !== undefined) {
    if (!validateExternalUrl(body.productUrl)) {
      return NextResponse.json(
        { error: "URL do produto inválida (use HTTPS)" },
        { status: 400 },
      );
    }
    update.productUrl = body.productUrl;
  }

  if (body.category !== undefined) {
    const validCategories = [
      "equipamentos",
      "combustivel",
      "seguro",
      "ferramentas",
      "vestuario",
      "outros",
    ];
    if (!validCategories.includes(body.category)) {
      return NextResponse.json(
        { error: "Categoria inválida" },
        { status: 400 },
      );
    }
    update.category = body.category;
  }

  if (body.proOnly !== undefined) update.proOnly = Boolean(body.proOnly);
  if (body.active !== undefined) update.active = Boolean(body.active);
  if (body.startsAt !== undefined) update.startsAt = new Date(body.startsAt);
  if (body.endsAt !== undefined)
    update.endsAt = body.endsAt ? new Date(body.endsAt) : null;

  const updated = await prisma.offer.update({
    where: { id },
    data: update,
  });

  return NextResponse.json({
    ok: true,
    offer: {
      ...updated,
      price: Number(updated.price),
      originalPrice: updated.originalPrice
        ? Number(updated.originalPrice)
        : null,
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  // Hard delete — admin quis remover, então remove do banco
  // (soft delete via active=false é feito via PATCH se preferir manter histórico)
  try {
    await prisma.offer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Oferta não encontrada" },
      { status: 404 },
    );
  }
}
