"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDownToLine, Check, CloudOff, Clock3, Gauge, Grid2X2, LineChart, Puzzle, ShieldCheck, WalletCards, Zap } from "lucide-react";
import { DownloadButton } from "@/components/meucorre/download-button";
import { PLAN_PRICE, MONTHLY_PRICE } from "@/lib/commercial-cta";

const brl = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

interface ReferenceLandingProps {
  onCheckout: (plan?: "monthly" | "annual" | "lifetime") => void;
  isAuthenticated: boolean;
}

const painCards = [
  [Puzzle, "Ganhos fragmentados", "Cada app mostra uma coisa diferente. Fica difícil saber quanto você realmente fez."],
  [LineChart, "Despesas invisíveis", "Combustível, manutenção, taxas e comida diminuem o lucro sem aviso."],
  [Clock3, "Tempo perdido com planilhas", "Anotar tudo manualmente dá trabalho e ainda deixa espaço para erro."],
  [ShieldCheck, "Sem clareza, sem decisão", "Sem números reais fica impossível planejar e crescer de verdade."],
] as const;

const solutionCards = [
  [Zap, "Lançamento rápido", "Registre corridas, ganhos e despesas em segundos."],
  [WalletCards, "Despesas na medida certa", "Categorize e visualize seus gastos com clareza."],
  [LineChart, "Gráficos que falam", "Veja resultados por dia, semana, mês e app."],
  [Grid2X2, "Multi-app sem complicação", "iFood, 99Food, Lalamove e qualquer outro app."],
  [CloudOff, "100% offline de verdade", "Use no modo offline e sincronize quando conectar."],
] as const;

const testimonials = [
  ["Rafael, São Paulo - SP", "Finalmente consigo ver quanto sobra no fim do dia. O MeuCorre mudou meu jogo!"],
  ["Juliana, Curitiba - PR", "Simples, direto e completo. Uso todo dia e não fico mais no achismo."],
  ["Diego, Belo Horizonte - MG", "Os gráficos são top! Agora sei exatamente onde posso melhorar."],
];

