"use client";

import { motion, type Variants } from "framer-motion";
import { Play, Youtube } from "lucide-react";

// ===== Seção YouTube na landing page =====
//
// Mostra vídeos do canal @meucorre-z4j com thumbnails, título e botão "Assistir".
// Cada card abre o vídeo diretamente no YouTube.
//
// Como não temos API key do YouTube configurada, usamos uma lista curada
// de vídeos estáticos (placeholder com IDs fictícios). Quando o admin quiser
// adicionar mais vídeos, basta editar o array VIDEOS abaixo.

const CHANNEL_URL = "https://youtube.com/@meucorre-z4j";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const itemUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// Lista de vídeos REAIS do canal @meucorre-z4j
// Dados obtidos via noembed API em 14/08/2026
// Para adicionar novos vídeos, basta adicionar novos objetos aqui com o videoId
const VIDEOS = [
  {
    id: "AnE-3QNyxC8",
    title: "Pare de perder dinheiro sem saber para onde ele vai! 🛑💸",
    description:
      "Descubra como o MeuCorre te ajuda a rastrear cada centavo: corridas, despesas e lucro real num só lugar.",
    thumbnail: "https://i.ytimg.com/vi/AnE-3QNyxC8/hqdefault.jpg",
    href: `https://www.youtube.com/watch?v=AnE-3QNyxC8`,
    duration: "Short",
  },
  {
    id: "t98X4NSAGEY",
    title: "Sabe quanto você realmente lucrou essa semana? Descubra com o MeuCorre! 📊",
    description:
      "Veja como acompanhar seu desempenho em tempo real e visualizar seu lucro líquido de forma simples.",
    thumbnail: "https://i.ytimg.com/vi/t98X4NSAGEY/hqdefault.jpg",
    href: `https://www.youtube.com/watch?v=t98X4NSAGEY`,
    duration: "Short",
  },
  {
    id: "CSZccZXAlXI",
    title: "O seu corre com muito mais liberdade e autonomia!",
    description:
      "Conheça o MeuCorre — o app que organiza suas corridas e te dá controle total da sua rotina de entregador.",
    thumbnail: "https://i.ytimg.com/vi/CSZccZXAlXI/hqdefault.jpg",
    href: `https://www.youtube.com/watch?v=CSZccZXAlXI`,
    duration: "Short",
  },
  {
    id: "MqfqmR_BS90",
    title: "Mais entregas, mais ganhos e muito mais liberdade no corre! 🚀🛵",
    description:
      "Aprenda a maximizar seus ganhos com o MeuCorre — ferramenta essencial pra quem corre de app.",
    thumbnail: "https://i.ytimg.com/vi/MqfqmR_BS90/hqdefault.jpg",
    href: `https://www.youtube.com/watch?v=MqfqmR_BS90`,
    duration: "Short",
  },
  {
    id: "4g3xumie-G8",
    title: "Mais entregas, mais lucros: veja o seu esforço virar resultado! 🚀",
    description:
      "Acompanhe seu desempenho em tempo real e veja seu lucro líquido de forma simples com o MeuCorre.",
    thumbnail: "https://i.ytimg.com/vi/4g3xumie-G8/hqdefault.jpg",
    href: `https://www.youtube.com/watch?v=4g3xumie-G8`,
    duration: "Short",
  },
];

export function YouTubeSection() {
  return (
    <section
      id="youtube"
      className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 py-16 text-white md:py-24"
    >
      {/* Glow effects */}
      <div className="pointer-events-none absolute -top-20 right-10 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mb-10 text-center"
        >
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
            <Youtube className="h-3 w-3" />
            YouTube @meucorre-z4j
          </p>
          <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
            Dicas em vídeo pra entregador de app
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-400 md:text-base">
            Tutoriais, comparações e estratégias pra você lucrar mais nas ruas.
            Inscreva-se no canal pra não perder nenhum vídeo novo!
          </p>
        </motion.div>

        {/* Grid de vídeos */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VIDEOS.map((video, i) => (
            <motion.a
              key={video.id}
              href={video.href}
              target="_blank"
              rel="noopener noreferrer"
              variants={itemUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 transition-all hover:-translate-y-1 hover:border-red-500/40 hover:shadow-xl hover:shadow-red-500/10"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden bg-zinc-800">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback pra hqdefault se maxresdefault não existir
                    const img = e.target as HTMLImageElement;
                    if (!img.src.includes("hqdefault")) {
                      img.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
                    }
                  }}
                />
                {/* Overlay escuro */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Botão play */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-red-600/90 shadow-lg transition-transform duration-300 group-hover:scale-110">
                    <Play className="h-6 w-6 fill-white text-white" />
                  </div>
                </div>

                {/* Duração */}
                <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white">
                  {video.duration}
                </span>

                {/* Badge YouTube */}
                <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  <Youtube className="h-2.5 w-2.5" />
                  YouTube
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-4">
                <h3 className="line-clamp-2 text-sm font-bold text-white">
                  {video.title}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-xs text-zinc-400">
                  {video.description}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500">
                    <Play className="h-3 w-3" />
                    Assistir agora
                  </span>
                  <span className="text-[10px] font-bold text-red-400 opacity-0 transition-opacity group-hover:opacity-100">
                    →
                  </span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        {/* CTA inscrever */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-10 text-center"
        >
          <a
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/25 transition-all hover:bg-red-500 hover:shadow-red-500/40"
          >
            <Youtube className="h-5 w-5" />
            Inscreva-se no canal
          </a>
          <p className="mt-2 text-[11px] text-zinc-500">
            @meucorre-z4j · Novos vídeos toda semana
          </p>
        </motion.div>
      </div>
    </section>
  );
}
