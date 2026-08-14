import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contato — MeuCorre",
  description: "Entre em contato com o MeuCorre. Suporte, parcerias, sugestões e feedback. Estamos aqui para ajudar quem corre atrás.",
};

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-zinc-900">
      <h1 className="text-3xl font-black text-zinc-900">Contato</h1>
      <p className="mt-3 text-base text-zinc-600">
        Estamos aqui para ajudar. Escolha o canal que preferir.
      </p>

      <div className="mt-8 space-y-4">
        <a
          href="https://wa.me/5581920051068?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20MeuCorre"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-emerald-300 hover:shadow-md"
        >
          <div className="grid h-12 w-12 place-items-center rounded-full bg-green-100 text-2xl">
            💬
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900">WhatsApp</p>
            <p className="text-xs text-zinc-500">
              Toque para conversar conosco — resposta em até 24h
            </p>
          </div>
        </a>

        <a
          href="mailto:suportemeucorre@gmail.com"
          className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-emerald-300 hover:shadow-md"
        >
          <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-100 text-2xl">
            ✉️
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900">Email</p>
            <p className="text-xs text-zinc-500">
              suportemeucorre@gmail.com — parcerias e suporte
            </p>
          </div>
        </a>

        <a
          href="/app"
          className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-emerald-300 hover:shadow-md"
        >
          <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-2xl">
            📱
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900">
              Feedback in-app
            </p>
            <p className="text-xs text-zinc-500">
              Abra o app → menu → toque em &ldquo;Feedback&rdquo; para
              enviar sugestões diretamente
            </p>
          </div>
        </a>
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-bold text-zinc-900">
          Horário de atendimento
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Segunda a sábado, das 8h às 20h (horário de Brasília). Usuários PRO
          têm prioridade no atendimento via WhatsApp.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-lg font-bold text-emerald-700">Parcerias</h2>
        <p className="mt-2 text-sm text-zinc-600">
          É de uma empresa de combustível, seguro, fintech ou equipamentos e
          quer chegar ao público entregador? Entre em contato via email com
          o assunto &ldquo;Parceria&rdquo; para discutirmos modelos de
          colaboração.
        </p>
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
