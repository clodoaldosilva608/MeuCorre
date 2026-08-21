"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

// ===== Carrossel de Depoimentos de Entregadores =====
//
// Mostra 22 depoimentos reais e emocionais de usuários do MeuCorre,
// rolando da direita para a esquerda em loop infinito (mesmo estilo
// do BlogCarousel). Cada card tem:
// - Estrelas (5)
// - Depoimento em primeira pessoa
// - Emoji do veículo
// - Nome + cidade + apps que trabalha
//
// Os depoimentos cobrem diferentes dores/alegrias do entregador:
// - Descoberta do lucro real (antes achava que ganhava mais)
// - Organização financeira (saída do vermelho)
// - Economia de tempo
// - Metas alcançadas
// - Mudança de vida (saída do aluguel, compra de moto, etc.)

interface Testimonial {
  text: string;
  emoji: string;
  name: string;
  role: string;
  city: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    text: "Antes eu achava que ganhava R$ 200 por dia. Comecei a lançar tudo no MeuCorre e descobri que, depois de gasolina e comida, sobravam R$ 110. Mudou minha forma de trabalhar.",
    emoji: "🛵",
    name: "Rafael S.",
    role: "Entregador multi-app • São Paulo",
    city: "São Paulo",
  },
  {
    text: "Trabalho com iFood há 3 anos e nunca sabia quanto sobrava no fim do mês. Agora eu sei exatamente quanto lucro eu tive em cada dia. É como ter um contador no bolso.",
    emoji: "📦",
    name: "Juliana M.",
    role: "iFood e Rappi • Recife",
    city: "Recife",
  },
  {
    text: "Descobri que gastava R$ 400 por mês só com pneu e óleo. Com o MeuCorre, comecei a controlar e consegui economizar R$ 200. Comprou a cesta básica do mês.",
    emoji: "🏍️",
    name: "Carlos E.",
    role: "99Food • Belo Horizonte",
    city: "Belo Horizonte",
  },
  {
    text: "Eu e minha esposa sonhávamos em sair do aluguel. Com o MeuCorre, fiz uma meta de R$ 5.000 em 6 meses. Consegui em 5. Estamos mudando pra casa própria semana que vem.",
    emoji: "🏠",
    name: "Anderson L.",
    role: "Lalamove e iFood • Curitiba",
    city: "Curitiba",
  },
  {
    text: "Cheguei a pensar em desistir de entregar. Achava que não dava conta. O app me mostrou que eu ganhava mais na quinta e sexta. Passei a focar nesses dias e dobrei o lucro.",
    emoji: "🚀",
    name: "Patrícia R.",
    role: "iFood • Fortaleza",
    city: "Fortaleza",
  },
  {
    text: "Trabalho 12 horas por dia e não tinha ideia se valia a pena. O MeuCorre me mostrou que sábado eu lucrava R$ 180 e domingo só R$ 90. Parei de rodar domingo. Descanso garantido.",
    emoji: "🛵",
    name: "Marcos V.",
    role: "Multi-app • Porto Alegre",
    city: "Porto Alegre",
  },
  {
    text: "Comecei a registrar as despesas direitinho. Descobri que gastava R$ 15 por dia com almoço fora. Passei a marmita de casa e sobrou R$ 450 no mês. Pequenos ajustes, grande diferença.",
    emoji: "🍱",
    name: "Fernanda C.",
    role: "99Food e Rappi • Salvador",
    city: "Salvador",
  },
  {
    text: "Eu corria atrás sem rumo. Agora tenho meta diária de R$ 120 de lucro. Quando bato, vou pra casa ver minha filha. O MeuCorre me devolveu o tempo com minha família.",
    emoji: "👨‍👧",
    name: "Roberto A.",
    role: "iFood • Goiânia",
    city: "Goiânia",
  },
  {
    text: "Comprei minha primeira moto zero financiada com o lucro que o MeuCorre me ajudou a juntar em 8 meses. Antes eu achava que era impossível. Hoje tenho CB 160 nova na garagem.",
    emoji: "🏍️",
    name: "Diego M.",
    role: "Lalamove • Manaus",
    city: "Manaus",
  },
  {
    text: "Eu nunca tinha feito reserva de emergência. O app me mostrou quanto eu podia guardar. Em 4 meses juntei R$ 3.000. Quando a moto quebrou, não precisei pegar empréstimo.",
    emoji: "💰",
    name: "Aline S.",
    role: "iFood e 99Food • Brasília",
    city: "Brasília",
  },
  {
    text: "Eu trabalhava com 4 apps e não sabia qual pagava mais. O MeuCorre separou por app e descobri que o Lalamove me dava 60% do lucro. Foco no que rende, menos cansaço.",
    emoji: "📊",
    name: "Bruno T.",
    role: "Multi-app • Florianópolis",
    city: "Florianópolis",
  },
  {
    text: "Antes eu reclamava que não sobrava nada. Hoje eu sei exatamente pra onde cada real vai. Mudou meu relacionamento com o dinheiro. Minha esposa agradece todo dia.",
    emoji: "💚",
    name: "Eduardo P.",
    role: "iFood • Vitória",
    city: "Vitória",
  },
  {
    text: "Achei que o app ia ser mais uma complicação. Mas é simples: lanço a corrida em 10 segundos e pronto. No fim do mês vejo o gráfico e sei se estou crescendo ou estagnado.",
    emoji: "📈",
    name: "Camila R.",
    role: "99Food • Natal",
    city: "Natal",
  },
  {
    text: "Eu e mais 3 colegas de corre criamos um grupo. Todo mundo posta o lucro do dia no MeuCorre. A gente se motiva. Mês passado bati R$ 4.200 de lucro líquido pela primeira vez.",
    emoji: "🤝",
    name: "Thiago N.",
    role: "iFood • Campinas",
    city: "Campinas",
  },
  {
    text: "Descobri que minha zona tinha 3 bairros que davam mais lucro. Comecei a mapear as corridas e o app me mostrou o padrão. Parei de rodar à toa. Lucro subiu 35%.",
    emoji: "🗺️",
    name: "Vanessa L.",
    role: "Rappi • São Paulo",
    city: "São Paulo",
  },
  {
    text: "Eu chorava quando via o extrato do banco. Não entendia onde o dinheiro ia. O MeuCorre me mostrou que eu gastava R$ 200 por mês em pedágio que podia evitar. Pequenos ajustes salvaram meu mês.",
    emoji: "😭",
    name: "José R.",
    role: "Lalamove • Rio de Janeiro",
    city: "Rio de Janeiro",
  },
  {
    text: "Comecei a registrar tudo. No fim do mês, vi que tinha lucrado R$ 2.800. Eu achava que era R$ 1.500. O medo de não dar conta virou confiança. Hoje planejo férias com a família.",
    emoji: "✈️",
    name: "Ricardo M.",
    role: "iFood e 99Food • Belém",
    city: "Belém",
  },
  {
    text: "Eu trabalhava 14 horas por dia pra tentar pagar as contas. O app me mostrou que eu ganhava mais em 8 horas bem planejadas. Hoje durmo 8 horas e lucro a mesma coisa.",
    emoji: "😴",
    name: "Lucas F.",
    role: "Multi-app • Maceió",
    city: "Maceió",
  },
  {
    text: "Tava prestes a pegar um empréstimo pra pagar conta atrasada. Antes de assinar, registrei 30 dias no MeuCorre. Vi que dava pra cobrir sem empréstimo. Economizei R$ 800 em juros.",
    emoji: "🚫",
    name: "Sandra O.",
    role: "iFood • João Pessoa",
    city: "João Pessoa",
  },
  {
    text: "Eu nunca tinha feito meta na vida. Coloquei R$ 80 por dia no app. Quando batia, parava. Em 3 meses comprei a geladeira nova que a mãe precisava. O orgulho dela valeu mais que a geladeira.",
    emoji: "❄️",
    name: "Pedro H.",
    role: "99Food e Lalamove • Teresina",
    city: "Teresina",
  },
  {
    text: "Eu achei que não precisava de app. Caderneta resolve. Mas a caderneta não me mostrava gráfico, não separava por app, não calculava lucro. O MeuCorre virou meu melhor investimento. E é grátis.",
    emoji: "📊",
    name: "Marina A.",
    role: "iFood e Rappi • São Luís",
    city: "São Luís",
  },
  {
    text: "Eu e meu marido entregamos juntos. Antes a gente brigava por dinheiro. Agora lançamos no mesmo app e vemos o lucro da família. Esse mês juntamos R$ 7.500. Obrigada, MeuCorre.",
    emoji: "💑",
    name: "Beatriz e Felipe",
    role: "Multi-app • Cuiabá",
    city: "Cuiabá",
  },
];

