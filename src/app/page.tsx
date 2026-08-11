"use client";

import { useState, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdSense } from "@/components/adsense";
import { SOCIAL_LINKS } from "@/components/social-icons";
import { PhoneShowcase } from "@/components/meucorre/phone-showcase";
import { BlogCarousel } from "@/components/meucorre/blog-carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Zap,
  Check,
  ArrowRight,
  Infinity as InfinityIcon,
  Star,
  CreditCard,
  Lock,
  Fuel,
} from "lucide-react";

const PLAN_PRICE = 18.9; // Preço vitalício (oferta promocional limitada)
const ANNUAL_PRICE = 97; // Preço do plano anual
const MONTHLY_PRICE = 14.9; // Preço do plano mensal
const ORIGINAL_PRICE = 97; // Mantido para compat (era o preço do vitalício antes, agora é o anual)

// ===== Animações framer-motion reutilizáveis =====
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const containerStagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

// ===== Dados =====
const FEATURES = [
  {
    emoji: "⚡",
    title: "Lançamento em 3 toques",
    desc: "Registre a corrida mais rápido do que o cliente abre a porta",
  },
  {
    emoji: "💸",
    title: "Controle de despesas",
    desc: "Gasolina, comida, manutenção — você sabe o lucro real, não o faturamento",
  },
  {
    emoji: "📊",
    title: "Gráficos que mostram a verdade",
    desc: "Por app, por dia, por categoria. Onde entra e onde sai cada real",
  },
  {
    emoji: "🔔",
    title: "Captura por notificação",
    desc: "Cole a notificação do app e o MeuCorre preenche tudo sozinho",
  },
  {
    emoji: "🛣️",
    title: "Multi-app",
    desc: "iFood, 99Food, Lalamove e mais — cadastre outros com a logo oficial",
  },
  {
    emoji: "📴",
    title: "100% offline",
    desc: "Funciona em subsolo, sem sinal, sem Wi-Fi. Seus dados ficam no seu celular",
  },
];

const SCREENSHOTS = [
  {
    src: "/screenshots/07-dashboard-corridas.png",
    intro: "Tudo numa tela só",
    desc: "Total, lucro líquido, corridas e km — sem precisar abrir 3 apps diferentes.",
    alt: "Dashboard do MeuCorre mostrando total, lucro líquido, corridas e quilometragem",
  },
  {
    src: "/screenshots/09-dashboard-graficos.png",
    intro: "Gráficos que mostram a verdade",
    desc: "Veja pra onde seu dinheiro vai: por app, por dia, por categoria de despesa.",
    alt: "Gráficos de ganhos e despesas no MeuCorre por app e por dia",
  },
  {
    src: "/screenshots/08-dashboard-despesas.png",
    intro: "Cada real gasto fica registrado",
    desc: "Sem surpresa no fim do mês. Gasolina, comida, manutenção — tudo lá dentro.",
    alt: "Tela de despesas no MeuCorre com categorias de gasto",
  },
  {
    src: "/screenshots/12-dashboard-mobile.png",
    intro: "Funciona no celular, offline",
    desc: "Lance corridas em 3 toques, mesmo sem internet. Seus dados ficam no seu aparelho.",
    alt: "Dashboard do MeuCorre no celular, funcionando offline",
  },
];

const PRO_FEATURES = [
  "Tudo do plano gratuito, para sempre",
  "Sem nenhum anúncio no app",
  "Relatórios PDF mensais (ganhos, despesas, lucro)",
  "Backup em nuvem criptografado entre dispositivos",
  "Metas diárias e semanais com progresso visual",
  "Lembretes de manutenção (troca de óleo, revisão, IPVA)",
  "Suporte prioritário via WhatsApp",
  "Todas as futuras atualizações inclusas",
];

