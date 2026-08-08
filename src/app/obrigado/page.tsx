"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Check,
  Copy,
  CheckCheck,
  Loader2,
  AlertCircle,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface SubData {
  found: boolean;
  status?: string;
  message?: string;
  subscription?: {
    id: string;
    buyerName: string;
    buyerEmail: string;
    status: string;
    licenseKey: string | null;
    paymentMethod: string;
    amount: number;
    createdAt: string;
  };
}

export default function ObrigadoPage() {
  const [data, setData] = useState<SubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const order = params.get("order");
    if (!order) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/license/by-order?order=${order}`);
        const json = (await res.json()) as SubData;
        if (cancelled) return;
        setData(json);
        setPollCount(attempts);

        // Se ainda não tem licença, tenta de novo em 3s (até 10x = 30s)
        if (!json.found || !json.subscription?.licenseKey) {
          if (attempts < 10) {
            setTimeout(poll, 3000);
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch {
        if (attempts < 10 && !cancelled) {
          setTimeout(poll, 3000);
        } else {
          setLoading(false);
        }
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, []);

  const copyLicense = () => {
    if (!data?.subscription?.licenseKey) return;
    navigator.clipboard.writeText(data.subscription.licenseKey);
    setCopied(true);
    toast.success("Licença copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Loading state
  if (loading && !data?.subscription?.licenseKey) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-3xl shadow-lg shadow-emerald-500/30">
            ⚡
          </div>
          <div>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-400" />
            <h1 className="mt-4 text-xl font-bold text-zinc-100">
              Processando seu pagamento...
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Aguardando a confirmação da Kiwify
              {pollCount > 0 && (
                <span className="ml-1 text-zinc-600">({pollCount}/10)</span>
              )}
            </p>
          </div>
          <p className="text-xs text-zinc-600">
            Isso pode levar alguns segundos. Não feche a página.
          </p>
        </div>
      </div>
    );
  }

  // Não encontrado / erro
  if (!data?.found || !data?.subscription?.licenseKey) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/15 text-3xl">
            <AlertCircle className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">
              Pagamento em processamento
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Sua licença será enviada para o email cadastrado assim que o
              pagamento for confirmado (geralmente em até 5 minutos para Pix,
              imediato para cartão).
            </p>
          </div>
          <div className="space-y-2">
            <Link href="/">
              <Button
                variant="outline"
                className="w-full border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
              >
                Voltar para a página inicial
              </Button>
            </Link>
            <Link href="/app">
              <Button className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400">
                Ir para o app
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Sucesso!
  const sub = data.subscription;
  return (
    <div className="grid min-h-screen place-items-center bg-zinc-950 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-500/30">
            <Check className="h-10 w-10 text-zinc-950" strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-black text-emerald-400">
            Pagamento aprovado!
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Bem-vindo ao MeuCorre PRO, {sub.buyerName.split(" ")[0]}! 🎉
          </p>
        </div>

        {/* Card da licença */}
        <div className="overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 to-zinc-900 p-5 shadow-xl shadow-emerald-500/10">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Sua licença PRO
            </p>
          </div>
          <code className="block break-all rounded-xl bg-zinc-950 p-3 font-mono text-sm text-emerald-400">
            {sub.licenseKey}
          </code>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={copyLicense}
              className="flex-1 bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400"
            >
              {copied ? (
                <>
                  <CheckCheck className="mr-1.5 h-4 w-4" />
                  Copiada!
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-4 w-4" />
                  Copiar licença
                </>
              )}
            </Button>
            <Link href={`/app?license=${sub.licenseKey}`} className="flex-1">
              <Button className="w-full bg-zinc-100 font-bold text-zinc-950 hover:bg-zinc-200">
                <Zap className="mr-1.5 h-4 w-4" />
                Ativar agora
              </Button>
            </Link>
          </div>
        </div>

        {/* Como ativar */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="mb-2 text-xs font-semibold text-zinc-300">
            Como ativar:
          </p>
          <ol className="space-y-1.5 text-xs text-zinc-400">
            <li className="flex gap-2">
              <span className="font-bold text-emerald-400">1.</span>
              Abra o app do MeuCorre
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-emerald-400">2.</span>
              Toque no ícone de coroa 👑 no topo
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-emerald-400">3.</span>
              Cole a licença e toque em &ldquo;Ativar PRO&rdquo;
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-emerald-400">4.</span>
              Pronto! Anúncios somem + features PRO liberadas 🚀
            </li>
          </ol>
          <p className="mt-3 text-[11px] text-zinc-500">
            Ou clique em &ldquo;Ativar agora&rdquo; acima pra ativar
            automaticamente neste dispositivo.
          </p>
        </div>

        {/* Detalhes */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-xs">
          <div className="flex justify-between py-1">
            <span className="text-zinc-500">Comprador</span>
            <span className="text-zinc-300">{sub.buyerName}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-zinc-500">Email</span>
            <span className="text-zinc-300">{sub.buyerEmail}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-zinc-500">Valor</span>
            <span className="font-bold text-emerald-400">
              R$ {sub.amount.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-zinc-500">Pagamento</span>
            <span className="text-zinc-300">
              {sub.paymentMethod === "kiwify" ? "Kiwify" : "Pix manual"}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-zinc-500">Tipo</span>
            <span className="text-zinc-300">Vitalício (pagamento único)</span>
          </div>
        </div>

        {/* Email de backup */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center text-[11px] text-emerald-300">
          📧 Enviamos sua licença para <strong>{sub.buyerEmail}</strong>.
          Guarde este email — ele é seu backup caso troque de celular.
        </div>

        <Link
          href="/app"
          className="block pt-2 text-center text-xs text-zinc-500 hover:text-zinc-300"
        >
          Ir para o app →
        </Link>
      </div>
    </div>
  );
}
