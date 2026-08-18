"use client";

import { motion } from "framer-motion";
import { Megaphone, ExternalLink } from "lucide-react";

// ===== Carrossel de Marcas Patrocinadas =====
//
// Segue o mesmo padrão do BlogCarousel: scroll horizontal infinito.
// 37 marcas fictícias com logo SVG gerado dinamicamente (iniciais + cor).
// Botão "Divulgar minha marca" pulsante com efeito de reflexo de cor.

interface SponsoredBrand {
  name: string;
  description: string;
  category: string;
  color: string; // hex color para o logo
}

const SPONSORED_BRANDS: SponsoredBrand[] = [
  { name: "MotoParts BR", description: "Peças e acessórios para moto com desconto", category: "Acessórios", color: "#ef4444" },
  { name: "Entrega Express", description: "Logística e fretes para entregadores", category: "Logística", color: "#3b82f6" },
  { name: "Capacetes Pro", description: "Capacetes premium com tecnologia Bluetooth", category: "Segurança", color: "#10b981" },
  { name: "Mochilas Táticas", description: "Mochilas térmicas resistentes para entrega", category: "Equipamentos", color: "#f59e0b" },
  { name: "Gasolina+", description: "Postos com desconto para entregadores", category: "Combustível", color: "#8b5cf6" },
  { name: "MotoSeguro", description: "Seguro de moto com preço de entregador", category: "Seguros", color: "#ec4899" },
  { name: "RotaCerta GPS", description: "App de navegação otimizado para motos", category: "Tecnologia", color: "#06b6d4" },
  { name: "PagEntrega", description: "Maquininha com taxa zero para entregadores", category: "Pagamentos", color: "#84cc16" },
  { name: "CaldoMoto", description: "Lavagem e estética automotiva para motos", category: "Serviços", color: "#f97316" },
  { name: "PneuTop", description: "Pneus com desconto e troca gratuita", category: "Peças", color: "#6366f1" },
  { name: "ChefExpress", description: "Marmitas saudáveis para entregadores", category: "Alimentação", color: "#14b8a6" },
  { name: "MotoClean", description: "Produtos de limpeza e cuidado para moto", category: "Cuidados", color: "#a855f7" },
  { name: "EntregaSegura", description: "Rastreamento e segurança para encomendas", category: "Segurança", color: "#dc2626" },
  { name: "MotoBank", description: "Conta digital grátis para entregadores", category: "Financeiro", color: "#2563eb" },
  { name: "BateriaMax", description: "Baterias de moto com garantia estendida", category: "Peças", color: "#ea580c" },
  { name: "ÓleoMotor", description: "Óleos e lubrificantes premium com desconto", category: "Manutenção", color: "#7c3aed" },
  { name: "MotoPark", description: "Estacionamentos gratuitos para entregadores", category: "Serviços", color: "#0891b2" },
  { name: "FeedMoto", description: "Restaurantes parceiros com desconto especial", category: "Alimentação", color: "#16a34a" },
  { name: "MotoMed", description: "Plano de saúde acessível para entregadores", category: "Saúde", color: "#db2777" },
  { name: "CapaChuva BR", description: "Capas de chuva profissionais reforçadas", category: "Equipamentos", color: "#0284c7" },
  { name: "MotoFlix", description: "Streaming de entretenimento para descanso", category: "Lazer", color: "#9333ea" },
  { name: "AcessMoto", description: "Acessórios personalizados para sua moto", category: "Acessórios", color: "#ca8a04" },
  { name: "RotaFlex", description: "Planejador de rotas com IA para entregas", category: "Tecnologia", color: "#059669" },
  { name: "MotoEdu", description: "Cursos online gratuitos para entregadores", category: "Educação", color: "#4f46e5" },
  { name: "SafeMoto", description: "Rastreador anti-furto para motos", category: "Segurança", color: "#b91c1c" },
  { name: "QuickFix", description: "Manutenção express com orçamento gratuito", category: "Manutenção", color: "#c2410c" },
  { name: "MotoVest", description: "Roupas profissionais para entregadores", category: "Vestuário", color: "#1d4ed8" },
  { name: "CellMount", description: "Suportes de celular antivibração premium", category: "Acessórios", color: "#15803d" },
  { name: "MotoCharge", description: "Carregadores e power banks para motos", category: "Tecnologia", color: "#7e22ce" },
  { name: "BreadBox", description: "Mochilas térmicas de alta capacidade", category: "Equipamentos", color: "#be185d" },
  { name: "MotoGo", description: "App de gestão financeira para entregadores", category: "Financeiro", color: "#0d9488" },
  { name: "GlovePro", description: "Luvas profissionais antideslizantes", category: "Segurança", color: "#a16207" },
  { name: "MotoShare", description: "Comunidade e network para entregadores", category: "Comunidade", color: "#4338ca" },
  { name: "DocMoto", description: "Documentação e MEI para entregadores", category: "Serviços", color: "#155e75" },
  { name: "NightRide", description: "Equipamentos de iluminação LED para moto", category: "Acessórios", color: "#581c87" },
  { name: "MotoFit", description: "Academia online para saúde do entregador", category: "Saúde", color: "#166534" },
  { name: "ExpressPay", description: "Empréstimos com taxa justa para entregadores", category: "Financeiro", color: "#9f1239" },
];