export function ReferenceLanding({ onCheckout, isAuthenticated }: ReferenceLandingProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const todayLabel = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" }).format(new Date());
  return (
    <section className="reference-landing" aria-label="Landing page MeuCorre">
      <div className="reference-landing-inner">
        <header className="reference-landing-header">
          <div className="reference-brand-lockup"><img src="/logo-meucorre.png" alt="" className="reference-brand-logo" /><span>Meu<strong>Corre</strong></span></div>
          <div className="flex items-center gap-2">
            <button type="button" className="reference-menu" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>☰</button>
            <DownloadButton className="reference-download">Baixar grátis</DownloadButton>
          </div>
        </header>
        {menuOpen && <nav className="reference-landing-menu" aria-label="Navegação principal"><Link href="#planos" onClick={() => setMenuOpen(false)}>Planos</Link><Link href="/blog" onClick={() => setMenuOpen(false)}>Blog</Link><Link href="/faq" onClick={() => setMenuOpen(false)}>FAQ</Link><Link href="/sobre" onClick={() => setMenuOpen(false)}>Sobre</Link><Link href="/contato" onClick={() => setMenuOpen(false)}>Contato</Link><Link href={isAuthenticated ? "/app" : "/login"} onClick={() => setMenuOpen(false)}>{isAuthenticated ? "Abrir app" : "Já sou do Corre"}</Link><button type="button" onClick={() => { setMenuOpen(false); onCheckout("monthly"); }}>Quero PRO</button></nav>}

        <div className="reference-landing-hero">
          <div className="reference-hero-copy">
            <span className="reference-badge">★ Feito por entregador, para entregador</span>
            <h1>PARE DE PERDER<br /><strong>DINHEIRO</strong><br />SEM SABER!</h1>
            <p>Controle corridas, despesas e lucro real em um só lugar. Funciona com iFood, 99Food, Lalamove e qualquer outro app.</p>
            <div className="reference-hero-actions">
              <Link href={isAuthenticated ? "/app" : "/quiz"} className="reference-primary-cta"><ArrowDownToLine className="h-4 w-4" /> Baixar grátis</Link>
              <button type="button" onClick={() => onCheckout("monthly")} className="reference-secondary-cta">Quero PRO</button>
            </div>
            <div className="reference-trust-row"><span>♧ 100% offline</span><span>▣ app grátis</span><span>◉ sem mensalidade</span></div>
          </div>
          <div className="reference-hero-phone" aria-label="Prévia do aplicativo MeuCorre">
            <div className="reference-phone-notch" />
            <div className="reference-phone-screen">
              <div className="flex items-center justify-between"><strong>⚡ Meu<span className="text-emerald-400">Corre</span></strong><span className="text-[9px] text-emerald-400">● Offline</span></div>
              <div className="reference-phone-profit"><span>Lucro líquido</span><strong>—</strong><small>Hoje, {todayLabel}</small></div>
              <div className="reference-phone-kpis"><span>Faturamento<br /><b>—</b></span><span>Corridas<br /><b>—</b></span><span>Distância<br /><b>—</b></span></div>
              <div className="reference-phone-tabs"><b>Hoje</b><span>Semana</span><span>Mês</span><span>Tudo</span></div>
              <div className="reference-phone-row">🏁 Corre do dia <b>Online</b></div>
              <div className="reference-phone-row">🎯 Metas <b>Confira no app</b></div>
              <div className="reference-phone-nav"><span>Corridas</span><span>Despesas</span><span className="reference-phone-plus">+</span><span>Ofertas</span><span>Gráficos</span></div>
            </div>
          </div>
        </div>

        <section className="reference-landing-section"><h2>A realidade de quem corre</h2><div className="reference-card-grid four">{painCards.map(([Icon, title, text]) => <article className="reference-card" key={title}><Icon /><h3>{title}</h3><p>{text}</p></article>)}</div></section>
        <section className="reference-landing-section"><h2><strong>MeuCorre</strong> junta tudo numa tela só</h2><div className="reference-card-grid five">{solutionCards.map(([Icon, title, text]) => <article className="reference-card" key={title}><Icon /><h3>{title}</h3><p>{text}</p></article>)}</div></section>
        <section className="reference-landing-section"><h2>Quem usa, aprova <strong>♥</strong></h2><div className="reference-card-grid three">{testimonials.map(([name, text]) => <article className="reference-testimonial" key={name}><div className="text-emerald-400">★★★★★</div><strong>{name}</strong><p>“{text}”</p></article>)}</div></section>
        <section id="planos" className="reference-landing-section"><h2>Escolha o plano ideal para você</h2><div className="reference-card-grid three reference-pricing"><article><h3>Free</h3><p>Tudo que você precisa para começar.</p><strong>{brl(0)}</strong><small>pra sempre</small><ul><li><Check /> Corridas ilimitadas</li><li><Check /> Despesas</li><li><Check /> Metas diárias</li><li><Check /> 100% offline</li></ul><Link href={isAuthenticated ? "/app" : "/quiz"}>Usar grátis</Link></article><article className="featured"><span>MAIS ESCOLHIDO</span><h3>PRO</h3><p>Mais controle, mais análises, mais resultado.</p><strong>{brl(MONTHLY_PRICE)}</strong><small>/mês</small><ul><li><Check /> Tudo do plano Free</li><li><Check /> Gráficos avançados</li><li><Check /> Relatórios completos</li><li><Check /> Suporte prioritário</li></ul><button type="button" onClick={() => onCheckout("monthly")}>Testar PRO</button></article><article><h3>Vitalício</h3><p>Pague uma vez e use para sempre.</p><strong>{brl(PLAN_PRICE)}</strong><small>pagamento único</small><ul><li><Check /> Tudo do plano PRO</li><li><Check /> Atualizações vitalícias</li><li><Check /> Sem mensalidade</li><li><Check /> Acesso eterno</li></ul><button type="button" onClick={() => onCheckout("lifetime")}>Quero vitalício</button></article></div></section>
        <footer className="reference-final-cta"><div><h2>BORA PARAR DE<br />PERDER <strong>DINHEIRO?</strong></h2><p>Baixe agora e veja a diferença no seu bolso.</p></div><div className="grid gap-2"><Link href={isAuthenticated ? "/app" : "/quiz"} className="reference-primary-cta justify-center"><ArrowDownToLine className="h-4 w-4" /> Baixar grátis</Link><button type="button" onClick={() => onCheckout("monthly")} className="reference-secondary-cta">Quero PRO</button></div></footer>
      </div>
    </section>
  );
}
