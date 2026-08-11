import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — MeuCorre",
  description: "Perguntas frequentes sobre o MeuCorre: como funciona, planos, pagamento, privacidade e suporte.",
};

export default function FaqPage() {
  const faqs = [
    {
      q: "O app funciona sem internet?",
      a: "Sim, 100% offline. Seus dados ficam salvos no seu celular (IndexedDB). Você consegue lançar corridas e ver relatórios mesmo em subsolos ou áreas sem sinal. A sincronização na nuvem (opcional, apenas para usuários PRO) acontece automaticamente quando você volta a ter conexão.",
    },
    {
      q: "Quanto custa o MeuCorre?",
      a: "O plano gratuito oferece 14 dias de trial com acesso total, seguido de 5 lançamentos diários gratuitos. O plano PRO tem 3 opções: Mensal (R$ 14,90/mês), Anual (R$ 97/ano — economiza 46%) ou Vitalício (R$ 18,90 — oferta limitada, pode acabar a qualquer momento). Todos com as mesmas features PRO.",
    },
    {
      q: "Como funciona o plano vitalício?",
      a: "O vitalício é uma oferta promocional limitada a 500 compradores ou 90 dias (o que vier primeiro). Você paga R$ 18,90 uma única vez via Pix ou cartão na Kiwify, e sua licença PRO é gerada automaticamente. Pronto — PRO para sempre, sem mais cobranças. Quando as 500 vagas acabarem, o vitalício sai de linha e apenas os planos mensal e anual ficam disponíveis.",
    },
    {
      q: "Meus dados são vendidos?",
      a: "Nunca. O MeuCorre é Local-First: nenhum dado de corrida sai do seu celular sem seu consentimento explícito. Nem mesmo o admin consegue ver seus ganhos. Só armazenamos sua licença e dados de conta. Sua privacidade é nosso diferencial competitivo.",
    },
    {
      q: "Funciona com quais apps de entrega?",
      a: "Todos os principais: iFood, 99Food, Lalamove, Rappi, Loggi, Uber Eats, Shopee, Mercado Livre, Amazon, Zé Delivery, Bee, Ryd, Independente e Outros. Você também pode cadastrar apps customizados com upload de imagem oficial.",
    },
    {
      q: "E se eu trocar de celular?",
      a: "Sua licença é vinculada ao seu email. É só fazer login no novo aparelho com a mesma conta. Se você for PRO, o backup em nuvem sincroniza todos os seus lançamentos automaticamente entre dispositivos.",
    },
    {
      q: "Como funciona o programa de indicação?",
      a: "Indique amigos para o MeuCorre PRO usando seu link pessoal. Para cada amigo que se tornar PRO, você ganha R$ 5 via PIX. Sem limite de indicações. Acesse seu link no app, no menu lateral → Compartilhar com amigos.",
    },
    {
      q: "Tem como testar antes de pagar?",
      a: "Sim! Você tem 14 dias de trial grátis com acesso total ao app (corridas, despesas, gráficos, captura por notificação). Após os 14 dias, o plano gratuito continua funcionando com limite de 5 lançamentos por dia. Você só paga se quiser remover anúncios e ter as features PRO ilimitadas.",
    },
    {
      q: "Como faço para cancelar a assinatura mensal?",
      a: "A assinatura mensal não tem fidelidade — cancele a qualquer momento diretamente na Kiwify ou entrando em contato via WhatsApp. Você mantém o acesso PRO até o final do período já pago. Não há taxa de cancelamento.",
    },
    {
      q: "O app é seguro para instalar?",
      a: "Sim. O MeuCorre é um PWA (Progressive Web App) — não baixa executáveis, não pede permissões invasivas, e todo o tráfego é HTTPS com CSP (Content Security Policy) rigorosa. Cookies de sessão são httpOnly e SameSite. Rate limiting protege contra ataques. Auditoria de segurança aprovada com 71 testes E2E.",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-zinc-900">
      <h1 className="text-3xl font-black text-zinc-900">
        Perguntas Frequentes
      </h1>
      <p className="mt-3 text-base text-zinc-600">
        Tudo que você precisa saber sobre o MeuCorre.
      </p>

      <div className="mt-8 space-y-3">
        {faqs.map((faq, i) => (
          <details
            key={i}
            className="group rounded-xl border border-zinc-200 bg-white p-4"
          >
            <summary className="cursor-pointer text-sm font-semibold text-zinc-900 marker:text-transparent">
              {faq.q}
              <span className="float-right text-emerald-500 transition-transform group-open:rotate-180">
                ▼
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              {faq.a}
            </p>
          </details>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-sm font-semibold text-emerald-700">
          Não encontrou sua resposta?
        </p>
        <a
          href="/contato"
          className="mt-2 inline-block rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-emerald-400"
        >
          Fale conosco
        </a>
      </div>

      <div className="mt-8">
        <a
          href="/"
          className="text-sm font-bold text-emerald-600 hover:underline"
        >
          ← Voltar para a página inicial
        </a>
      </div>
    </div>
  );
}