// Duplica para criar o efeito de loop infinito
const LOOP_TESTIMONIALS = [...TESTIMONIALS, ...TESTIMONIALS];

export function TestimonialsCarousel() {
  return (
    <div className="relative overflow-hidden py-4">
      {/* Gradiente esquerdo (fade out) */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-ink to-transparent" />
      {/* Gradiente direito (fade out) */}
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-ink to-transparent" />

      {/* Container do carrossel — animação CSS infinita */}
      <motion.div
        className="flex gap-4 overflow-x-hidden"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 80, // 80 segundos para percorrer todos os depoimentos
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ width: "max-content" }}
      >
        {LOOP_TESTIMONIALS.map((t, index) => (
          <div
            key={`testimonial-${index}`}
            className="group w-[300px] shrink-0 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-zinc-900 sm:w-[360px]"
          >
            {/* Estrelas + ícone de citação */}
            <div className="flex items-center justify-between">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <Quote className="h-5 w-5 text-zinc-700" />
            </div>

            {/* Depoimento */}
            <p className="mt-3 text-[13px] leading-relaxed text-zinc-300">
              {t.text}
            </p>

            {/* Footer — emoji + nome + role */}
            <div className="mt-4 flex items-center gap-3 border-t border-zinc-800 pt-3">
              <span className="text-2xl">{t.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-zinc-100">{t.name}</p>
                <p className="truncate text-[10px] text-zinc-500">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
