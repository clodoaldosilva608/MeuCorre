"use client";

import { motion } from "framer-motion";
import Link from "next/link";

// ===== Carrossel de Blog Posts na Landing Page =====
//
// Mostra os 10 posts do blog rolando da direita para a esquerda
// em um carrossel infinito. Cada card tem capa, título e descrição.

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  cover: string;
  category: string;
  readTime: string;
}

const POSTS: BlogPost[] = [
  {
    slug: "calcular-lucro-real-entregador",
    title: "Como Calcular o Lucro Real Como Entregador de App",
    description: "Aprenda a diferença entre faturamento e lucro líquido, e descubra quanto você realmente ganha.",
    cover: "/blog-covers/capa-1.png",
    category: "Finanças",
    readTime: "8 min",
  },
  {
    slug: "planejamento-financeiro-motoboys",
    title: "Planejamento Financeiro para Motoboys: Guia Completo 2026",
    description: "Aprenda a fazer orçamento, criar metas e reserva de emergência como entregador autônomo.",
    cover: "/blog-covers/capa-2.png",
    category: "Finanças",
    readTime: "10 min",
  },
  {
    slug: "manutencao-moto-entregadores",
    title: "Manutenção da Moto para Entregadores: Checklist Completo",
    description: "Guia definitivo de manutenção preventiva e corretiva para motos de entregadores.",
    cover: "/blog-covers/capa-3.png",
    category: "Moto",
    readTime: "12 min",
  },
  {
    slug: "economizar-combustivel-entregador",
    title: "Como Economizar Combustível Sendo Entregador",
    description: "Técnicas comprovadas para reduzir o gasto de gasolina e aumentar seu lucro líquido.",
    cover: "/blog-covers/capa-4.png",
    category: "Economia",
    readTime: "6 min",
  },
  {
    slug: "melhores-horarios-zonas-entregar",
    title: "Melhores Horários e Zonas para Entregar em Cada App",
    description: "Descubra os melhores horários e regiões para maximizar seus ganhos no iFood, 99Food, Lalamove e Rappi.",
    cover: "/blog-covers/capa-5.png",
    category: "Estratégia",
    readTime: "8 min",
  },
  {
    slug: "equipamentos-essenciais-entregadores",
    title: "Equipamentos Essenciais para Entregadores de App",
    description: "Lista completa de equipamentos que todo entregador precisa ter para trabalhar com segurança.",
    cover: "/blog-covers/capa-6.png",
    category: "Equipamentos",
    readTime: "7 min",
  },
  {
    slug: "gestao-tempo-entregadores",
    title: "Gestão de Tempo para Entregadores: Como Rodar Mais em Menos Tempo",
    description: "Aprenda a otimizar rotas, gerenciar pausas e trabalhar nos horários de pico.",
    cover: "/blog-covers/capa-7.png",
    category: "Produtividade",
    readTime: "9 min",
  },
  {
    slug: "declaracao-imposto-renda-entregadores-2026",
    title: "Declaração de Imposto de Renda para Entregadores 2026",
    description: "Guia completo sobre IRPF, MEI e deduções para entregadores de aplicativo.",
    cover: "/blog-covers/capa-8.png",
    category: "Impostos",
    readTime: "10 min",
  },
  {
    slug: "qual-app-entrega-da-mais-dinheiro-2026",
    title: "Qual App de Entrega Dá Mais Dinheiro? Comparativo 2026",
    description: "Comparativo completo entre iFood, 99Food, Lalamove e Rappi. Descubra qual paga mais.",
    cover: "/blog-covers/capa-9.png",
    category: "Comparativo",
    readTime: "8 min",
  },
  {
    slug: "entregador-5-estrelas-todos-apps",
    title: "Como Se Tornar um Entregador 5 Estrelas em Todos os Apps",
    description: "Dicas práticas para conseguir avaliações máximas e fidelizar clientes.",
    cover: "/blog-covers/capa-10.png",
    category: "Dicas",
    readTime: "9 min",
  },
];

// Duplica os posts para criar o efeito de loop infinito
const LOOP_POSTS = [...POSTS, ...POSTS];

export function BlogCarousel() {
  return (
    <div className="relative overflow-hidden py-4">
      {/* Gradiente esquerdo (fade out) */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-white to-transparent dark:from-zinc-950" />
      {/* Gradiente direito (fade out) */}
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-white to-transparent dark:from-zinc-950" />

      {/* Container do carrossel — animação CSS infinita */}
      <motion.div
        className="flex gap-4 overflow-x-hidden"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 60, // 60 segundos para percorrer todos os posts
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ width: "max-content" }}
      >
        {LOOP_POSTS.map((post, index) => (
          <Link
            key={`${post.slug}-${index}`}
            href={`/blog/${post.slug}`}
            className="group block w-[280px] shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 sm:w-[320px]"
          >
            {/* Capa */}
            <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              <img
                src={post.cover}
                alt={post.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = `/blog-covers/capa-${(index % 10) + 1}.png`;
                }}
              />
              {/* Badge de categoria */}
              <div className="absolute left-2 top-2 rounded-full bg-neon px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-950">
                {post.category}
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-3">
              <h3 className="line-clamp-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {post.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                {post.description}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400">
                  ⏱ {post.readTime} de leitura
                </span>
                <span className="text-[10px] font-bold text-neon">
                  Ler →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
