import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-4xl shadow-lg shadow-emerald-500/30">
          🏍️
        </div>
        <div>
          <h1 className="text-6xl font-black text-emerald-400">404</h1>
          <p className="mt-2 text-lg font-bold text-zinc-100">
            Opa! Essa rota saiu pra entrega e não voltou.
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            A página que você procura não existe ou foi movida.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href="/app"
            className="rounded-xl bg-emerald-500 py-3 text-center text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-400"
          >
            Ir para o app
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-zinc-800 py-3 text-center text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900"
          >
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
