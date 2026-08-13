import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog MeuCorre — Dicas para Entregadores de App",
  description:
    "Artigos sobre finanças, manutenção de moto, economia de combustível, gestão de tempo e dicas para entregadores de iFood, 99Food, Lalamove e Rappi.",
};

const BASE_URL = "https://meucorre.vercel.app";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverUrl: string | null;
  category: string;
  labels: string | null;
  createdAt: string;
}

async function getPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/blog`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.posts ?? [];
  } catch {
    return [];
  }
}

// Capa fallback cíclica (10 imagens existentes em /blog-covers/)
function fallbackCover(index: number): string {
  return `/blog-covers/capa-${(index % 10) + 1}.png`;
}

function categoryColor(category: string): string {
  const map: Record<string, string> = {
    Finanças: "bg-emerald-500 text-zinc-950",
    Moto: "bg-blue-500 text-white",
    Economia: "bg-amber-500 text-zinc-950",
    Estratégia: "bg-purple-500 text-white",
    Equipamentos: "bg-pink-500 text-white",
    Produtividade: "bg-cyan-500 text-zinc-950",
    Impostos: "bg-red-500 text-white",
    Comparativo: "bg-orange-500 text-zinc-950",
    Dicas: "bg-emerald-500 text-zinc-950",
    Seguro: "bg-indigo-500 text-white",
    Saúde: "bg-rose-500 text-white",
    Comunidade: "bg-teal-500 text-zinc-950",
  };
  return map[category] || "bg-zinc-500 text-white";
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 text-zinc-900">
      <div className="text-center">
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
          Blog MeuCorre
        </p>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 md:text-4xl">
          Dicas pra entregador de app
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-zinc-600">
          Artigos diários sobre finanças, moto, economia, estratégia e muito
          mais. Tudo pra te ajudar a rodar melhor e lucrar mais.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-zinc-200 bg-white p-10 text-center">
          <p className="text-sm text-zinc-500">
            Nenhum post publicado ainda. Volte em breve!
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => {
            const cover = post.coverUrl || fallbackCover(index);
            return (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-video overflow-hidden bg-zinc-100">
                  <img
                    src={cover}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <div
                    className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${categoryColor(
                      post.category,
                    )}`}
                  >
                    {post.category}
                  </div>
                </div>
                <div className="p-4">
                  <h2 className="line-clamp-2 text-sm font-bold text-zinc-900">
                    {post.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                    {post.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400">
                      {new Date(post.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">
                      Ler artigo →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 text-center text-white">
        <h2 className="text-xl font-black">Baixe o MeuCorre grátis</h2>
        <p className="mt-2 text-sm text-white/90">
          Controle suas corridas, despesas e lucro real. 100% offline.
        </p>
        <a
          href="/app"
          className="mt-4 inline-block rounded-xl bg-white px-6 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
        >
          Começar grátis →
        </a>
      </div>

      <div className="mt-8 text-center">
        <a
          href="/"
          className="text-sm font-bold text-emerald-600 hover:underline"
        >
          ← Voltar para a página inicial
        </a>
      </div>
    </div>
  );
}
