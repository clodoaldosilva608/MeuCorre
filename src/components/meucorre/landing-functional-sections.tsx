import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { BlogCarousel } from "@/components/meucorre/blog-carousel";
import { TestimonialsCarousel } from "@/components/meucorre/testimonials-carousel";
import { FounderMessage } from "@/components/meucorre/founder-message";
import { YouTubeSection } from "@/components/meucorre/youtube-section";
import { SponsoredBrandsCarousel } from "@/components/meucorre/sponsored-brands-carousel";

const faqItems = [
  ["O app funciona sem internet?", "Sim. O MeuCorre foi desenvolvido para funcionar 100% offline. Seus dados ficam no celular e sincronizam quando houver conexão."],
  ["Como funciona o plano vitalício?", "Você paga uma única vez e mantém acesso ao plano PRO, sem mensalidade, incluindo as atualizações previstas para o produto."],
  ["E se eu trocar de celular?", "Use a exportação de dados no menu do app para fazer backup e importe seus dados no novo aparelho. Também mantemos os dados locais sob seu controle."],
  ["Meus dados são vendidos?", "Não. Seus registros financeiros são seus e não são vendidos. O app foi pensado para privacidade e uso offline."],
  ["Tem como testar antes de pagar?", "Sim. O plano grátis permite começar sem cadastro de pagamento. Você pode testar o fluxo e contratar o PRO quando fizer sentido."],
] as const;

export function LandingFunctionalSections() {
  return (
    <div className="reference-functional-sections">
      <section className="reference-landing-section" aria-labelledby="landing-blog-title">
        <div className="reference-section-heading-row"><div><span className="reference-eyebrow">Conteúdo para quem corre</span><h2 id="landing-blog-title">Aprenda a cuidar melhor do seu dinheiro</h2></div><Link className="reference-text-link" href="/blog">Ver todos os artigos <ExternalLink className="h-4 w-4" /></Link></div>
        <BlogCarousel />
      </section>
      <section className="reference-landing-section" aria-labelledby="landing-testimonials-title">
        <span className="reference-eyebrow">Comunidade MeuCorre</span><h2 id="landing-testimonials-title">Quem usa, aprova</h2><TestimonialsCarousel />
      </section>
      <section className="reference-landing-section" aria-labelledby="landing-video-title"><YouTubeSection /></section>
      <section className="reference-landing-section" aria-labelledby="landing-partners-title"><span className="reference-eyebrow">Benefícios para entregadores</span><h2 id="landing-partners-title">Parceiros que ajudam no seu corre</h2><SponsoredBrandsCarousel /></section>
      <section className="reference-landing-section" id="planos" aria-labelledby="landing-plans-title">
        <span className="reference-eyebrow">Escolha seu plano — sem fidelidade</span>
        <h2 id="landing-plans-title">MeuCorre PRO — você escolhe como pagar</h2>
        <div className="reference-plans-grid">
          <div className="reference-plan-card">
            <h3>Grátis</h3>
            <p className="reference-plan-price">R$ 0</p>
            <p className="reference-plan-period">para sempre</p>
            <ul><li>✓ Corridas ilimitadas</li><li>✓ Despesas</li><li>✓ Gráficos básicos</li><li>✓ 100% offline</li></ul>
            <a href="/app" className="reference-plan-btn outline">Começar grátis</a>
          </div>
          <div className="reference-plan-card featured">
            <span className="reference-plan-badge">MAIS ESCOLHIDO</span>
            <h3>Vitalício</h3>
            <p className="reference-plan-price">R$ 18,90</p>
            <p className="reference-plan-period">pagamento único</p>
            <ul><li>✓ Tudo do plano Grátis</li><li>✓ Mapa de calor</li><li>✓ Metas avançadas</li><li>✓ Captura por notificação</li><li>✓ Sem mensalidade</li></ul>
            <a href="#" className="reference-plan-btn solid">Garantir vitalício</a>
          </div>
          <div className="reference-plan-card">
            <h3>Anual</h3>
            <p className="reference-plan-price">R$ 97</p>
            <p className="reference-plan-period">/ano (economize 46%)</p>
            <ul><li>✓ Tudo do vitalício</li><li>✓ Atualizações por 1 ano</li><li>✓ Suporte prioritário</li></ul>
            <a href="#" className="reference-plan-btn outline">Quero anual</a>
          </div>
          <div className="reference-plan-card">
            <h3>Mensal</h3>
            <p className="reference-plan-price">R$ 14,90</p>
            <p className="reference-plan-period">/mês (cancele quando quiser)</p>
            <ul><li>✓ Tudo do vitalício</li><li>✓ Cancele a qualquer momento</li></ul>
            <a href="#" className="reference-plan-btn outline">Quero mensal</a>
          </div>
        </div>
      </section>
      <section className="reference-landing-section" aria-labelledby="landing-faq-title"><span className="reference-eyebrow">Dúvidas frequentes</span><h2 id="landing-faq-title">Tudo o que você precisa saber</h2><div className="reference-faq-list">{faqItems.map(([question, answer]) => <details key={question} className="reference-faq-item"><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>
      <section className="reference-landing-section"><FounderMessage /></section>
      <footer className="reference-functional-footer"><div><strong>Meu<span>Corre</span></strong><p>Finanças para quem move o Brasil.</p></div><nav aria-label="Links institucionais"><Link href="/app">Abrir app</Link><Link href="/planos#planos">Planos</Link><Link href="/servicos">Serviços</Link><Link href="/cases">Cases</Link><Link href="/sobre">Sobre</Link><Link href="/contato">Contato</Link><Link href="/privacidade">Privacidade</Link></nav></footer>
    </div>
  );
}
