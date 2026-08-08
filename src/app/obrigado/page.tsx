"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Zap,
  Check,
  Copy,
  CheckCheck,
  Loader2,
  AlertCircle,
  Sparkles,
  Mail,
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

function ObrigadoContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<SubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [emailInput, setEmailInput] = useState("");
  const [searching, setSearching] = useState(false);

  // Lê todos os possíveis params de pedido que a Kiwify pode enviar
  const orderId =
    searchParams?.get("order") ||
    searchParams?.get("order_id") ||
    searchParams?.get("order_ref") ||
    searchParams?.get("id") ||
    searchParams?.get("charge_id");
  const emailParam = searchParams?.get("email") || searchParams?.get("customer_email");

  useEffect(() => {
    if (!orderId && !emailParam) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const params = new URLSearchParams();
        if (orderId) params.set("order", orderId);
        if (emailParam) params.set("email", emailParam);

        const res = await fetch(`/api/license/by-order?${params.toString()}`);
        const json = (await res.json()) as SubData;
        if (cancelled) return;
        setData(json);
        setPollCount(attempts);

        if (!json.found || !json.subscription?.licenseKey) {
          // Tenta de novo em 3s (até 20x = 60s — dá tempo pro webhook chegar)
          if (attempts < 20) {
            setTimeout(poll, 3000);
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
          // Auto-redirect pro app com a licença após 4 segundos
          // (dá tempo do user ver a licença e copiar se quiser)
          setTimeout(() => {
            window.location.href = `/app?license=${json.subscription?.licenseKey}`;
          }, 4000);
        }
      } catch {
        if (attempts < 20 && !cancelled) {
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
  }, [orderId, emailParam]);

  // Busca manual por email (quando não tem order_id na URL)
  const searchByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/license/by-order?email=${encodeURIComponent(emailInput.trim())}`,
      );
      const json = (await res.json()) as SubData;
      setData(json);
      if (json.found && json.subscription?.licenseKey) {
        toast.success("Licença encontrada! 🎉");
      } else {
        toast.error("Ainda não encontramos sua licença", {
          description: "Aguarde alguns minutos e tente novamente",
        });
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSearching(false);
    }
  };

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
                <span className="ml-1 text-zinc-600">({pollCount}/20)</span>
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

  // Não encontrado / sem order nem email — pede email
  if (!data?.found || !data?.subscription?.licenseKey) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/15">
            <AlertCircle className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">
              Pagamento confirmado!
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Estamos processando sua licença. Digite o email usado na compra
              pra buscar sua licença:
            </p>
          </div>

          <form onSubmit={searchByEmail} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Mail className="h-3 w-3" />
                Email da compra
              </Label>
              <Input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="seu@email.com"
                required
                className="border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500"
              />
            </div>
            <Button
              type="submit"
              disabled={searching || !emailInput.trim()}
              className="w-full bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400"
            >
              {searching ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                "Buscar minha licença"
              )}
            </Button>
          </form>

          {data && !data.found && (
            <p className="text-xs text-amber-400">
              {data.message || "Licença ainda não disponível"}
            </p>
          )}

          <div className="space-y-2 pt-2">
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

          <p className="text-[11px] text-zinc-600">
            💡 Seu pagamento foi confirmado pela Kiwify. A licença pode levar
            até 5 minutos pra ficar disponível enquanto o webhook é processado.
          </p>
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
                  Copiar
                </>
              )}
            </Button>
            <Link href={`/app?license=${sub.licenseKey}`} className="flex-1">
              <Button className="w-full bg-zinc-100 font-bold text-zinc-950 hover:bg-zinc-200">
                <Zap className="mr-1.5 h-4 w-4" />
                Ativar e abrir app
              </Button>
            </Link>
          </div>

          {/* Aviso de auto-redirect */}
          <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-300">
            <Loader2 className="h-3 w-3 animate-spin" />
            Redirecionando pro app automaticamente em 4 segundos...
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
              Clique em &ldquo;Ativar e abrir app&rdquo; acima
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-emerald-400">2.</span>
              Sua licença PRO será ativada automaticamente neste dispositivo
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-emerald-400">3.</span>
              Pronto! Anúncios somem + features PRO liberadas 🚀
            </li>
          </ol>
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
              R$ {Number(sub.amount).toFixed(2).replace(".", ",")}
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
          href={`/app?license=${sub.licenseKey}`}
          className="block pt-2 text-center text-xs text-emerald-400 hover:text-emerald-300"
        >
          Ativar agora e ir pro app →
        </Link>
      </div>
    </div>
  );
}

export default function ObrigadoPage() {
  return (
    <Suspense fallback={null}>
      <ObrigadoContent />
    </Suspense>
  );
}
