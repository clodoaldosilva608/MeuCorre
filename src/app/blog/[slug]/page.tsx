import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import BlogPostContent from "./blog-post-content";

// ===== Página dinâmica de post do blog =====
//
// Server component — busca o post no banco (via API interna) e renderiza
// com react-markdown. Gera metadata (title, description, OG) dinamicamente.

const BASE_URL = "https://meucorre.vercel.app";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  coverUrl: string | null;
  category: string;
  labels: string | null;
  published: boolean;
  createdAt: string;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/blog?slug=${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.post ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    return { title: "Post não encontrado — MeuCorre" };
  }
  return {
    title: `${post.title} — Blog MeuCorre`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      images: post.coverUrl ? [{ url: post.coverUrl }] : undefined,
      url: `${BASE_URL}/blog/${post.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.coverUrl ? [post.coverUrl] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const labels = post.labels
    ?.split(",")
    .map((l) => l.trim())
    .filter(Boolean) ?? [];

  const shareUrl = `${BASE_URL}/blog/${post.slug}`;
  const shareText = `${post.title} — Blog MeuCorre`;

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 text-zinc-900 dark:text-zinc-100">
      <Link
        href="/blog"
        className="text-xs font-bold text-emerald-600 hover:underline dark:text-emerald-400"
      >
        ← Voltar para o blog
      </Link>

      {/* Cabeçalho */}
      <header className="mt-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {post.category}
          </span>
          <span className="text-[11px] text-zinc-500">
            {new Date(post.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <h1 className="text-3xl font-black leading-tight tracking-tight md:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
          {post.description}
        </p>
      </header>

      {/* Capa */}
      {post.coverUrl && (
        <div className="mt-6 overflow-hidden rounded-2xl">
          <img
            src={post.coverUrl}
            alt={post.title}
            className="aspect-video w-full object-cover"
          />
        </div>
      )}

      {/* Conteúdo (markdown) */}
      <div className="mt-8">
        <BlogPostContent content={post.content} />
      </div>

      {/* Tags */}
      {labels.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          {labels.map((label) => (
            <span
              key={label}
              className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            >
              #{label}
            </span>
          ))}
        </div>
      )}

      {/* Compartilhar */}
      <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-500/20 dark:bg-emerald-500/5">
        <p className="text-center text-sm font-bold text-emerald-700 dark:text-emerald-400">
          Gostou do artigo? Compartilha com a galera! 🏍️
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-[#25D366] px-3 py-2.5 text-center text-xs font-bold text-white transition hover:opacity-90"
          >
            WhatsApp
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-[#1877F2] px-3 py-2.5 text-center text-xs font-bold text-white transition hover:opacity-90"
          >
            Facebook
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-black px-3 py-2.5 text-center text-xs font-bold text-white transition hover:opacity-90"
          >
            Twitter / X
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-[#0088CC] px-3 py-2.5 text-center text-xs font-bold text-white transition hover:opacity-90"
          >
            Telegram
          </a>
        </div>
      </section>

      {/* CTA final */}
      <section className="mt-8 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-center text-white">
        <h2 className="text-lg font-black">Baixe o MeuCorre grátis</h2>
        <p className="mt-1 text-sm text-white/90">
          Controle suas corridas, despesas e lucro real. 100% offline.
        </p>
        <Link
          href="/app"
          className="mt-4 inline-block rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
        >
          Começar agora →
        </Link>
      </section>
    </article>
  );
}
