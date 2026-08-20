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
import { LandingFunctionalSections } from "@/components/meucorre/landing-functional-sections";
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
      <LandingFunctionalSections />
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        selectedPlan={selectedPlan}
        onPlanChange={setSelectedPlan}
      />
      <StickyCTA href={getFreeDownloadHref(isAuthenticated)} />
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
