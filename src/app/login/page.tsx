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

      // Troca para o database isolado do usuário
      switchDb(data.user.id);

      toast.success(`Bem-vindo, ${data.user.name.split(" ")[0]}! 👋`);
      // Passa o userId via query param para que o useSync chame switchDb
      // Isso garante que o DB ativo seja trocado mesmo após reload completo
      window.location.replace('/app');
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <img src="/logo-meucorre.png" alt="MeuCorre" className="mx-auto mb-3 h-14 w-14 rounded-2xl shadow-neon" />
          <h1 className="text-2xl font-extrabold text-neon text-glow-neon">MeuCorre</h1>
          <p className="mt-1 text-sm text-zinc-500">Entrar na sua conta</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-neon/30 bg-graphite p-6"
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
              className="border-neon/20 bg-ink text-zinc-100 focus:border-neon"
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
              className="border-neon/20 bg-ink text-zinc-100 focus:border-neon"
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !email || !password}
            className="btn-neon w-full font-bold"
          >
            {loading ? "Entrando..." : "Entrar"}
            {!loading && <ArrowRight className="ml-1.5 h-4 w-4" />}
          </Button>
        </form>

        <div className="space-y-2 text-center">
          <Link
            href="/recuperar-senha"
            className="block text-xs text-zinc-500 hover:text-neon"
          >
            Esqueci minha senha
          </Link>
          <p className="text-xs text-zinc-500">
            Não tem conta?{" "}
            <Link href="/register" className="font-semibold text-neon hover:underline">
              Cadastre-se grátis
            </Link>
          </p>
        </div>

        <Link
          href="/"
          className="flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-neon"
        >
          <ArrowLeft className="h-3 w-3" />
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}
