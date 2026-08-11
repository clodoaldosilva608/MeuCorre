import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// PATCH /api/admin/blog/[id] — atualiza post
// DELETE /api/admin/blog/[id] — remove post

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
    content: string;
    coverUrl: string;
    category: string;
    labels: string;
    published: boolean;
    bloggerPostId: string;
    bloggerUrl: string;
  }>;

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  }

  const update: Record<string, unknown> = {};
  if (body.title !== undefined) update.title = body.title;
  if (body.description !== undefined) update.description = body.description;
  if (body.content !== undefined) update.content = body.content;
  if (body.coverUrl !== undefined) update.coverUrl = body.coverUrl;
  if (body.category !== undefined) update.category = body.category;
  if (body.labels !== undefined) update.labels = body.labels;
  if (body.published !== undefined) update.published = body.published;
  if (body.bloggerPostId !== undefined) update.bloggerPostId = body.bloggerPostId;
  if (body.bloggerUrl !== undefined) update.bloggerUrl = body.bloggerUrl;

  const updated = await prisma.blogPost.update({ where: { id }, data: update });
  return NextResponse.json({ ok: true, post: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.blogPost.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  }
}