export default function LandingPage() {
  // Estado global do dialog de checkout — compartilhado entre todos os CTAs
  // "Comprar plano vitalício" da landing (hero, header, plans section).
  // Antes, cada CTA era um <a href="#planos"> que só fazia scroll, exigindo
  // um segundo clique no botão da seção de planos para abrir o dialog.
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<
    "monthly" | "annual" | "lifetime"
  >("lifetime");
  const openCheckout = () => {
    setSelectedPlan("lifetime");
    setCheckoutOpen(true);
  };
  const openCheckoutWithPlan = (plan: "monthly" | "annual" | "lifetime") => {
    setSelectedPlan(plan);
    setCheckoutOpen(true);
  };

  // ===== Status da oferta vitalício (contador de vagas + cutoff) =====
  // Busca do backend quantos vitalícios já foram vendidos e se a oferta
  // ainda está disponível. Atualiza a UI para mostrar urgência real.
  const [lifetimeStatus, setLifetimeStatus] = useState<{
    available: boolean;
    remaining: number;
    totalSold: number;
    maxSales: number;
    cutoffDate: string;
    cutoffPassed: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/lifetime-status", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setLifetimeStatus(data))
      .catch(() => {
        // Se falhar, assume disponível (não bloqueia compra)
      });
  }, []);

  // ===== Referral: detecta ?ref=CODE na URL e salva no localStorage =====
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");
    if (refCode) {
      localStorage.setItem("meucorre_referral_code", refCode.toUpperCase());
      // Registra clique no backend (fire-and-forget)
      fetch("/api/referral/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: refCode.toUpperCase() }),
      }).catch(() => {});
      // Limpa o ?ref= da URL sem recarregar
      const url = new URL(window.location.href);
      url.searchParams.delete("ref");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-ink text-white">
      <Header onCheckout={openCheckout} />

      {/* ===== 1. HERO — fundo limpo com glow neon (pronto para animação futura) ===== */}
      <section className="relative overflow-hidden bg-ink">
        {/* Glow neon radial — substitui a imagem de fundo, deixa o hero limpo
            para receber animação temática (entregador / fastfood / encomendas) */}
        <div className="pointer-events-none absolute inset-0">
          {/* Glow superior esquerdo */}
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-neon/15 blur-3xl" />
          {/* Glow inferior direito */}
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-neon/10 blur-3xl" />
          {/* Glow central sutil */}
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon/5 blur-3xl" />
          {/* Grade sutil de fundo (grid pattern) */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #39ff14 1px, transparent 1px), linear-gradient(to bottom, #39ff14 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Conteúdo do hero (texto + CTAs) */}
        <div className="relative mx-auto flex min-h-[100svh] max-w-5xl flex-col items-center justify-center px-4 py-16 text-center md:py-24">
          {/* Logo / brand */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="show"
            className="flex items-center justify-center gap-2"
          >
            <img src="/logo-meucorre.png" alt="MeuCorre" className="h-10 w-10 rounded-xl shadow-neon" />
            <span className="text-xl font-extrabold tracking-tight text-neon text-glow-neon">
              MeuCorre
            </span>
          </motion.div>

          {/* Headline */}
          <div className="mt-8 max-w-3xl">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-medium text-neon backdrop-blur-sm"
            >
              <Star className="h-3 w-3 fill-neon" />
              Feito por entregador, para entregador
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="text-balance text-4xl font-black uppercase leading-none tracking-tight md:text-6xl lg:text-7xl"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              <span className="block text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                Pare de perder
              </span>
              <span className="mt-1 block text-neon text-glow-neon">
                dinheiro
              </span>
              <span className="mt-1 block text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                sem saber!
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mx-auto mt-5 max-w-xl text-pretty text-sm font-medium text-zinc-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] md:text-base"
            >
              Controle corridas, despesas e lucro real em um só lugar.
              Funciona com iFood, 99Food, Lalamove e qualquer outro app.
            </motion.p>

            {/* CTAs: Quiz (destaque), Baixar grátis, Quero PRO, Entrar */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
            >
              <a
                href="/quiz"
                className="btn-neon inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm sm:w-auto md:text-base"
              >
                <Zap className="h-4 w-4" />
                Descubra quanto você está perdendo
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/app"
                className="btn-neon-outline inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm sm:w-auto md:text-base"
              >
                Baixar grátis
              </a>
              <button
                type="button"
                onClick={openCheckout}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:border-neon/50 hover:text-neon sm:w-auto md:text-base"
              >
                <CreditCard className="h-4 w-4" />
                Quero PRO
              </button>
              <a
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:border-neon/50 hover:text-neon sm:w-auto md:text-base"
              >
                Entrar
              </a>
            </motion.div>

            {/* Trust badges — como no banner */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-300 md:text-xs"
            >
              <span className="rounded-full border border-neon/30 bg-black/40 px-3 py-1 backdrop-blur-sm">
                100% offline
              </span>
              <span className="rounded-full border border-neon/30 bg-black/40 px-3 py-1 backdrop-blur-sm">
                App grátis
              </span>
              <span className="rounded-full border border-neon/30 bg-black/40 px-3 py-1 backdrop-blur-sm">
                Sem mensalidade
              </span>
              <span className="rounded-full border border-neon/30 bg-black/40 px-3 py-1 backdrop-blur-sm">
                Sem cadastro
              </span>
            </motion.div>

            {/* Preço destaque — dourado como no banner */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-8 inline-flex flex-col items-center gap-1 rounded-2xl border border-gold/40 bg-black/60 px-6 py-4 backdrop-blur-md"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                Oferta vitalício
              </p>
              <div className="flex items-end gap-2">
                <span className="mb-1 text-sm font-medium text-zinc-400 line-through">
                  R$ 97,00
                </span>
                <span className="text-4xl font-black text-gold text-glow-gold md:text-5xl">
                  R$ 18,90
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">via Pix • pagamento único</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== 2. A DOR REAL (dark com paleta nova) ===== */}
      <section className="relative overflow-hidden bg-ink py-16 text-white md:py-24">
        <div className="mx-auto max-w-3xl px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center"
          >
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-orange-hot/40 bg-orange-hot/10 px-3 py-1 text-xs font-medium text-orange-hot">
              A realidade de quem corre
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Cê trabalha o dia inteiro.
              <br />
              <span className="text-zinc-400">Mas sabe quanto ganhou?</span>
            </h2>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-10 space-y-6"
          >
            <p className="text-center text-lg leading-relaxed text-zinc-300 md:text-xl">
              Você sai de casa às <strong className="text-white">6h</strong>,
              volta às <strong className="text-white">22h</strong>. Rodou{" "}
              <strong className="text-white">150km</strong>, fez{" "}
              <strong className="text-white">25 corridas</strong>.
              <br />
              <span className="font-semibold text-neon">
                Mas quanto cê ganhou de verdade?
              </span>
            </p>

            <div className="card-neon p-5 md:p-6">
              <p className="text-center text-base leading-relaxed text-zinc-300 md:text-lg">
                Abre o iFood: <strong className="text-white">R$ 87</strong>. Abre
                o 99Food: <strong className="text-white">R$ 54</strong>. Abre o
                Lalamove: <strong className="text-white">R$ 32</strong>.
              </p>
              <p className="mt-4 text-center text-base font-semibold text-orange-hot md:text-lg">
                Mas e a gasolina? E o almoço? E a manutenção?
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={containerStagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-10 grid gap-3 sm:grid-cols-3"
          >
            {[
              {
                emoji: "😵‍💫",
                title: "Faturamento fragmentado",
                desc: "iFood aqui, 99 ali, Lalamove acolá — sem visão total",
              },
              {
                emoji: "⛽",
                title: "Despesas invisíveis",
                desc: "Gasolina e manutenção comem o lucro sem você perceber",
              },
              {
                emoji: "📉",
                title: "Sem saber se valeu a pena",
                desc: "Você trabalha 12h e não sabe quanto realmente ganhou",
              },
            ].map((p, i) => (
              <motion.div key={i} variants={itemUp}>
                <PainCard
                  emoji={p.emoji}
                  title={p.title}
                  desc={p.desc}
                  variant="dark"
                />
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-10 text-center text-base text-zinc-400 md:text-lg"
          >
            No fim do mês, sobra menos do que cê achava.{" "}
            <span className="font-semibold text-neon">
              Bora resolver isso.
            </span>
          </motion.p>
        </div>
      </section>

      {/* ===== 3. A SOLUÇÃO (claro, fundo branco) ===== */}
      <section className="bg-white py-16 text-zinc-900 md:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center"
          >
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-medium text-neon">
              <Check className="h-3 w-3" />
              A solução
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl">
              MeuCorre junta tudo
              <br />
              <span className="text-neon">numa tela só</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-zinc-600 md:text-lg">
              Sem planilha, sem caderninho, sem abrir 3 apps pra somar. O
              entregador lança, o app calcula, você decide.
            </p>
          </motion.div>

          <motion.div
            variants={containerStagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                variants={itemUp}
                className="rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-neon hover:shadow-neon"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-neon/10 text-2xl">
                  {f.emoji}
                </div>
                <h3 className="mt-3 text-sm font-bold text-zinc-900">
                  {f.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== 4. VEJA COMO FUNCIONA (iPhone showcase animado) ===== */}
      <section className="relative overflow-hidden border-y border-zinc-200 bg-zinc-50 py-16 text-zinc-900 md:py-24">
        {/* AdSense — banner horizontal discreto entre seções (só aparece se configurado) */}
        <div className="mx-auto mb-12 max-w-3xl px-4">
          <AdSense
            slot="1111111111"
            format="horizontal"
            className="min-h-[90px] rounded-lg"
          />
        </div>
        <div className="mx-auto max-w-5xl px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center"
          >
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-medium text-neon">
              Veja como funciona
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl">
              Não é promessa. É tela.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-zinc-600 md:text-lg">
              Olha como o MeuCorre trabalha por você — do lançamento ao lucro
              líquido. Veja o app rodando no celular:
            </p>
          </motion.div>

          {/* iPhone com carousel animado */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-12 flex justify-center"
          >
            <PhoneShowcase />
          </motion.div>

          {/* Features grid abaixo do phone */}
          <motion.div
            variants={containerStagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2"
          >
            {[
              { emoji: "⚡", title: "Lançamento em 3 toques", desc: "Registre a corrida mais rápido do que o cliente abre a porta" },
              { emoji: "💸", title: "Controle de despesas", desc: "Gasolina, comida, manutenção — você sabe o lucro real" },
              { emoji: "📊", title: "Gráficos que mostram a verdade", desc: "Por app, por dia, por categoria. Onde entra e onde sai cada real" },
              { emoji: "🛒", title: "Ofertas exclusivas", desc: "Descontos em produtos selecionados para entregadores" },
            ].map((f, i) => (
              <motion.div
                key={i}
                variants={itemUp}
                className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4"
              >
                <span className="text-2xl">{f.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-zinc-900">{f.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-600">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* AdSense — banner entre depoimento e oferta */}
      <div className="bg-ink py-4">
        <div className="mx-auto max-w-3xl px-4">
          <AdSense
            slot="2222222222"
            format="horizontal"
            className="min-h-[90px] rounded-lg"
          />
        </div>
      </div>

      {/* ===== BLOG CARROSSEL (direita → esquerda) ===== */}
      <section className="bg-white py-16 text-zinc-900 md:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mb-8 text-center"
          >
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-medium text-neon">
              Blog MeuCorre
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl">
              Dicas que aumentam seu lucro
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-zinc-600">
              Artigos práticos sobre finanças, moto, economia e estratégia para
              entregadores de app.
            </p>
          </motion.div>
        </div>

        {/* Carrossel rolando da direita para esquerda */}
        <div className="mx-auto max-w-5xl">
          <BlogCarousel />
        </div>

        <div className="mt-8 text-center">
          <a
            href="/blog"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-500 bg-white px-6 py-3 text-sm font-bold text-emerald-600 transition-all hover:bg-emerald-50"
          >
            Ver todos os artigos →
          </a>
        </div>
      </section>

      {/* ===== 5. DEPOIMENTO (dark) ===== */}
      <section className="bg-ink py-16 text-white md:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="card-neon p-6 md:p-10"
          >
            <div className="flex gap-1 text-neon">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-neon" />
              ))}
            </div>
            <p className="mt-4 text-balance text-lg font-medium leading-relaxed md:text-xl">
              &ldquo;Antes eu achava que ganhava R$ 200 por dia. Comecei a
              lançar tudo no MeuCorre e descobri que, depois de gasolina e
              comida, sobravam R$ 110. Mudou minha forma de trabalhar.&rdquo;
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-neon/20 text-base">
                🛵
              </div>
              <div>
                <p className="text-sm font-bold">Rafael S.</p>
                <p className="text-xs text-zinc-400">
                  Entregador multi-app • São Paulo
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== 6. PLANOS (gratuito + 3 tiers: mensal / anual / vitalício) ===== */}
      <section id="planos" className="bg-white py-16 text-zinc-900 md:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center"
          >
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-orange-hot/40 bg-orange-hot/10 px-3 py-1 text-xs font-bold text-orange-hot">
              🔥 Escolha seu plano — sem fidelidade
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl">
              MeuCorre PRO — você escolhe como pagar
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-zinc-600">
              Mensal flexível, anual com economia, ou vitalício por tempo
              limitado. Todos com as mesmas features PRO.
            </p>
          </motion.div>

          {/* Plano Gratuito — destaque para trial */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mx-auto mt-8 max-w-3xl rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-5"
          >
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Plano gratuito
                </p>
                <p className="mt-1 text-3xl font-black text-zinc-900">
                  R$ 0
                  <span className="text-sm font-normal text-zinc-500">
                    {" "}para sempre
                  </span>
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  <strong className="text-emerald-600">14 dias de trial grátis</strong> com
                  acesso total ao app. Depois: 5 lançamentos/dia grátis para sempre.
                </p>
              </div>
              <a
                href="/app"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border-2 border-emerald-500 bg-white px-6 py-3 text-sm font-bold text-emerald-600 transition-all hover:bg-emerald-50"
              >
                Começar grátis
              </a>
            </div>
          </motion.div>

          {/* Separador */}
          <div className="mx-auto mt-6 flex max-w-3xl items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Quer mais? Faça upgrade para PRO
            </p>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          {/* Grid de 3 planos pagos */}
          <motion.div
            variants={containerStagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mx-auto mt-6 grid max-w-4xl gap-4 md:grid-cols-3"
          >
            {/* MENSAL */}
            <motion.div
              variants={itemUp}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Mensal
              </p>
              <p className="mt-2 text-xs text-zinc-500">Flexível, cancele quando quiser</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-black text-zinc-900">
                  R$ 14,90
                </span>
                <span className="text-xs text-zinc-500">/mês</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-zinc-700">
                <li className="flex items-start gap-1.5">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-neon" />
                  Todas as features PRO
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-neon" />
                  Cancele a qualquer momento
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-neon" />
                  Sem fidelidade
                </li>
              </ul>
              <button
                type="button"
                onClick={() => openCheckoutWithPlan("monthly")}
                className="mt-5 w-full rounded-xl border-2 border-zinc-300 bg-white py-3 text-sm font-bold text-zinc-700 transition-all hover:border-neon hover:text-neon"
              >
                Assinar mensal
              </button>
            </motion.div>

            {/* ANUAL — destaque "mais popular" */}
            <motion.div
              variants={itemUp}
              className="relative flex flex-col rounded-2xl border-2 border-neon bg-white p-5 shadow-neon"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-neon px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-950">
                Mais popular
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-neon">
                Anual
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Economize 46% vs mensal
              </p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-black text-zinc-900">R$ 97</span>
                <span className="text-xs text-zinc-500">/ano</span>
              </div>
              <p className="mt-1 text-[10px] text-zinc-500">
                ≈ R$ 8,08/mês
              </p>
              <ul className="mt-4 space-y-2 text-xs text-zinc-700">
                <li className="flex items-start gap-1.5">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-neon" />
                  Todas as features PRO
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-neon" />
                  12 meses pelo preço de ~6,5
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-neon" />
                  Renovação automática (cancele antes)
                </li>
              </ul>
              <button
                type="button"
                onClick={() => openCheckoutWithPlan("annual")}
                className="btn-neon mt-5 w-full py-3 text-sm"
              >
                Assinar anual
              </button>
            </motion.div>

            {/* VITALÍCIO — oferta limitada com contador de vagas */}
            {lifetimeStatus?.available !== false && (
              <motion.div
                variants={itemUp}
                className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-gold bg-zinc-950 p-5 text-white shadow-lg"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-950">
                  🔥 Oferta limitada
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-gold">
                  Vitalício
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  Pague uma vez, use para sempre
                </p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-gold">R$ 18,90</span>
                </div>
                <p className="mt-1 text-[10px] text-zinc-500 line-through">
                  de R$ 97,00 (preço anual)
                </p>

                {/* Contador de vagas restantes */}
                {lifetimeStatus && (
                  <div className="mt-2 rounded-lg border border-gold/30 bg-gold/5 p-2 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                      {lifetimeStatus.remaining <= 50
                        ? "⚠️ Últimas vagas!"
                        : "Vagas restantes"}
                    </p>
                    <p className="text-lg font-black text-gold">
                      {lifetimeStatus.remaining}
                      <span className="text-xs font-normal text-zinc-500">
                        {" "}
                        / {lifetimeStatus.maxSales}
                      </span>
                    </p>
                    {lifetimeStatus.cutoffDate && (
                      <p className="text-[9px] text-zinc-500">
                        até{" "}
                        {new Date(lifetimeStatus.cutoffDate).toLocaleDateString(
                          "pt-BR",
                          { day: "2-digit", month: "2-digit", year: "numeric" },
                        )}
                      </p>
                    )}
                  </div>
                )}

                <ul className="mt-4 space-y-2 text-xs text-zinc-300">
                  <li className="flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-gold" />
                    Pagamento único — sem renovação
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-gold" />
                    Acesso vitalício a todas as features
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-gold" />
                    Todas as atualizações futuras
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() => openCheckoutWithPlan("lifetime")}
                  className="mt-5 w-full rounded-xl bg-gold py-3 text-sm font-bold text-zinc-950 transition-all hover:bg-yellow-400"
                >
                  <Zap className="mr-1 inline h-3.5 w-3.5" />
                  Garantir vitalício
                </button>
                <p className="mt-2 text-center text-[10px] text-orange-hot">
                  ⚠️ Pode acabar a qualquer momento
                </p>
              </motion.div>
            )}

            {/* Banner de cutoff — mostra quando vitalício NÃO está disponível */}
            {lifetimeStatus?.available === false && (
              <motion.div
                variants={itemUp}
                className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-zinc-300 bg-zinc-100 p-5 text-zinc-500"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-400 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-950">
                  Esgotado
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Vitalício
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  Oferta encerrada
                </p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-zinc-400 line-through">
                    R$ 18,90
                  </span>
                </div>
                <p className="mt-4 text-center text-xs text-zinc-500">
                  As 500 vagas acabaram!<br />
                  Escolha mensal ou anual abaixo.
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Reassurance row */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500"
          >
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3" /> Pagamento via Pix ou cartão
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3 text-neon" /> Ativação automática
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3 text-neon" /> 14 dias de trial grátis
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3 text-neon" /> Sem fidelidade
            </span>
          </motion.div>
        </div>
      </section>

      {/* ===== 7. FAQ ===== */}
      <section className="border-t border-zinc-200 bg-zinc-50 py-16 text-zinc-900 md:py-20">
        <div className="mx-auto max-w-2xl px-4">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center text-2xl font-extrabold tracking-tight text-zinc-900 md:text-3xl"
          >
            Perguntas frequentes
          </motion.h2>
          <motion.div
            variants={containerStagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-8 space-y-3"
          >
            {[
              {
                q: "O app funciona sem internet?",
                a: "Sim, 100% offline. Seus dados ficam salvos no seu celular (IndexedDB). Você consegue lançar corridas e ver relatórios mesmo em subsolos ou áreas sem sinal.",
              },
              {
                q: "Como funciona o plano vitalício?",
                a: "Você paga R$ 18,90 (preço de lançamento, depois volta pra R$ 97) uma única vez via Pix ou cartão na Kiwify. Assim que o pagamento é aprovado (em segundos no Pix), sua licença PRO é gerada automaticamente e você já pode ativar no app. Pronto — PRO para sempre, sem mais cobranças.",
              },
              {
                q: "E se eu trocar de celular?",
                a: "Sua licença é vinculada ao seu email. É só ativar a mesma chave no novo aparelho. O backup em nuvem (feature PRO) sincroniza seus dados entre dispositivos.",
              },
              {
                q: "Meus dados são vendidos?",
                a: "Nunca. O MeuCorre é Local-First: nenhum dado de corrida sai do seu celular. Nem mesmo o admin consegue ver seus ganhos. Só armazenamos sua licença.",
              },
              {
                q: "Tem como testar antes de pagar?",
                a: "Sim! Você tem 14 dias de trial grátis com acesso total ao app (corridas, despesas, gráficos, captura por notificação). Após os 14 dias, o plano gratuito continua funcionando com limite de 5 lançamentos por dia. Você só paga se quiser remover anúncios e ter as features PRO ilimitadas.",
              },
            ].map((item, i) => (
              <motion.div key={i} variants={itemUp}>
                <FaqItem q={item.q} a={item.a} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== 7.5 GALERIA SOCIAL (imagens do Instagram/TikTok/YouTube) ===== */}
      <section className="bg-white py-12 text-zinc-900 md:py-16">
        <div className="mx-auto max-w-5xl px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mb-6 text-center"
          >
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-medium text-neon">
              @meucorre nas redes
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 md:text-3xl">
              Siga o MeuCorre
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { src: "/social-post-1.png", label: "Instagram", href: "https://www.instagram.com/meucorr" },
              { src: "/social-post-2.png", label: "TikTok", href: "https://www.tiktok.com/@meucorr" },
              { src: "/social-post-3.png", label: "TikTok", href: "https://www.tiktok.com/@meucorr" },
              { src: "/blog-comparison.png", label: "YouTube", href: "https://youtube.com/@meucorre-z4j" },
            ].map((item, i) => (
              <motion.a
                key={i}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                variants={itemUp}
                className="group relative overflow-hidden rounded-xl border border-zinc-200 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <img
                  src={item.src}
                  alt={`MeuCorre no ${item.label}`}
                  className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {item.label} →
                </span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 8. CTA FINAL grande ===== */}
      <section className="relative overflow-hidden bg-ink py-20 text-center text-white md:py-28">
        {/* Glow */}
        <div className="pointer-events-none absolute -bottom-32 left-1/2 h-72 w-[600px] -translate-x-1/2 rounded-full bg-neon/20 blur-3xl" />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="relative mx-auto max-w-2xl px-4"
        >
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-medium text-neon">
            <InfinityIcon className="h-3 w-3" />
            Pagamento único — usa para sempre
          </div>
          <h2 className="text-balance text-3xl font-black uppercase tracking-tight md:text-5xl">
            Bora parar de perder{" "}
            <span className="text-neon text-glow-neon">dinheiro?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-pretty text-base text-zinc-300 md:text-lg">
            Junte seus apps, suas despesas e seu lucro numa tela só. Hoje, por
            menos de 1 tanque de gasolina.
          </p>
          <button
            type="button"
            onClick={openCheckout}
            className="btn-neon mt-8 inline-flex w-full items-center justify-center gap-2 px-8 py-4 text-base sm:w-auto md:text-lg"
          >
            <Zap className="h-5 w-5" />
            Garanta seu acesso com desconto
            <ArrowRight className="h-5 w-5" />
          </button>
          <p className="mt-4 text-xs text-zinc-500">
            Pagamento único • Pix ou cartão • Vitalício • Sem mensalidade
          </p>
        </motion.div>
      </section>

      {/* AdSense — banner antes do footer */}
      <div className="bg-white py-4">
        <div className="mx-auto max-w-3xl px-4">
          <AdSense
            slot="3333333333"
            format="horizontal"
            className="min-h-[90px] rounded-lg"
          />
        </div>
      </div>

      {/* ===== 9. FOOTER (completo com links e redes sociais) ===== */}
      <footer className="mt-auto bg-ink py-10 text-zinc-400">
        <div className="mx-auto max-w-5xl px-4">
          {/* Grid de colunas */}
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {/* Coluna 1 — Produto */}
            <div>
              <div className="flex items-center gap-2">
                <img src="/logo-meucorre.png" alt="MeuCorre" className="h-8 w-auto rounded-lg" />
              </div>
              <ul className="mt-4 space-y-2 text-xs">
                <li><a href="/app" className="hover:text-neon">Abrir app</a></li>
                <li><a href="#planos" className="hover:text-neon">Planos</a></li>
                <li><a href="/servicos" className="hover:text-neon">Serviços</a></li>
                <li><a href="/cases" className="hover:text-neon">Cases</a></li>
                <li><a href="/blog" className="hover:text-neon">Blog</a></li>
              </ul>
            </div>

            {/* Coluna 2 — Empresa */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Empresa
              </p>
              <ul className="mt-4 space-y-2 text-xs">
                <li><a href="/sobre" className="hover:text-neon">Sobre</a></li>
                <li><a href="/institucional" className="hover:text-neon">Institucional</a></li>
                <li><a href="/contato" className="hover:text-neon">Contato</a></li>
                <li><a href="/admin/login" className="hover:text-neon">Admin</a></li>
              </ul>
            </div>

            {/* Coluna 3 — Legal */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Legal
              </p>
              <ul className="mt-4 space-y-2 text-xs">
                <li><a href="/termos" className="hover:text-neon">Termos de Serviço</a></li>
                <li><a href="/privacidade" className="hover:text-neon">Política de Privacidade</a></li>
                <li><a href="/faq" className="hover:text-neon">FAQ</a></li>
              </ul>
            </div>

            {/* Coluna 4 — Redes sociais (ícones SVG temáticos) */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Siga-nos
              </p>
              <div className="mt-4 flex gap-3">
                {SOCIAL_LINKS.map(({ name, href, Icon, label }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-400 transition-all hover:border-neon hover:text-neon"
                    title={label}
                    aria-label={name}
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
              <p className="mt-2 text-[9px] text-zinc-600">
                Capacete • Bicicleta • Moto • Carro
              </p>
            </div>
          </div>

          {/* Créditos */}
          <div className="mt-8 border-t border-zinc-800 pt-6 text-center">
            <p className="text-sm font-semibold text-zinc-300">
              Criado e desenvolvido por{" "}
              <span className="font-bold text-neon">
                Clodoaldo C Silva
              </span>
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              © {new Date().getFullYear()} MeuCorre • Feito no Brasil 🇧🇷 com
              💚 pra quem corre atrás
            </p>
          </div>
        </div>
      </footer>

      {/* Dialog de checkout — instância única compartilhada entre todos os
          CTAs "Comprar plano vitalício" da landing page. */}
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        selectedPlan={selectedPlan}
        onPlanChange={setSelectedPlan}
      />
    </div>
  );
}

// ===== Subcomponentes =====

function Header({ onCheckout }: { onCheckout: () => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-neon/10 bg-ink/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <a href="#" className="flex items-center gap-2">
          <img src="/logo-meucorre.png" alt="MeuCorre" className="h-8 w-8 rounded-lg shadow-neon" />
          <span className="text-base font-extrabold tracking-tight text-neon text-glow-neon">
            MeuCorre
          </span>
        </a>
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={onCheckout}
            className="hidden rounded-lg px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:text-neon sm:inline-block"
          >
            Planos
          </button>
          <a
            href="/app"
            className="hidden rounded-lg px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:text-neon sm:inline-block"
          >
            App grátis
          </a>
          <button
            type="button"
            onClick={onCheckout}
            className="btn-neon inline-flex items-center gap-1.5 px-4 py-2 text-xs"
          >
            <Zap className="h-3 w-3" />
            Comprar
          </button>
          <a
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neon/30 bg-transparent px-4 py-2 text-xs font-bold text-neon transition-all hover:bg-neon/10"
          >
            Entrar
          </a>
        </nav>
      </div>
    </header>
  );
}

function PainCard({
  emoji,
  title,
  desc,
  variant = "light",
}: {
  emoji: string;
  title: string;
  desc: string;
  variant?: "light" | "dark";
}) {
  const isDark = variant === "dark";
  return (
    <div
      className={[
        "rounded-2xl border p-4 text-left transition-all",
        isDark
          ? "card-neon hover:border-orange-hot/50"
          : "border-zinc-200 bg-white hover:border-neon",
      ].join(" ")}
    >
      <div className="text-2xl">{emoji}</div>
      <p
        className={[
          "mt-2 text-sm font-bold",
          isDark ? "text-white" : "text-zinc-900",
        ].join(" ")}
      >
        {title}
      </p>
      <p
        className={[
          "mt-0.5 text-xs",
          isDark ? "text-zinc-400" : "text-zinc-600",
        ].join(" ")}
      >
        {desc}
      </p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-zinc-900">{q}</span>
        <span
          className={`text-neon transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>
      {open && (
        <div className="border-t border-zinc-100 p-4 text-sm text-zinc-600">
          {a}
        </div>
      )}
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="mx-auto w-full max-w-[280px] rounded-[2.5rem] border-[6px] border-neon/30 bg-ink p-3 shadow-neon-lg">
      <div className="rounded-[2rem] bg-ink p-4">
        {/* Notch */}
        <div className="mx-auto mb-3 h-1 w-16 rounded-full bg-neon/30" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="grid h-6 w-6 place-items-center rounded-lg bg-neon text-xs">
              ⚡
            </div>
            <span className="text-xs font-bold text-neon">MeuCorre</span>
          </div>
          <span className="rounded-full border border-neon/30 px-2 py-0.5 text-[8px] text-zinc-400">
            Hoje
          </span>
        </div>

        {/* Total card */}
        <div className="mt-3 rounded-2xl border border-neon/30 bg-gradient-to-br from-asphalt to-ink p-3">
          <p className="text-[9px] text-zinc-400">Total hoje</p>
          <p className="text-2xl font-black text-neon">R$ 184,50</p>
          <p className="text-[9px] text-zinc-500">12 corridas</p>
        </div>

        {/* Lucro líquido */}
        <div className="mt-2 rounded-2xl border border-gold/30 bg-gold/5 p-3">
          <p className="text-[9px] text-zinc-400">Lucro líquido</p>
          <p className="text-lg font-black text-gold">R$ 142,80</p>
        </div>

        {/* Mock corridas */}
        <div className="mt-3 space-y-1.5">
          {[
            { app: "iFood", val: "R$ 22,50", emoji: "🍽️" },
            { app: "99Food", val: "R$ 18,00", emoji: "🟠" },
            { app: "Lalamove", val: "R$ 45,00", emoji: "📦" },
          ].map((c, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-neon/10 bg-graphite p-2"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{c.emoji}</span>
                <span className="text-[10px] font-semibold text-zinc-200">
                  {c.app}
                </span>
              </div>
              <span className="text-[10px] font-bold text-neon">
                {c.val}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CheckoutDialog({
  open,
  onOpenChange,
  selectedPlan,
  onPlanChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  selectedPlan: "monthly" | "annual" | "lifetime";
  onPlanChange: (p: "monthly" | "annual" | "lifetime") => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Quando o usuário submete o form, monta a URL de checkout da Kiwify
  // com prefill de email/nome e redireciona.
  // O fluxo de pagamento (Pix ou cartão) acontece na Kiwify.
  // Após o pagamento, a Kiwify dispara o webhook pra /api/webhooks/kiwify
  // e redireciona o usuário pra /obrigado?order=XXX.
  const [redirecting, setRedirecting] = useState(false);

  // Preços e labels por plano
  const PLAN_INFO = {
    monthly: { price: MONTHLY_PRICE, label: "Mensal", period: "/mês" },
    annual: { price: ANNUAL_PRICE, label: "Anual", period: "/ano" },
    lifetime: { price: PLAN_PRICE, label: "Vitalício", period: "" },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;

    const productId = process.env.NEXT_PUBLIC_KIWIFY_PRODUCT_SLUG ?? "";
    if (!productId) {
      toast.error("Produto Kiwify não configurado", {
        description: "Contate o suporte.",
      });
      return;
    }

    setRedirecting(true);

    // 1. Cria sessão de checkout (cookie httpOnly com email)
    //    Necessário pra /obrigado conseguir buscar a licença depois (anti-IDOR)
    try {
      await fetch("/api/license/by-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim().toLowerCase() }),
      });
    } catch {
      // Mesmo se falhar, segue pro checkout (Kiwify cuida do resto)
    }

    // 2. Redireciona pra Kiwify
    //    NOTA: o plano selecionado (monthly/annual/lifetime) é passado como
    //    parâmetro para o webhook /api/webhooks/kiwify processar e gravar no
    //    User.subscriptionPlan. O Kiwify pode ter diferentes produtos para
    //    cada plano; aqui usamos o mesmo productId e o webhook decide com
    //    base no parâmetro plan.
    const params = new URLSearchParams({
      email: form.email,
      name: form.name,
      plan: selectedPlan,
    });
    if (form.phone) params.set("phone", form.phone);

    const checkoutUrl = `https://pay.kiwify.com.br/${productId}?${params.toString()}`;
    window.location.href = checkoutUrl;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setForm({ name: "", email: "", phone: "" });
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-md gap-0 border-neon/30 bg-white p-0 text-zinc-900">
        <DialogHeader className="border-b border-neon/10 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-neon">
            <CreditCard className="h-4 w-4" />
            Quase lá! Seus dados
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            MeuCorre PRO — {PLAN_INFO[selectedPlan].label} • pago via Pix ou
            cartão
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 px-5 py-5">
          {/* Seletor de plano dentro do dialog — permite mudar antes de pagar */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-600">Plano selecionado</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["monthly", "annual", "lifetime"] as const).map((p) => {
                const info = PLAN_INFO[p];
                const isSelected = selectedPlan === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPlanChange(p)}
                    className={`rounded-lg border-2 p-2 text-center transition-all ${
                      isSelected
                        ? "border-neon bg-neon/5"
                        : "border-zinc-200 bg-white hover:border-zinc-300"
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      {info.label}
                    </p>
                    <p className="mt-0.5 text-sm font-black text-zinc-900">
                      R$ {info.price.toFixed(2).replace(".", ",")}
                      <span className="text-[10px] font-normal text-zinc-500">
                        {info.period}
                      </span>
                    </p>
                  </button>
                );
              })}
            </div>
            {selectedPlan === "lifetime" && (
              <p className="text-[10px] text-orange-hot">
                ⚠️ Oferta promocional — pode acabar a qualquer momento
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-600">Nome completo *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="border-zinc-200 bg-white text-zinc-900 focus:border-neon"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-600">Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="border-zinc-200 bg-white text-zinc-900 focus:border-neon"
            />
            <p className="text-[10px] text-zinc-500">
              Sua licença será enviada para este email
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-600">WhatsApp (opcional)</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(11) 99999-9999"
              className="border-zinc-200 bg-white text-zinc-900 focus:border-neon"
            />
          </div>

          <div className="rounded-xl bg-neon/5 p-3 text-center">
            <p className="text-xs text-zinc-600">
              Total a pagar — oferta de lançamento
            </p>
            <div className="mt-1 flex items-end justify-center gap-2">
              <span className="text-sm font-medium text-zinc-400 line-through">
                R$ {ORIGINAL_PRICE},00
              </span>
              <span className="text-2xl font-black text-gold">
                R$ 18,90
              </span>
            </div>
            <p className="mt-1 text-[10px] text-zinc-500">
              Pagamento único • Pix ou cartão • vitalício
            </p>
          </div>

          <div className="rounded-xl bg-zinc-50 p-3 text-[11px] text-zinc-600">
            <p className="font-semibold text-zinc-700">Como funciona:</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-4">
              <li>Você será redirecionado para o checkout seguro da Kiwify</li>
              <li>Pague com Pix (aprovação em segundos) ou cartão</li>
              <li>
                Sua licença PRO é gerada <strong>automaticamente</strong> após
                o pagamento
              </li>
              <li>
                Você será redirecionado de volta e verá sua licença na tela
              </li>
            </ol>
          </div>

          <Button
            type="submit"
            disabled={!form.name || !form.email || redirecting}
            className="btn-neon w-full py-4"
          >
            {redirecting
              ? "Redirecionando..."
              : `Pagar R$ ${PLAN_INFO[selectedPlan].price.toFixed(2).replace(".", ",")} na Kiwify`}
            {!redirecting && <ArrowRight className="ml-1.5 h-4 w-4" />}
          </Button>

          <p className="flex items-center justify-center gap-1 text-[10px] text-zinc-500">
            <Lock className="h-2.5 w-2.5" />
            Pagamento processado pela Kiwify — ambiente seguro
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
