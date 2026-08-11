import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Serviços — MeuCorre",
  description: "Serviços do MeuCorre para entregadores: gestão de corridas, relatórios financeiros, backup em nuvem, e ferramentas para aumentar sua renda.",
};

export default function ServicosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-zinc-900">
      <h1 className="text-3xl font-black text-zinc-900">Serviços</h1>
      <p className="mt-3 text-base text-zinc-600">
        Tudo que o MeuCorre oferece para o entregador de aplicativo gerir seu
        negócio com clareza e eficiência.
      </p>

      <div className="mt-8 space-y-6">
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-bold text-zinc-900">
            Gestão de Corridas e Despesas
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Lance suas corridas de qualquer app (iFood, 99Food, Lalamove,
            Rappi, Loggi e outros) em segundos. Registre despesas como
            combustível, alimentação, manutenção e pedágio. O MeuCorre
            calcula seu lucro líquido em tempo real, mostrando quanto você
            realmente ganhou após descontar todos os custos. Funciona 100%
            offline, sem depender de internet.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-bold text-zinc-900">
            Relatórios Financeiros
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Visualize gráficos de ganhos vs despesas dos últimos 7 dias,
            distribuição de corridas por app, e despesas por categoria.
            Exporte seus dados em JSON ou CSV para usar em planilhas ou
            entregar ao contador. Usuários PRO podem gerar relatórios PDF
            mensais profissionais.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-bold text-zinc-900">
            Backup e Sincronização
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Usuários PRO têm acesso a backup automático na nuvem e
            sincronização entre dispositivos. Nunca perca seus dados se o
            celular quebrar ou for trocado. Acesse seus lançamentos de
            qualquer aparelho — os dados ficam protegidos e criptografados.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-bold text-zinc-900">
            Loja de Ofertas Exclusivas
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Acesse descontos exclusivos em produtos selecionados para
            entregadores: mochilas térmicas, suportes para celular, capas de
            chuva, equipamentos e mais. Ofertas curadas com preços
            especiais que você não encontra em outro lugar.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-bold text-zinc-900">
            Programa de Indicação
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Indique amigos para o MeuCorre PRO e ganhe R$ 5 via PIX para cada
            indicação que se tornar PRO. Compartilhe seu link pessoal e
            acumule recompensas. Sem limite de indicações.
          </p>
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
