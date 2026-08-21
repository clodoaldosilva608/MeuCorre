import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { cachedFetch, invalidateCache } from "@/lib/redis-cache";

// GET /api/blog — lista posts publicados
// GET /api/blog?slug=xxx — busca post por slug
//
// SEGURANÇA/PERFORMANCE (P1-1, P1-3):
// - Rate limit 60/IP/15min (público)
// - Cache Redis 10 min para lista (findMany sem take é caro em escala)
// - Cache por slug (post individual)
// - Admin invalida cache ao criar/editar/excluir post via invalidateBlogCache

const LIST_CACHE_TTL = 10 * 60 * 1000; // 10 min
const POST_CACHE_TTL = 30 * 60 * 1000; // 30 min (posts individuais mudam menos)

// Invalida cache quando admin cria/edita/exclui post
export function invalidateBlogCache(): void {
  void invalidateCache("blog:list");
  // Não dá pra invalidar todos os slugs individualmente sem saber quais são.
  // Admin raramente edita posts — lista de slugs em cache será atualizada
  // no próximo TTL (10min).
}

export async function GET(req: NextRequest) {
  // Rate limit por IP (público)
  const limited = await applyRateLimit(req, {
    windowMs: 15 * 60 * 1000,
    maxRequests: 60,
  });
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (slug) {
    const post = await cachedFetch(`blog:post:${slug}`, async () => {
      return await prisma.blogPost.findUnique({
        where: { slug },
      });
    }, POST_CACHE_TTL);

    if (!post || !post.published) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ post });
  }

  const posts = await cachedFetch("blog:list", async () => {
    return await prisma.blogPost.findMany({
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
  }, LIST_CACHE_TTL);

  return NextResponse.json({ posts });
}
