"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

function RecuperarSenhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [step, setStep] = useState<"request" | "reset" | "done">(token ? "reset" : "request");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Se veio token na URL, vai direto pra etapa de nova senha
  useEffect(() => {
    if (token) setStep("reset");
  }, [token]);

  // Etapa 1: solicitar reset (envia email)
  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      // Sempre mostra sucesso (não revela se email existe)
      toast.success("Se o email existir, você receberá o link de recuperação.", {
        description: "Verifique sua caixa de entrada (e spam).",
      });
      setStep("done");
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  // Etapa 2: definir nova senha
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Token inválido");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao redefinir senha");
        return;
      }
      toast.success("Senha redefinida! Faça login com a nova senha. 🎉");
      router.push("/login");
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-2xl shadow-lg shadow-emerald-500/25">
            ⚡
          </div>
          <h1 className="text-2xl font-extrabold text-emerald-400">MeuCorre</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {step === "request" && "Recuperar senha"}
            {step === "reset" && "Definir nova senha"}
            {step === "done" && "Verifique seu email"}
          </p>
        </div>

        {step === "request" && (
          <form
            onSubmit={handleRequest}
            className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
          >
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Mail className="h-3 w-3" />
                Email cadastrado
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoFocus
                className="border-zinc-800 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400"
            >
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </Button>
          </form>
        )}

        {step === "reset" && token && (
          <form
            onSubmit={handleReset}
            className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
          >
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Lock className="h-3 w-3" />
                Nova senha <span className="text-zinc-600">(mín 6 caracteres)</span>
              </Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoFocus
                className="border-zinc-800 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || newPassword.length < 6}
              className="w-full bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400"
            >
              {loading ? "Redefinindo..." : "Redefinir senha"}
            </Button>
          </form>
        )}

        {step === "done" && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
            <CheckCircle className="mx-auto mb-3 h-12 w-12 text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-100">Solicitação enviada!</h3>
            <p className="mt-2 text-xs text-zinc-400">
              Se o email <strong className="text-zinc-200">{email}</strong> estiver cadastrado,
              você receberá um link de recuperação em alguns minutos.
            </p>
            <p className="mt-2 text-[11px] text-zinc-500">
              Não recebeu? Verifique o spam ou tente novamente em alguns minutos.
            </p>
            <Link href="/login">
              <Button
                variant="outline"
                className="mt-4 w-full border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
              >
                Voltar para login
              </Button>
            </Link>
          </div>
        )}

        {step !== "done" && (
          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
          >
            <ArrowLeft className="h-3 w-3" />
            Voltar para login
          </Link>
        )}
      </div>
    </div>
  );
}

export default function RecuperarSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RecuperarSenhaContent />
    </Suspense>
  );
}