// Duplica para criar loop infinito
const LOOP_BRANDS = [...SPONSORED_BRANDS, ...SPONSORED_BRANDS];

const SPONSOR_CHECKOUT_URL = "https://pay.kiwify.com.br/th2VNpn";

// Gera iniciais a partir do nome da marca
function getInitials(name: string): string {
  const words = name.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function SponsoredBrandsCarousel() {
  return (
    <section className="bg-zinc-950 py-16 text-white md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <Megaphone className="h-3 w-3" />
            Marcas Patrocinadas
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            Marcas que apoiam o <span className="text-emerald-400">MeuCorre</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400">
            Empresas que acreditam no entregador e investem para estar visíveis na nossa plataforma.
          </p>
        </motion.div>
      </div>

      {/* Carrossel infinito (igual ao BlogCarousel) */}
      <div className="relative mt-10 overflow-hidden py-4">
        {/* Gradiente esquerdo (fade out) */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-zinc-950 to-transparent" />
        {/* Gradiente direito (fade out) */}
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-zinc-950 to-transparent" />

        {/* Container do carrossel — animação CSS infinita */}
        <motion.div
          className="flex gap-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 80, // 80 segundos para percorrer todas as marcas
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ width: "max-content" }}
        >
          {LOOP_BRANDS.map((brand, index) => (
            <div
              key={`${brand.name}-${index}`}
              className="group block w-[200px] shrink-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-lg sm:w-[220px]"
            >
              {/* Logo gerado dinamicamente */}
              <div className="relative flex h-24 items-center justify-center overflow-hidden bg-zinc-800">
                <div
                  className="grid h-14 w-14 place-items-center rounded-xl text-lg font-black text-white shadow-lg transition-transform group-hover:scale-110"
                  style={{ backgroundColor: brand.color }}
                >
                  {getInitials(brand.name)}
                </div>
                {/* Badge de categoria */}
                <div className="absolute left-2 top-2 rounded-full bg-zinc-900/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400 backdrop-blur">
                  {brand.category}
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-3">
                <h3 className="truncate text-sm font-bold text-white">
                  {brand.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400">
                  {brand.description}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* CTA pulsante para marcas se inscreverem */}
      <div className="mt-10 flex flex-col items-center gap-4 px-4">
        <div className="text-center">
          <p className="text-sm text-zinc-400">
            <strong className="text-white">Quer divulgar sua marca?</strong>
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Sua marca no carrossel por apenas{" "}
            <span className="font-bold text-emerald-400">R$ 16,90/mês</span>
          </p>
        </div>

        {/* Botão com efeito pulsante + reflexo de cor */}
        <motion.a
          href={SPONSOR_CHECKOUT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-8 py-3 text-sm font-bold text-white shadow-lg"
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          }}
          animate={{
            scale: [1, 1.03, 1],
            boxShadow: [
              "0 0 20px rgba(16, 185, 129, 0.3)",
              "0 0 40px rgba(16, 185, 129, 0.6)",
              "0 0 20px rgba(16, 185, 129, 0.3)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Efeito de reflexo — brilho que percorre o botão */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)",
            }}
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Conteúdo do botão (acima do reflexo) */}
          <span className="relative z-10 flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Divulgar minha marca
            <ExternalLink className="h-4 w-4" />
          </span>
        </motion.a>

        <p className="text-[10px] text-zinc-500">
          Assinatura mensal · Cancelamento a qualquer momento · Pix ou cartão
        </p>
      </div>
    </section>
  );
}
