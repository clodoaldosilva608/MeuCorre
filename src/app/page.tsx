"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Bike,
  Wallet,
  BarChart3,
  Bell,
  ShieldCheck,
  Infinity as InfinityIcon,
  Star,
  TrendingUp,
  Route,
  CreditCard,
  Lock,
} from "lucide-react";

const PLAN_PRICE = 18.9; // Preço de lançamento
const ORIGINAL_PRICE = 97; // Preço normal (riscado)

const FEATURES = [
  {
    icon: Bike,
    title: "Lançamento rápido",
    desc: "Registre cada corrida em segundos com botões de valor rápido",
  },
  {
    icon: Wallet,
    title: "Controle de despesas",
    desc: "Combustível, alimentação, manutenção — saiba seu lucro real",
  },
  {
    icon: BarChart3,
    title: "Gráficos visuais",
    desc: "Veja seus ganhos por dia, por app e despesas por categoria",
  },
  {
    icon: Bell,
    title: "Captura por notificação",
    desc: "Cole a notificação do app e o MeuCorre preenche automaticamente",
  },
  {
    icon: Route,
    title: "Multi-app",
    desc: "iFood, 99Food, Lalamove e mais — cadastre outros com imagem oficial",
  },
  {
    icon: ShieldCheck,
    title: "100% offline",
    desc: "Seus dados ficam só no seu celular. Zero servidor, zero rastreio",
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
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* ===== HERO (dark) ===== */}
      <section className="relative overflow-hidden bg-zinc-950 text-zinc-100">
        {/* Glow background */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 py-16 md:py-24">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-xl shadow-lg shadow-emerald-500/25">
              ⚡
            </div>
            <span className="text-xl font-extrabold tracking-tight text-emerald-400">
              MeuCorre
            </span>
          </div>

          {/* Headline */}
          <div className="mt-10 text-center">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <Star className="h-3 w-3 fill-emerald-400" />
              Feito por entregador, para entregador
            </div>
            <h1 className="text-balance text-4xl font-black leading-tight tracking-tight md:text-6xl">
              Pare de perder dinheiro
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                sem saber
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-zinc-400 md:text-lg">
              Controle suas corridas, despesas e lucro líquido em um só lugar.
              Funciona com iFood, 99Food, Lalamove e qualquer outro app.
              100% offline.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#planos"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400"
              >
                <Zap className="h-4 w-4" />
                Quero o plano vitalício
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/app"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-bold text-zinc-100 transition-all hover:border-zinc-600 hover:bg-zinc-800"
              >
                Usar grátis primeiro
              </a>
              <a
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-transparent px-6 py-3 text-sm font-bold text-zinc-300 transition-all hover:border-emerald-500/40 hover:text-emerald-400"
              >
                Entrar
              </a>
            </div>

            {/* Trust */}
            <p className="mt-4 text-xs text-zinc-500">
              Sem cadastro. Sem cartão. Funciona offline.
            </p>
          </div>

          {/* Mockup */}
          <div className="mx-auto mt-12 max-w-xs">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ===== PROBLEMA (claro) ===== */}
      <section className="border-b border-zinc-100 bg-zinc-50 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl">
            A dor que todo entregador conhece
          </h2>
          <p className="mt-4 text-base text-zinc-600 md:text-lg">
            Você trabalha com 2, 3, às vezes 4 apps ao mesmo tempo. No fim do
            dia, precisa abrir cada um pra saber quanto ganhou. Pior: esquece de
            lançar a gasolina, o almoço, a manutenção — e o &ldquo;lucro&rdquo;
            que você achou que tinha some no fim do mês.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <PainCard
              emoji="😵‍💫"
              title="Faturamento fragmentado"
              desc="iFood aqui, 99 ali, Lalamove acolá — sem visão total"
            />
            <PainCard
              emoji="⛽"
              title="Despesas invisíveis"
              desc="Gasolina e manutenção comem o lucro sem você perceber"
            />
            <PainCard
              emoji="📉"
              title="Sem saber se valeu a pena"
              desc="Você trabalha 12h e não sabe quanto realmente ganhou"
            />
          </div>
        </div>
      </section>

      {/* ===== SOLUÇÃO / FEATURES ===== */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl">
              Tudo que você precisa,
              <br />
              <span className="text-emerald-500">numa tela só</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-zinc-600">
              O MeuCorre resolve o problema de forma simples e direta, sem
              burocracia
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-zinc-900">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-600">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== DEPOIMENTO ===== */}
      <section className="bg-zinc-950 py-16 text-zinc-100 md:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 md:p-10">
            <div className="flex gap-1 text-emerald-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-emerald-400" />
              ))}
            </div>
            <p className="mt-4 text-balance text-lg font-medium leading-relaxed md:text-xl">
              &ldquo;Antes eu achava que ganhava R$ 200 por dia. Comecei a
              lançar tudo no MeuCorre e descobri que, depois de gasolina e
              comida, sobravam R$ 110. Mudou minha forma de trabalhar.&rdquo;
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/20 text-base">
                🛵
              </div>
              <div>
                <p className="text-sm font-bold">Rafael S.</p>
                <p className="text-xs text-zinc-400">
                  Entregador multi-app • São Paulo
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PLANOS / CTA ===== */}
      <section id="planos" className="bg-zinc-50 py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
              <InfinityIcon className="h-3 w-3" />
              Pagamento único — usa para sempre
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl">
              Plano vitalício MeuCorre PRO
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-zinc-600">
              Pague uma vez, use para sempre. Sem assinatura mensal, sem
              renovação, sem surpresa.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-md">
            <div className="overflow-hidden rounded-3xl border-2 border-emerald-500 bg-white shadow-xl shadow-emerald-500/10">
              {/* Header */}
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-center text-white">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-90">
                  ⚡ MeuCorre PRO
                </p>
                <div className="mt-2 flex items-end justify-center gap-2">
                  <span className="mb-2 text-lg font-medium text-white/70 line-through">
                    R$ {ORIGINAL_PRICE},00
                  </span>
                  <span className="text-5xl font-black">
                    R$ 18,90
                  </span>
                </div>
                <p className="mt-2 inline-block rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                  🔥 Oferta de lançamento
                </p>
                <p className="mt-2 text-xs opacity-90">
                  pagamento único • vitalício • sem mensalidade
                </p>
              </div>

              {/* Features list */}
              <div className="p-6">
                <ul className="space-y-2.5">
                  {PRO_FEATURES.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="text-zinc-700">{f}</span>
                    </li>
                  ))}
                </ul>

                <CheckoutButton />

                <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
                  <Lock className="h-3 w-3" />
                  Pagamento via Pix • Ativação em até 24h
                </p>
              </div>
            </div>

            {/* Comparação */}
            <div className="mt-6 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl border border-zinc-200 bg-white p-4">
                <p className="text-xs font-semibold text-zinc-500">
                  Plano gratuito
                </p>
                <p className="mt-1 text-2xl font-black text-zinc-900">R$ 0</p>
                <p className="mt-1 text-[10px] text-zinc-500">
                  App completo + anúncios discretos
                </p>
              </div>
              <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50 p-4">
                <p className="text-xs font-semibold text-emerald-700">
                  Plano PRO vitalício
                </p>
                <p className="mt-1 text-2xl font-black text-emerald-600">
                  R$ 18,90
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-500 line-through">
                  de R$ {ORIGINAL_PRICE},00
                </p>
                <p className="mt-1 text-[10px] text-emerald-700">
                  Sem anúncios + features avançadas
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-zinc-900 md:text-3xl">
            Perguntas frequentes
          </h2>
          <div className="mt-8 space-y-3">
            <FaqItem
              q="O app funciona sem internet?"
              a="Sim, 100% offline. Seus dados ficam salvos no seu celular (IndexedDB). Você consegue lançar corridas e ver relatórios mesmo em subsolos ou áreas sem sinal."
            />
            <FaqItem
              q="Como funciona o plano vitalício?"
              a="Você paga R$ 18,90 (preço de lançamento, depois volta pra R$ 97) uma única vez via Pix ou cartão na Kiwify. Assim que o pagamento é aprovado (em segundos no Pix), sua licença PRO é gerada automaticamente e você já pode ativar no app. Pronto — PRO para sempre, sem mais cobranças."
            />
            <FaqItem
              q="E se eu trocar de celular?"
              a="Sua licença é vinculada ao seu email. É só ativar a mesma chave no novo aparelho. O backup em nuvem (feature PRO) sincroniza seus dados entre dispositivos."
            />
            <FaqItem
              q="Meus dados são vendidos?"
              a="Nunca. O MeuCorre é Local-First: nenhum dado de corrida sai do seu celular. Nem mesmo o admin consegue ver seus ganhos. Só armazenamos sua licença."
            />
            <FaqItem
              q="Tem como testar antes de pagar?"
              a="Sim! O app gratuito tem todas as funcionalidades básicas (corridas, despesas, gráficos). Você só paga se quiser remover anúncios e ter as features PRO."
            />
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-zinc-950 py-10 text-zinc-400">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm">
                ⚡
              </div>
              <span className="font-bold text-emerald-400">MeuCorre</span>
            </div>
            <nav className="flex items-center gap-5 text-xs">
              <a href="/app" className="hover:text-zinc-200">
                Abrir app
              </a>
              <a href="#planos" className="hover:text-zinc-200">
                Planos
              </a>
              <a href="/admin/login" className="hover:text-zinc-200">
                Admin
              </a>
            </nav>
          </div>

          <div className="mt-6 border-t border-zinc-800 pt-6 text-center">
            <p className="text-sm font-semibold text-zinc-300">
              Criado e desenvolvido por{" "}
              <span className="font-bold text-emerald-400">
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
    </div>
  );
}

