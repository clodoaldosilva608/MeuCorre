import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Institucional — MeuCorre",
  description: "Informações institucionais do MeuCorre: quem somos, como operamos, e nosso compromisso com a privacidade do entregador.",
};

export default function InstitucionalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-zinc-900">
      <h1 className="text-3xl font-black text-zinc-900">Institucional</h1>

      <div className="mt-8 space-y-6">
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-bold text-zinc-900">
            Identificação
          </h2>
          <dl className="mt-3 space-y-2 text-sm text-zinc-600">
            <div>
              <dt className="font-semibold text-zinc-700">Produto:</dt>
              <dd>MeuCorre — Aplicativo de gestão para entregadores</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-700">
                Criador e desenvolvedor:
              </dt>
              <dd>Clodoaldo C Silva</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-700">Nacionalidade:</dt>
              <dd>Brasileiro 🇧🇷</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-700">URL oficial:</dt>
              <dd>https://meucorre.vercel.app</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-bold text-zinc-900">
            Modelo de negócio
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            O MeuCorre opera com modelo freemium: o plano gratuito oferece
            14 dias de trial com acesso total, seguido de 5 lançamentos
            diários gratuitos. O plano PRO (mensal, anual ou vitalício)
            remove anúncios, libera features avançadas (relatórios PDF,
            metas, backup em nuvem) e oferece suporte prioritário.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-bold text-zinc-900">
            Compromisso com a privacidade
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            O MeuCorre é Local-First: seus dados de corridas e despesas
            ficam armazenados apenas no seu celular (IndexedDB). A
            sincronização na nuvem é opcional e requer login — mesmo assim,
            os dados são acessíveis apenas a você. Nunca vendemos dados de
            usuários. Dados agregados e anônimos podem ser usados no futuro
            apenas com consentimento explícito (opt-in).
          </p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-bold text-zinc-900">
            Tecnologia e segurança
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Construído com Next.js 16, TypeScript, Prisma ORM, Supabase
            (PostgreSQL), e hospedado na Vercel. Autenticação via JWT com
            cookies httpOnly. Pagamentos processados pela Kiwify (PIX e
            cartão). Monitoramento via Sentry. Rate limiting via Upstash
            Redis. Todos os endpoints autenticados verificam sessão ativa
            em cada requisição.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-bold text-zinc-900">
            Documentos legais
          </h2>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <a
                href="/termos"
                className="font-semibold text-emerald-600 hover:underline"
              >
                Termos de Serviço →
              </a>
            </li>
            <li>
              <a
                href="/privacidade"
                className="font-semibold text-emerald-600 hover:underline"
              >
                Política de Privacidade →
              </a>
            </li>
          </ul>
        </section>
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
