"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { switchDb } from "@/lib/db";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao entrar");
        return;
      }

      // Troca para o database isolado do usuário (IndexedDB separado por userId)
      // Isso garante isolamento total: dados do usuário A nunca aparecem pro usuário B
      switchDb(data.user.id);

      toast.success(`Bem-vindo, ${data.user.name.split(" ")[0]}! 👋`);
      // window.location.href força um reload completo da página,
      // garantindo que TODOS os hooks (useLiveQuery, useSync, etc.)
      // se re-inicializem com o novo database ativo
      window.location.href = "/app";
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
          <p className="mt-1 text-sm text-zinc-500">Entrar na sua conta</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
        >
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Mail className="h-3 w-3" />
              Email
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
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Lock className="h-3 w-3" />
              Senha
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="border-zinc-800 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400"
          >
            {loading ? "Entrando..." : "Entrar"}
            {!loading && <ArrowRight className="ml-1.5 h-4 w-4" />}
          </Button>
        </form>

        <div className="space-y-2 text-center">
          <Link
            href="/recuperar-senha"
            className="block text-xs text-zinc-500 hover:text-zinc-300"
          >
            Esqueci minha senha
          </Link>
          <p className="text-xs text-zinc-500">
            Não tem conta?{" "}
            <Link href="/register" className="font-semibold text-emerald-400 hover:underline">
              Cadastre-se grátis
            </Link>
          </p>
        </div>

        <Link
          href="/"
          className="flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
        >
          <ArrowLeft className="h-3 w-3" />
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}
