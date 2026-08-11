import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog MeuCorre — Dicas para Entregadores de App",
  description: "Artigos sobre finanças, manutenção de moto, economia de combustível, gestão de tempo e dicas para entregadores de iFood, 99Food, Lalamove e Rappi.",
};

const POSTS = [
  { slug: "calcular-lucro-real-entregador", num: 1, title: "Como Calcular o Lucro Real Como Entregador de App", desc: "Aprenda a diferença entre faturamento e lucro líquido, e descubra quanto você realmente ganha como entregador de aplicativo.", category: "Finanças", readTime: "8 min" },
  { slug: "planejamento-financeiro-motoboys", num: 2, title: "Planejamento Financeiro para Motoboys: Guia Completo 2026", desc: "Aprenda a fazer orçamento, criar metas e reserva de emergência como entregador autônomo. Planeje seu futuro financeiro.", category: "Finanças", readTime: "10 min" },
  { slug: "manutencao-moto-entregadores", num: 3, title: "Manutenção da Moto para Entregadores: Checklist Completo", desc: "Guia definitivo de manutenção preventiva e corretiva para motos de entregadores. Aprenda trocas, prazos e custos.", category: "Moto", readTime: "12 min" },
  { slug: "economizar-combustivel-entregador", num: 4, title: "Como Economizar Combustível Sendo Entregador", desc: "Técnicas comprovadas para reduzir o gasto de gasolina e aumentar seu lucro líquido como entregador.", category: "Economia", readTime: "6 min" },
  { slug: "melhores-horarios-zonas-entregar", num: 5, title: "Melhores Horários e Zonas para Entregar em Cada App", desc: "Descubra os melhores horários e regiões para maximizar seus ganhos no iFood, 99Food, Lalamove e Rappi.", category: "Estratégia", readTime: "8 min" },
  { slug: "equipamentos-essenciais-entregadores", num: 6, title: "Equipamentos Essenciais para Entregadores de App", desc: "Lista completa de equipamentos que todo entregador precisa ter para trabalhar com segurança e eficiência.", category: "Equipamentos", readTime: "7 min" },
  { slug: "gestao-tempo-entregadores", num: 7, title: "Gestão de Tempo para Entregadores: Como Rodar Mais em Menos Tempo", desc: "Aprenda a otimizar rotas, gerenciar pausas e trabalhar nos horários de pico para maximizar seus ganhos.", category: "Produtividade", readTime: "9 min" },
  { slug: "declaracao-imposto-renda-entregadores-2026", num: 8, title: "Declaração de Imposto de Renda para Entregadores 2026", desc: "Guia completo sobre IRPF, MEI e deduções para entregadores de aplicativo. Não pague imposto à toa.", category: "Impostos", readTime: "10 min" },
  { slug: "qual-app-entrega-da-mais-dinheiro-2026", num: 9, title: "Qual App de Entrega Dá Mais Dinheiro? Comparativo 2026", desc: "Comparativo completo entre iFood, 99Food, Lalamove e Rappi. Descubra qual paga mais por km.", category: "Comparativo", readTime: "8 min" },
  { slug: "entregador-5-estrelas-todos-apps", num: 10, title: "Como Se Tornar um Entregador 5 Estrelas em Todos os Apps", desc: "Dicas práticas para conseguir avaliações máximas, fidelizar clientes e ganhar prioridade nos apps de entrega.", category: "Dicas", readTime: "9 min" },
];

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-zinc-900">
      <div className="text-center">
        <h1 className="text-3xl font-black text-zinc-900">Blog MeuCorre</h1>
        <p className="mt-3 text-base text-zinc-600">
          Dicas, guias e estratégias para entregadores de aplicativo que querem
          ganhar mais e trabalhar melhor.
        </p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {POSTS.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative aspect-video overflow-hidden bg-zinc-100">
              <img
                src={`/blog-covers/capa-${post.num}.png`}
                alt={post.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute left-2 top-2 rounded-full bg-neon px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-950">
                {post.category}
              </div>
            </div>
            <div className="p-4">
              <h2 className="line-clamp-2 text-sm font-bold text-zinc-900">
                {post.title}
              </h2>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                {post.desc}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400">
                  ⏱ {post.readTime} de leitura
                </span>
                <span className="text-[10px] font-bold text-neon">
                  Ler artigo →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-sm font-semibold text-emerald-700">
          Baixe o MeuCorre grátis
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          Controle suas corridas, despesas e lucro real. 100% offline.
        </p>
        <a
          href="/app"
          className="mt-3 inline-block rounded-lg bg-emerald-500 px-6 py-2 text-sm font-bold text-zinc-950 hover:bg-emerald-400"
        >
          Começar grátis
        </a>
      </div>

      <div className="mt-8 text-center">
        <a href="/" className="text-sm font-bold text-emerald-600 hover:underline">
          ← Voltar para a página inicial
        </a>
      </div>
    </div>
  );
}
