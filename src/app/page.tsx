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
import { TestimonialsCarousel } from "@/components/meucorre/testimonials-carousel";
import { FounderMessage } from "@/components/meucorre/founder-message";
import { YouTubeSection } from "@/components/meucorre/youtube-section";
import { SponsoredBrandsCarousel } from "@/components/meucorre/sponsored-brands-carousel";
import { AnimatedCounter } from "@/components/meucorre/animated-counter";
import { StickyCTA } from "@/components/meucorre/sticky-cta";
import { ReferenceLanding } from "@/components/meucorre/reference-landing";
import { DownloadButton } from "@/components/meucorre/download-button";
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
  BookOpen,
  GraduationCap,
  ExternalLink,
  Sparkles,
} from "lucide-react";

// Ícones SVG das marcas WhatsApp e Telegram (lucide não tem brand icons)
function WhatsAppIcon({ className = "", size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

function TelegramIcon({ className = "", size = 24 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

// Preços centralizados em src/lib/commercial-cta.ts (fonte única de verdade)
import {
  PLAN_PRICE,
  ANNUAL_PRICE,
  MONTHLY_PRICE,
  ORIGINAL_PRICE,
  getFreeDownloadHref,
  buildKiwifyCheckoutUrl,
  extractUtmParams,
  getKiwifySlugForPlan,
  SUPPORT_EMAIL,
} from "@/lib/commercial-cta";

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
    setSelectedPlan("annual");
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

  // ===== Detecta se usuário está autenticado =====
  // Se sim, "Baixar grátis" leva direto pro /app (não força quiz/cadastro)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.id) setIsAuthenticated(true);
      })
      .catch(() => {
        // Não autenticado ou erro — mantém false
      });
  }, []);

  return (
    <div className="landing-page flex min-h-screen flex-col bg-ink text-white">
      <ReferenceLanding onCheckout={openCheckout} isAuthenticated={isAuthenticated} />
      <section className="landing-legacy-content">
        <h2>Mais recursos do produto</h2>
        <div className="landing-legacy-inner">
        <Header onCheckout={openCheckout} isAuthenticated={isAuthenticated} />

      {/* ===== 1. HERO — gradient mesh animado + badge flutuante + contador ===== */}
      <section className="relative overflow-hidden" style={{ backgroundColor: "#0D0F0E", backgroundImage: "radial-gradient(ellipse at top, rgba(22, 101, 52, 0.12), transparent 60%)" }}>
        {/* Gradient mesh animado — blobs que se movem suavemente */}
        <div className="pointer-events-none absolute inset-0">
          <div className="mesh-blob-1 absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-neon/15 blur-[100px]" />
          <div className="mesh-blob-2 absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[100px]" />
          <div className="mesh-blob-3 absolute left-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-[80px]" />
          {/* Grade sutil de fundo */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #4ade80 1px, transparent 1px), linear-gradient(to bottom, #4ade80 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Badge flutuante "Grátis" */}
        <div className="float-badge pointer-events-none absolute right-4 top-24 z-10 hidden rotate-[-3deg] sm:block">
          <div className="flex items-center gap-1.5 rounded-full border-2 border-gold/50 bg-gradient-to-br from-amber-500/20 to-orange-500/10 px-4 py-2 backdrop-blur-md">
            <span className="text-lg font-black text-gold">100%</span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-200">Grátis</span>
          </div>
        </div>

        {/* Conteúdo do hero — mobile: centralizado, desktop: 2 colunas (texto + phone) */}
        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col items-center justify-center px-4 py-16 text-center md:py-24 lg:flex-row lg:items-center lg:gap-12 lg:text-left">
          {/* Coluna esquerda: copy + CTAs */}
          <div className="flex-1 lg:max-w-xl">
          {/* Logo / brand */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="show"
            className="flex items-center justify-center gap-2 lg:justify-start"
          >
            <img src="/logo-meucorre.png" alt="MeuCorre" className="h-10 w-10 rounded-xl shadow-neon" />
            <span className="text-xl font-bold tracking-tight text-neon">
              MeuCorre
            </span>
          </motion.div>

          {/* Headline */}
          <div className="mt-8">
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
              className="text-balance text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              <span className="block text-white">
                Pare de perder
              </span>
              <span className="block text-neon">
                dinheiro
              </span>
              <span className="block text-white">
                sem saber!
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mx-auto mt-5 max-w-xl text-pretty text-sm font-medium text-zinc-400 md:text-base lg:mx-0"
            >
              Controle corridas, despesas e lucro real em um só lugar.
              Funciona com iFood, 99Food, Lalamove e qualquer outro app.
            </motion.p>

            {/* CTAs: Baixar grátis (primário) + Quero PRO (outline) */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start"
            >
              <DownloadButton
                className="btn-neon inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm sm:w-auto md:text-base"
                ctaOrigin="hero_free_download"
              >
                Baixar grátis
              </DownloadButton>
              <button
                type="button"
                onClick={openCheckout}
                className="btn-neon-outline inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm sm:w-auto md:text-base"
                data-cta-origin="hero_offer"
              >
                <CreditCard className="h-4 w-4" />
                Quero PRO
              </button>
              <a
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:border-neon/50 hover:text-neon sm:w-auto md:text-base"
                data-cta-origin="hero_existing_user"
                aria-label="Já sou do Corre — entrar na minha conta"
              >
                Já sou do Corre
              </a>
            </motion.div>

            {/* Trust badges — glass-card style */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-300 md:text-xs"
            >
              <span className="rounded-full border border-white/8 bg-white/3 px-3 py-1 backdrop-blur-md">
                100% offline
              </span>
              <span className="rounded-full border border-white/8 bg-white/3 px-3 py-1 backdrop-blur-md">
                App grátis
              </span>
              <span className="rounded-full border border-white/8 bg-white/3 px-3 py-1 backdrop-blur-md">
                Sem mensalidade
              </span>
              <span className="rounded-full border border-white/8 bg-white/3 px-3 py-1 backdrop-blur-md">
                Sem cadastro
              </span>
            </motion.div>

            {/* Contador animado — "entregadores usando MeuCorre" */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="mt-6 flex items-center gap-2 text-sm text-zinc-400"
            >
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-neon" />
              <span>
                <AnimatedCounter value={2847} className="counter-glow text-lg font-black text-neon" /> entregadores
                usando MeuCorre agora
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

          {/* Coluna direita: Phone mockup (desktop apenas) */}
          <div className="hidden flex-1 justify-center lg:flex">
            <div className="relative">
              {/* Glow atrás do phone */}
              <div className="absolute inset-0 -z-10 rounded-[40px] bg-emerald-500/10 blur-3xl" />
              {/* Phone frame */}
              <div className="relative h-[600px] w-[300px] overflow-hidden rounded-[40px] border-[8px] border-zinc-800 bg-[#0A0A0A] shadow-2xl">
                {/* Notch */}
                <div className="absolute left-1/2 top-0 z-20 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-zinc-800" />
                {/* Status bar */}
                <div className="flex items-center justify-between px-6 pt-3 text-[10px] text-zinc-500">
                  <span>9:41</span>
                  <span>●●●●</span>
                </div>
                {/* App content mockup */}
                <div className="px-4 py-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">⚡</span>
                      <span className="text-sm font-bold text-emerald-400">MeuCorre</span>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[8px] font-medium text-emerald-400">OFFLINE</span>
                  </div>

                  {/* Hero card: lucro líquido */}
                  <div className="mt-3 rounded-2xl border border-emerald-500/15 bg-white/3 p-4 backdrop-blur-md">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400">Lucro líquido</p>
                    <p className="mt-1 text-3xl font-black text-emerald-400" style={{fontVariantNumeric:'tabular-nums'}}>R$ 116,64</p>
                    <div className="mt-2 flex gap-3 text-[9px]">
                      <span className="text-emerald-400">↑ R$ 216,80</span>
                      <span className="text-red-400">↓ R$ 100,16</span>
                    </div>
                  </div>

                  {/* KPI grid */}
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-white/8 bg-white/3 p-2 backdrop-blur-md">
                      <p className="text-[8px] text-zinc-400">Faturamento</p>
                      <p className="text-sm font-bold text-white" style={{fontVariantNumeric:'tabular-nums'}}>R$ 216</p>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/3 p-2 backdrop-blur-md">
                      <p className="text-[8px] text-zinc-400">Corridas</p>
                      <p className="text-sm font-bold text-white">12</p>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="mt-3 flex gap-1">
                    <span className="rounded-lg bg-emerald-500 px-3 py-1 text-[8px] font-bold text-black">Hoje</span>
                    <span className="rounded-lg border border-white/8 px-3 py-1 text-[8px] text-zinc-400">Semana</span>
                    <span className="rounded-lg border border-white/8 px-3 py-1 text-[8px] text-zinc-400">Mês</span>
                    <span className="rounded-lg border border-white/8 px-3 py-1 text-[8px] text-zinc-400">Tudo</span>
                  </div>

                  {/* Lista de corridas */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between rounded-lg border border-white/8 bg-white/3 p-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">🍔</span>
                        <div>
                          <p className="text-[9px] font-medium text-white">iFood</p>
                          <p className="text-[7px] text-zinc-500">14:32</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400">+R$ 12,50</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-white/8 bg-white/3 p-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">📦</span>
                        <div>
                          <p className="text-[9px] font-medium text-white">99Food</p>
                          <p className="text-[7px] text-zinc-500">15:08</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400">+R$ 8,00</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-white/8 bg-white/3 p-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">⛽</span>
                        <div>
                          <p className="text-[9px] font-medium text-red-400">Despesa</p>
                          <p className="text-[7px] text-zinc-500">16:00</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-red-400">-R$ 25,00</span>
                    </div>
                  </div>
                </div>

                {/* Bottom nav */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around border-t border-white/6 bg-[#0A0A0A]/95 py-3 backdrop-blur-xl">
                  <span className="text-[9px]">📊</span>
                  <span className="text-[9px]">🛵</span>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-sm text-black">+</span>
                  <span className="text-[9px]">💸</span>
                  <span className="text-[9px]">📈</span>
                </div>
              </div>
            </div>
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

      {/* ===== 3. A SOLUÇÃO (dark, glass cards) ===== */}
      <section className="bg-ink py-16 text-white md:py-24">
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
            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              MeuCorre junta tudo
              <br />
              <span className="text-neon">numa tela só</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400 md:text-lg">
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
                className="feature-card rounded-2xl border border-white/8 bg-white/3 p-5 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-white/5"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-2xl">
                  {f.emoji}
                </div>
                <h3 className="mt-3 text-sm font-bold text-white">
                  {f.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== 4. VEJA COMO FUNCIONA (dark, iPhone showcase) ===== */}
      <section className="relative overflow-hidden border-y border-white/8 bg-ink py-16 text-white md:py-24">
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
            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Não é promessa. É tela.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400 md:text-lg">
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
                className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/3 p-4 backdrop-blur-md"
              >
                <span className="text-2xl">{f.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-white">{f.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">{f.desc}</p>
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

      {/* ===== CARROSSEL DE DEPOIMENTOS (direita → esquerda) ===== */}
      <section className="bg-ink py-16 text-white md:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mb-8 text-center"
          >
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              Quem usa, recomenda
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Histórias de quem corre com o MeuCorre
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-zinc-400">
              22 entregadores de todo o Brasil compartilharam como o app mudou
              a forma de trabalhar e de cuidar do dinheiro.
            </p>
          </motion.div>
        </div>

        {/* Carrossel rolando da direita para esquerda */}
        <div className="mx-auto max-w-5xl">
          <TestimonialsCarousel />
        </div>
      </section>

      {/* ===== BLOG CARROSSEL (direita → esquerda) ===== */}
      <section className="bg-ink py-16 text-white md:py-20">
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
            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Dicas que aumentam seu lucro
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-zinc-400">
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
            className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-500 bg-emerald-500/100 px-6 py-3 text-sm font-bold text-black transition-all hover:bg-emerald-500/10"
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
      <section id="planos" className="bg-ink py-16 text-white md:py-24">
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
            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              MeuCorre PRO — você escolhe como pagar
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-zinc-400">
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
                <p className="mt-1 text-xs text-zinc-400">
                  <strong className="text-emerald-600">14 dias de trial grátis</strong> com
                  acesso total ao app. Depois: 5 lançamentos/dia grátis para sempre.
                </p>
              </div>
              <a
                href="/quiz"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border-2 border-emerald-500 bg-emerald-500/100 px-6 py-3 text-sm font-bold text-black transition-all hover:bg-emerald-500/10"
                data-cta-origin="plans_comecar_gratis"
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
            className="mx-auto mt-6 grid max-w-5xl gap-4 md:grid-cols-3"
          >
            {/* MENSAL */}
            <motion.div
              variants={itemUp}
              className="flex flex-col rounded-2xl border border-white/8 bg-white/3/3 p-5 backdrop-blur-md"
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
              <ul className="mt-4 space-y-2 text-xs text-zinc-300">
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
                className="mt-5 w-full rounded-xl border-2 border-white/8 bg-white/3 py-3 text-sm font-bold text-white transition-all hover:border-neon hover:text-neon"
              >
                Assinar mensal
              </button>
            </motion.div>

            {/* ANUAL — destaque "mais popular" */}
            <motion.div
              variants={itemUp}
              className="relative flex flex-col rounded-2xl border-2 border-neon bg-white/3 p-5 backdrop-blur-md shadow-neon"
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
              <ul className="mt-4 space-y-2 text-xs text-zinc-300">
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
                className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-white/8 bg-white/3 p-5 text-zinc-500 backdrop-blur-md"
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
      <section className="border-t border-white/8 bg-ink py-16 text-white md:py-20">
        <div className="mx-auto max-w-2xl px-4">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center text-2xl font-extrabold tracking-tight text-white md:text-3xl"
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
      <section className="bg-ink py-12 text-white md:py-16">
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
            <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
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

      {/* ===== 7.6 SEÇÃO YOUTUBE — vídeos do canal @meucorre-z4j ===== */}
      <YouTubeSection />

      {/* ===== 7.7 SEÇÃO MARCAS PATROCINADAS — carrossel + CTA R$ 16,90/mês ===== */}
      <SponsoredBrandsCarousel />

      {/* ===== 7.8 SEÇÃO PRODUTOS DIGITAIS — E-books e Curso Premium ===== */}
      <section className="bg-ink py-16 text-white md:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center"
          >
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-medium text-neon">
              <Sparkles className="h-3 w-3" />
              Materiais exclusivos para entregadores
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Conhecimento que <span className="text-neon">multiplica seu lucro</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-500 md:text-lg">
              E-books e curso premium criados por quem é da entrega, para quem é da entrega.
              Conteúdo prático, direto ao ponto, sem enrolação.
            </p>
          </motion.div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Produto 1: E-book 10 Erros (R$ 27) */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="flex flex-col rounded-2xl border border-white/8 bg-white/3 p-6 backdrop-blur-md transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/10">
                  <BookOpen className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-400">E-book de entrada</p>
                  <p className="text-sm font-bold text-zinc-900">20+ páginas</p>
                </div>
              </div>
              <h3 className="text-lg font-bold text-zinc-900">10 Erros que Entregadores Cometem</h3>
              <p className="mt-2 text-sm text-zinc-500">
                Os 10 erros mais comuns que fazem você perder dinheiro todos os dias — e como evitar cada um.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-zinc-400">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Como calcular o lucro real</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Depreciação da moto explicada</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Plano de ação de 7 dias</li>
              </ul>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-3xl font-black text-zinc-900">R$ 27</span>
                <span className="text-sm text-zinc-400">pagamento único</span>
              </div>
              <a
                href="https://pay.kiwify.com.br/D7AebQz"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
              >
                Garanta sua oferta
                <ExternalLink className="h-4 w-4" />
              </a>
              <p className="mt-2 text-center text-[10px] text-zinc-400">
                Entrega imediata · Pix ou cartão · 50% comissão para afiliados
              </p>
            </motion.div>

            {/* Produto 2: E-book Gestão Financeira (R$ 97) */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="flex flex-col rounded-2xl border border-white/8 bg-white/3 p-6 backdrop-blur-md transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-500/10">
                  <BookOpen className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-400">Guia completo</p>
                  <p className="text-sm font-bold text-zinc-900">60+ páginas</p>
                </div>
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Gestão Financeira para Entregadores</h3>
              <p className="mt-2 text-sm text-zinc-500">
                O guia definitivo: do cálculo de custos ao IR, do MEI aos investimentos. 25 capítulos em 5 partes.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-zinc-400">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-500" /> Custos fixos vs variáveis</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-500" /> MEI, DAS, IR passo a passo</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-500" /> Plano de 90 dias para estabilizar</li>
              </ul>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-3xl font-black text-zinc-900">R$ 97</span>
                <span className="text-sm text-zinc-400">pagamento único</span>
              </div>
              <a
                href="https://pay.kiwify.com.br/qUmn5jr"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-600"
              >
                Garanta sua oferta
                <ExternalLink className="h-4 w-4" />
              </a>
              <p className="mt-2 text-center text-[10px] text-zinc-400">
                Entrega imediata · Pix ou cartão · 30% comissão para afiliados
              </p>
            </motion.div>

            {/* Produto 3: Curso Premium (R$ 247) */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="relative flex flex-col rounded-2xl border-2 border-emerald-500 bg-gradient-to-b from-emerald-50 to-white p-6 shadow-lg"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  <Star className="h-3 w-3 fill-white" />
                  Mais completo
                </span>
              </div>
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/10">
                  <GraduationCap className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-400">Curso premium</p>
                  <p className="text-sm font-bold text-zinc-900">15 módulos · 150 capítulos</p>
                </div>
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Curso Premium: Negócio de Entregador</h3>
              <p className="mt-2 text-sm text-zinc-500">
                De hobby a profissão. Gestão financeira avançada, frota, investimentos, MEI e escala do negócio.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-zinc-400">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> 15 módulos liberados semanalmente</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Acesso vitalício + atualizações</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-500" /> Plano de 10 anos: entregador → empresário</li>
              </ul>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-3xl font-black text-zinc-900">R$ 247</span>
                <span className="text-sm text-zinc-400">pagamento único</span>
              </div>
              <a
                href="https://pay.kiwify.com.br/Ku7IAdQ"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
              >
                Garanta sua oferta
                <ExternalLink className="h-4 w-4" />
              </a>
              <p className="mt-2 text-center text-[10px] text-zinc-400">
                Entrega imediata (Módulo 1) · Pix ou cartão · 30% comissão para afiliados
              </p>
            </motion.div>
          </div>

          {/* Call-to-action para afiliados */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center"
          >
            <p className="text-sm text-zinc-400">
              <strong className="text-zinc-900">Quer divulgar e ganhar comissões?</strong>{" "}
              Participe do programa de afiliados MeuCorre e ganhe até 50% por venda.
            </p>
            <a
              href="https://app.kiwify.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-500 hover:underline"
            >
              Quero ser afiliado
              <ArrowRight className="h-4 w-4" />
            </a>
            <p className="mt-2 text-[10px] text-zinc-400">
              Acesse sua conta Kiwify → aba "Afiliados" → busque por "MeuCorre"
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== 8. CTA FINAL grande ===== */}
      <section className="relative overflow-hidden bg-ink py-20 text-center text-white md:py-28">
        {/* Glow — mais sutil e premium */}
        <div className="pointer-events-none absolute -bottom-32 left-1/2 h-72 w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

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
      <div className="bg-ink py-4">
        <div className="mx-auto max-w-3xl px-4">
          <AdSense
            slot="3333333333"
            format="horizontal"
            className="min-h-[90px] rounded-lg"
          />
        </div>
      </div>

      {/* ===== MENSAGEM DO FUNDADOR + COMENTÁRIOS + ROADMAP ===== */}
      <FounderMessage />

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

            {/* Coluna 4 — Redes sociais (link rápido) */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Siga-nos
              </p>
              <ul className="mt-4 space-y-2 text-xs">
                <li><a href="https://youtube.com/@meucorre-z4j" target="_blank" rel="noopener noreferrer" className="hover:text-neon">YouTube</a></li>
                <li><a href="https://www.instagram.com/meucorr" target="_blank" rel="noopener noreferrer" className="hover:text-neon">Instagram</a></li>
                <li><a href="https://www.tiktok.com/@meucorr" target="_blank" rel="noopener noreferrer" className="hover:text-neon">TikTok</a></li>
                <li><a href="https://www.facebook.com/share/1QqGSn22NC/" target="_blank" rel="noopener noreferrer" className="hover:text-neon">Facebook</a></li>
              </ul>
            </div>
          </div>

          {/* ===== Cards de grupos WhatsApp + Telegram (funil de captação) ===== */}
          <div className="mt-8 border-t border-zinc-800 pt-8">
            <p className="text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
              Entre nos nossos grupos
            </p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              {/* Card Grupo WhatsApp */}
              <a
                href="https://chat.whatsapp.com/FOH9IYGwee19NIYOSEVe3z?s=cl&p=a&ilr=0"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-4 transition-all hover:border-emerald-500/60 hover:bg-emerald-500/100/10 active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-transform group-hover:scale-110">
                  <WhatsAppIcon size={28} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-emerald-400">Grupo WhatsApp</p>
                  <p className="text-xs text-zinc-400">Dicas, promoções e suporte</p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-emerald-400 transition-transform group-hover:translate-x-1" />
              </a>

              {/* Card Grupo Telegram */}
              <a
                href="https://t.me/+64wV1Cpx9BA4OWQx"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border-2 border-sky-500/30 bg-sky-500/5 p-4 transition-all hover:border-sky-500/60 hover:bg-sky-500/10 active:scale-[0.98]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow-lg shadow-sky-500/30 transition-transform group-hover:scale-110">
                  <TelegramIcon size={28} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-sky-400">Grupo Telegram</p>
                  <p className="text-xs text-zinc-400">Novidades e atualizações</p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-sky-400 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* ===== Capacetes F1 4D — redes sociais (largura total) ===== */}
          <div className="mt-8 border-t border-zinc-800 pt-8">
            <p className="text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
              Siga o MeuCorre nas redes
            </p>
            <div className="f1-helmets-row mt-5">
              {SOCIAL_LINKS.map(({ name, href, helmetImage, glowColor, brandColor, label }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="f1-helmet-card"
                  style={{ ["--helmet-glow" as string]: glowColor }}
                  title={label}
                  aria-label={name}
                >
                  <div className="f1-helmet-img-wrap">
                    <img
                      src={helmetImage}
                      alt={label}
                      loading="lazy"
                      draggable={false}
                    />
                  </div>
                  <span
                    className="f1-helmet-label"
                    style={{ color: brandColor }}
                  >
                    {name}
                  </span>
                </a>
              ))}
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

      {/* Dialog de checkout */}
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        selectedPlan={selectedPlan}
        onPlanChange={setSelectedPlan}
      />

      {/* Sticky CTA no mobile — aparece ao rolar */}
      <StickyCTA href={getFreeDownloadHref(isAuthenticated)} />
        </div>
      </section>
    </div>
  );
}

// ===== Subcomponentes =====

function Header({ onCheckout, isAuthenticated }: { onCheckout: () => void; isAuthenticated: boolean }) {
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
            data-cta-origin="header_planos"
          >
            Planos
          </button>
          <a
            href="/quiz"
            className="hidden rounded-lg px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:text-neon sm:inline-block"
            data-cta-origin="header_app_gratis"
          >
            App grátis
          </a>
          <button
            type="button"
            onClick={onCheckout}
            className="btn-neon inline-flex items-center gap-1.5 px-4 py-2 text-xs"
            data-cta-origin="header_comprar"
          >
            <Zap className="h-3 w-3" />
            Comprar
          </button>
          <a
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neon/30 bg-transparent px-4 py-2 text-xs font-bold text-neon transition-all hover:bg-neon/10"
            data-cta-origin="header_existing_user"
            aria-label="Já sou do Corre — entrar na minha conta"
          >
            Já sou do Corre
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
          : "border-white/8 bg-white/3 hover:border-neon",
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
          isDark ? "text-zinc-400" : "text-zinc-400",
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
    <div className="rounded-xl border border-white/8 bg-white/3">
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
        <div className="border-t border-zinc-100 p-4 text-sm text-zinc-400">
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

    // Usa slug específico do plano selecionado (vitalício, mensal ou anual)
    const slug = getKiwifySlugForPlan(selectedPlan);
    if (!slug) {
      toast.error("Produto Kiwify não configurado", {
        description: `Contate o suporte: ${SUPPORT_EMAIL}`,
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

    // 2. Redireciona pra Kiwify com UTMs e ref preservados
    //    NOTA: o plano selecionado (monthly/annual/lifetime) é passado como
    //    parâmetro para o webhook /api/webhooks/kiwify processar e gravar no
    //    User.subscriptionPlan. O Kiwify pode ter diferentes produtos para
    //    cada plano; aqui usamos o mesmo productId e o webhook decide com
    //    base no parâmetro plan.
    //
    //    UTMs e referral code são propagados via query string (acessível e rápido).
    //    O campo `sck` do Kiwify captura o referral code no webhook.
    let utmParams: Record<string, string> = {};
    let referralCode: string | undefined;
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      utmParams = extractUtmParams(searchParams);
      referralCode = localStorage.getItem("meucorre_referral_code") ?? undefined;
    }

    const checkoutUrl = buildKiwifyCheckoutUrl({
      slug,
      email: form.email,
      name: form.name,
      phone: form.phone || undefined,
      plan: selectedPlan,
      utmParams: Object.keys(utmParams).length > 0 ? utmParams : undefined,
      referralCode,
    });

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
      <DialogContent className="max-w-md gap-0 border-neon/30 bg-zinc-900 p-0 text-white">
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
            <Label className="text-xs text-zinc-400">Plano selecionado</Label>
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
                        : "border-white/8 bg-white/3 hover:border-zinc-300"
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
            <Label className="text-xs text-zinc-400">Nome completo *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="border-white/8 bg-white/3 text-zinc-900 focus:border-neon"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="border-white/8 bg-white/3 text-zinc-900 focus:border-neon"
            />
            <p className="text-[10px] text-zinc-500">
              Sua licença será enviada para este email
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">WhatsApp (opcional)</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(11) 99999-9999"
              className="border-white/8 bg-white/3 text-zinc-900 focus:border-neon"
            />
          </div>

          <div className="rounded-xl bg-neon/5 p-3 text-center">
            <p className="text-xs text-zinc-400">
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

          <div className="rounded-xl bg-zinc-50 p-3 text-[11px] text-zinc-400">
            <p className="font-semibold text-zinc-300">Como funciona:</p>
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
