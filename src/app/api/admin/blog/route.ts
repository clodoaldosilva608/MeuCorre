import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { z } from "zod";

// GET /api/admin/blog — lista todos os posts
// POST /api/admin/blog — cria novo post

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as {
    title: string;
    description: string;
    content: string;
    coverUrl?: string;
    category?: string;
    labels?: string;
    published?: boolean;
  };

  const title = sanitizeString(body.title, 200);
  if (!title || title.length < 5) {
    return NextResponse.json({ error: "Título inválido (mínimo 5 caracteres)" }, { status: 400 });
  }

  const description = sanitizeString(body.description, 300);
  if (!description || description.length < 10) {
    return NextResponse.json({ error: "Descrição inválida (mínimo 10 caracteres)" }, { status: 400 });
  }

  if (!body.content || body.content.length < 100) {
    return NextResponse.json({ error: "Conteúdo inválido (mínimo 100 caracteres)" }, { status: 400 });
  }

  // Gera slug do título
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 100);

  // Verifica se slug já existe
  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const post = await prisma.blogPost.create({
    data: {
      slug: finalSlug,
      title,
      description,
      content: body.content,
      coverUrl: body.coverUrl || null,
      category: body.category || "dicas",
      labels: body.labels || null,
      published: body.published ?? true,
    },
  });

  return NextResponse.json({ ok: true, post });
}
