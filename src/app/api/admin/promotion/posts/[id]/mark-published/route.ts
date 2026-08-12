import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// POST /api/admin/promotion/posts/:id/mark-published
// Marca postagem como publicada e registra publishedAt
// Body opcional: { "publishedAt": "2026-08-12T15:30:00Z" }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    publishedAt?: string;
  };

  try {
    const post = await prisma.promotionPost.update({
      where: { id },
      data: {
        status: "published",
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
      },
    });
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "Postagem não encontrada" }, { status: 404 });
  }
}
