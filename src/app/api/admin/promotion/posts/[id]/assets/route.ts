import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { z } from "zod";

// ===== API para gerenciar mídias de um post (multi-mídia) =====
//
// POST /api/admin/promotion/posts/[id]/assets
//   Body: { assetId, sortOrder? }
//   Adiciona uma mídia ao post (carrossel)
//
// DELETE /api/admin/promotion/posts/[id]/assets?assetId=xxx
//   Remove uma mídia do post

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: postId } = await params;
  const body = (await req.json()) as { assetId?: string; sortOrder?: number };

  if (!body.assetId) {
    return NextResponse.json({ error: "assetId é obrigatório" }, { status: 400 });
  }

  // Verifica se o post existe
  const post = await prisma.promotionPost.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  }

  // Verifica se o asset existe
  const asset = await prisma.promotionAsset.findUnique({
    where: { id: body.assetId },
  });
  if (!asset) {
    return NextResponse.json({ error: "Asset não encontrado" }, { status: 404 });
  }

  // Se sortOrder não informado, usa o próximo disponível
  let sortOrder = body.sortOrder;
  if (sortOrder === undefined) {
    const last = await prisma.promotionPostAsset.findFirst({
      where: { postId },
      orderBy: { sortOrder: "desc" },
    });
    sortOrder = (last?.sortOrder ?? -1) + 1;
  }

  try {
    const postAsset = await prisma.promotionPostAsset.create({
      data: { postId, assetId: body.assetId, sortOrder },
      include: { asset: true },
    });

    // Se o post não tem assetId principal, define o primeiro como principal
    if (!post.assetId) {
      await prisma.promotionPost.update({
        where: { id: postId },
        data: { assetId: body.assetId },
      });
    }

    return NextResponse.json({ postAsset }, { status: 201 });
  } catch (e: unknown) {
    const err = e as Error;
    if (err.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Esta mídia já está vinculada a este post" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: postId } = await params;
  const { searchParams } = new URL(req.url);
  const assetId = searchParams.get("assetId");

  if (!assetId) {
    return NextResponse.json(
      { error: "assetId é obrigatório (query param)" },
      { status: 400 },
    );
  }

  try {
    await prisma.promotionPostAsset.delete({
      where: { postId_assetId: { postId, assetId } },
    });

    // Se o asset removido era o principal, define o próximo como principal
    const post = await prisma.promotionPost.findUnique({
      where: { id: postId },
      include: { postAssets: { orderBy: { sortOrder: "asc" }, take: 1 } },
    });
    if (post?.assetId === assetId) {
      const nextAsset = post.postAssets[0];
      await prisma.promotionPost.update({
        where: { id: postId },
        data: { assetId: nextAsset?.assetId ?? null },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Mídia não encontrada neste post" },
      { status: 404 },
    );
  }
}

// GET — lista mídias do post
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: postId } = await params;

  const postAssets = await prisma.promotionPostAsset.findMany({
    where: { postId },
    include: { asset: true },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ postAssets });
}
