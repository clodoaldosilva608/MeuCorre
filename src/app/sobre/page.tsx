import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre — MeuCorre",
  description: "O MeuCorre foi criado por um entregador, para entregadores. Conheça nossa história, missão e valores.",
};

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-zinc-900">
      <h1 className="text-3xl font-black text-zinc-900">Sobre o MeuCorre</h1>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-600">
        <p>
          O MeuCorre nasceu de uma dor real: a dificuldade de saber quanto
          realmente se ganha trabalhando como entregador de aplicativo. Quem
          corre com iFood, 99Food, Lalamove e outros apps sabe que o
          faturamento fica fragmentado entre plataformas, e as despesas
          (gasolina, manutenção, alimentação) são invisíveis até o fim do
          mês — quando descobrimos que o &ldquo;lucro&rdquo; imaginário foi
          consumido por gastos que esquecemos de contabilizar.
        </p>

        <p>
          Criado e desenvolvido por <strong>Clodoaldo C Silva</strong>,
          também entregador, o MeuCorre foi pensado desde o primeiro dia
          como uma ferramenta que respeita o trabalhador. Por isso é
          <strong> 100% offline</strong> — seus dados ficam no seu celular,
          nunca são vendidos, e ninguém além de você tem acesso aos seus
          ganhos e despesas. Essa privacidade não é apenas um recurso,
          é um princípio.
        </p>

        <p>
          Nossa missão é simples: <strong>dar clareza financeira a quem
          corre atrás</strong>. Para isso, centralizamos corridas de todos
          os apps em um único dashboard, calculamos o lucro líquido em
          tempo real, e oferecemos gráficos que mostram exatamente onde o
          dinheiro entra e onde sai. Sem planilha, sem caderninho, sem
          abrir 3 apps para somar.
        </p>

        <p>
          O MeuCorre é um <strong>PWA (Progressive Web App)</strong>,
          o que significa que funciona como um app nativo mas é instalável
          diretamente do navegador, sem passar por lojas de aplicativos.
          Isso garante atualizações instantâneas e zero comissão para
          intermediários. Feito no Brasil 🇧🇷, com 💚 para quem corre
          atrás.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-bold text-zinc-900">Nossos valores</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-600">
          <li>
            <strong>Privacidade acima de tudo:</strong> seus dados são seus.
            Nunca vendidos, nunca compartilhados sem seu consentimento.
          </li>
          <li>
            <strong>Simplicidade:</strong> lançar uma corrida deve ser mais
            rápido que abrir a porta do cliente.
          </li>
          <li>
            <strong>Transparência:</strong> sem pegadinhas, sem mensalidade
            escondida, sem anúncios invasivos no fluxo de trabalho.
          </li>
          <li>
            <strong>Comunidade:</strong> feito por entregador, para
            entregador. Cada feedback molda o produto.
          </li>
        </ul>
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
