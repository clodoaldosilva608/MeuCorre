import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cases — MeuCorre",
  description: "Histórias reais de entregadores que transformaram sua rotina financeira com o MeuCorre. Veja como eles descobriram quanto realmente ganham.",
};

export default function CasesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-zinc-900">
      <h1 className="text-3xl font-black text-zinc-900">Cases</h1>
      <p className="mt-3 text-base text-zinc-600">
        Histórias reais de entregadores que usam o MeuCorre para gerir suas
        corridas e descobrir quanto realmente ganham.
      </p>

      <div className="mt-8 space-y-6">
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-2xl">
              🛵
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Rafael S.</h2>
              <p className="text-xs text-zinc-500">
                Entregador multi-app • São Paulo
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-zinc-600">
            &ldquo;Antes eu achava que ganhava R$ 200 por dia. Comecei a lançar
            tudo no MeuCorre e descobri que, depois de gasolina e comida,
            sobravam R$ 110. Mudou minha forma de trabalhar — agora sei
            exatamente quais horários valem a pena e quais apps me pagam
            melhor.&rdquo;
          </p>
          <div className="mt-3 flex gap-4 text-xs text-zinc-500">
            <span>📊 3 meses usando</span>
            <span>💰 +18% lucro líquido</span>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-2xl">
              📦
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Carlos M.</h2>
              <p className="text-xs text-zinc-500">
                Entregador Lalamove • Rio de Janeiro
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-zinc-600">
            &ldquo;Trabalho com Lalamove e Loggi e sempre perdia a conta de
            quantas corridas eu fazia por semana. Com o MeuCorre, consigo ver
            o total do mês em segundos. O relatório de km rodado me ajudou
            a negociar com a seguradora — eles aceitaram meu comprovante de
            renda gerado pelo app.&rdquo;
          </p>
          <div className="mt-3 flex gap-4 text-xs text-zinc-500">
            <span>📊 6 meses usando</span>
            <span>🛡️ Seguro aprovado</span>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-2xl">
              🍔
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Juliana A.</h2>
              <p className="text-xs text-zinc-500">
                Entregadora iFood + 99Food • Belo Horizonte
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-zinc-600">
            &ldquo;Como mulher entregadora, preciso ser ainda mais organizada
            com meus gastos. O MeuCorre me mostrou que eu estava gastando
            R$ 400/mês com alimentação que eu nem lembrava. Cortando isso,
            meu lucro subiu quase R$ 400. Vale cada centavo do plano
            vitalício.&rdquo;
          </p>
          <div className="mt-3 flex gap-4 text-xs text-zinc-500">
            <span>📊 8 meses usando</span>
            <span>💰 +R$ 400/mês economizados</span>
          </div>
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
