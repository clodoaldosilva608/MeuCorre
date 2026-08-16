import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/blog — lista posts publicados
// GET /api/blog?slug=xxx — busca post por slug

// PUBLIC ROUTE — Esta rota é intencionalmente pública (não requer admin auth)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (slug) {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
    });
    if (!post || !post.published) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ post });
  }

  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      coverUrl: true,
      category: true,
      labels: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ posts });
}