// ===== Subcomponentes =====

function PainCard({
  emoji,
  title,
  desc,
}: {
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-left">
      <div className="text-2xl">{emoji}</div>
      <p className="mt-2 text-sm font-bold text-zinc-900">{title}</p>
      <p className="mt-0.5 text-xs text-zinc-600">{desc}</p>
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
      >
        <span className="text-sm font-semibold text-zinc-900">{q}</span>
        <span
          className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
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
    <div className="mx-auto w-full max-w-[280px] rounded-[2.5rem] border-[6px] border-zinc-800 bg-zinc-950 p-3 shadow-2xl">
      <div className="rounded-[2rem] bg-zinc-950 p-4">
        {/* Notch */}
        <div className="mx-auto mb-3 h-1 w-16 rounded-full bg-zinc-800" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs">
              ⚡
            </div>
            <span className="text-xs font-bold text-emerald-400">MeuCorre</span>
          </div>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[8px] text-zinc-400">
            Hoje
          </span>
        </div>

        {/* Total card */}
        <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 to-zinc-900 p-3">
          <p className="text-[9px] text-zinc-400">Total hoje</p>
          <p className="text-2xl font-black text-emerald-400">R$ 184,50</p>
          <p className="text-[9px] text-zinc-500">12 corridas</p>
        </div>

        {/* Lucro líquido */}
        <div className="mt-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3">
          <p className="text-[9px] text-zinc-400">Lucro líquido</p>
          <p className="text-lg font-black text-emerald-400">R$ 142,80</p>
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
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-2"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{c.emoji}</span>
                <span className="text-[10px] font-semibold text-zinc-200">
                  {c.app}
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400">
                {c.val}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CheckoutButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="mt-6 w-full bg-emerald-500 py-6 text-base font-bold text-zinc-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400"
      >
        <Zap className="mr-2 h-4 w-4" />
        Comprar plano vitalício
      </Button>
      <CheckoutDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function CheckoutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
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
    const params = new URLSearchParams({
      email: form.email,
      name: form.name,
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
      <DialogContent className="max-w-md gap-0 border-zinc-200 bg-white p-0 text-zinc-900">
        <DialogHeader className="border-b border-zinc-100 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-600">
            <CreditCard className="h-4 w-4" />
            Quase lá! Seus dados
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Plano vitalício MeuCorre PRO — R$ 18,90 (oferta de lançamento, depois R$ 97)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 px-5 py-5">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-600">Nome completo *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="border-zinc-200 bg-white text-zinc-900 focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-600">Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="border-zinc-200 bg-white text-zinc-900 focus:border-emerald-500"
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
              className="border-zinc-200 bg-white text-zinc-900 focus:border-emerald-500"
            />
          </div>

          <div className="rounded-xl bg-emerald-50 p-3 text-center">
            <p className="text-xs text-zinc-600">
              Total a pagar — oferta de lançamento
            </p>
            <div className="mt-1 flex items-end justify-center gap-2">
              <span className="text-sm font-medium text-zinc-400 line-through">
                R$ {ORIGINAL_PRICE},00
              </span>
              <span className="text-2xl font-black text-emerald-600">
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
            className="w-full bg-emerald-500 py-4 font-bold text-zinc-950 hover:bg-emerald-400"
          >
            {redirecting
              ? "Redirecionando..."
              : `Pagar R$ 18,90 na Kiwify`}
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
