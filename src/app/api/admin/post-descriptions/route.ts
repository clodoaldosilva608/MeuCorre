import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";

// ===== API de Post Descriptions =====
//
// GET  /api/admin/post-descriptions          — lista (com filtros)
// GET  /api/admin/post-descriptions?platform=instagram&category=dica&status=ready
// POST /api/admin/post-descriptions          — cria uma
// POST /api/admin/post-descriptions?bulk=true — cria várias de uma vez (upload em lote)

interface CreateBody {
  platform?: string;
  category?: string;
  title?: string;
  content: string;
  hashtags?: string;
  status?: string;
  notes?: string;
}

interface BulkCreateBody {
  posts: CreateBody[];
}

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const limitParam = parseInt(searchParams.get("limit") ?? "200", 10);
  const limit = Math.min(Math.max(limitParam || 200, 10), 500);

  const where: Record<string, unknown> = {};
  if (platform && platform !== "all") where.platform = platform;
  if (category && category !== "all") where.category = category;
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { content: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
      { hashtags: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const posts = await prisma.postDescription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Conta totais por plataforma para badges
    const counts = await prisma.postDescription.groupBy({
      by: ["platform"],
      _count: true,
    });
    const platformCounts: Record<string, number> = {};
    for (const c of counts) {
      platformCounts[c.platform] = c._count;
    }

    return NextResponse.json({
      posts,
      platformCounts,
      total: posts.length,
    });
  } catch (err) {
    logger.error("[admin/post-descriptions] GET falhou", {
      error: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json(
      { error: "Erro ao buscar postagens" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isBulk = searchParams.get("bulk") === "true";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // ===== Bulk create (upload em lote) =====
  if (isBulk) {
    const { posts } = body as BulkCreateBody;
    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json(
        { error: "Array 'posts' é obrigatório para bulk create" },
        { status: 400 },
      );
    }

    // Limite de 500 posts por lote (previne timeout)
    const batch = posts.slice(0, 500);

    try {
      const result = await prisma.postDescription.createMany({
        data: batch.map((p) => ({
          platform: p.platform ?? "all",
          category: p.category ?? "geral",
          title: p.title ?? "",
          content: p.content,
          hashtags: p.hashtags ?? null,
          status: p.status ?? "ready",
          notes: p.notes ?? null,
        })),
      });

      logger.info("[admin/post-descriptions] Bulk create", {
        count: result.count,
      });

      return NextResponse.json({
        ok: true,
        created: result.count,
        skipped: posts.length - batch.length,
      });
    } catch (err) {
      logger.error("[admin/post-descriptions] Bulk create falhou", {
        error: err instanceof Error ? err.message : "unknown",
      });
      return NextResponse.json(
        { error: "Erro ao criar postagens em lote" },
        { status: 500 },
      );
    }
  }

  // ===== Create single =====
  const data = body as CreateBody;

  if (!data.content || data.content.trim().length === 0) {
    return NextResponse.json(
      { error: "Conteúdo é obrigatório" },
      { status: 400 },
    );
  }

  try {
    const post = await prisma.postDescription.create({
      data: {
        platform: data.platform ?? "all",
        category: data.category ?? "geral",
        title: data.title ?? "",
        content: data.content.trim(),
        hashtags: data.hashtags?.trim() || null,
        status: data.status ?? "ready",
        notes: data.notes?.trim() || null,
      },
    });

    return NextResponse.json({ ok: true, post }, { status: 201 });
  } catch (err) {
    logger.error("[admin/post-descriptions] POST falhou", {
      error: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json(
      { error: "Erro ao criar postagem" },
      { status: 500 },
    );
  }
}
