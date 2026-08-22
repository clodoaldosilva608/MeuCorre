import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";

// PUT /api/admin/post-descriptions/[id] — atualiza uma postagem
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.platform !== undefined) data.platform = body.platform;
  if (body.category !== undefined) data.category = body.category;
  if (body.title !== undefined) data.title = body.title;
  if (body.content !== undefined) data.content = body.content;
  if (body.hashtags !== undefined) data.hashtags = body.hashtags || null;
  if (body.status !== undefined) data.status = body.status;
  if (body.notes !== undefined) data.notes = body.notes || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  try {
    const post = await prisma.postDescription.update({
      where: { id },
      data,
    });
    return NextResponse.json({ ok: true, post });
  } catch (err) {
    logger.error("[admin/post-descriptions] PUT falhou", {
      id,
      error: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// DELETE /api/admin/post-descriptions/[id] — exclui uma postagem
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.postDescription.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("[admin/post-descriptions] DELETE falhou", {
      id,
      error: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}
