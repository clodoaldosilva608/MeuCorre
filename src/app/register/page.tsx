"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, ArrowRight, ArrowLeft, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao cadastrar");
        return;
      }
      toast.success(`Bem-vindo ao MeuCorre, ${data.user.name.split(" ")[0]}! 🎉`);
      router.push("/app");
      router.refresh();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-2xl shadow-lg shadow-emerald-500/25">
            ⚡
          </div>
          <h1 className="text-2xl font-extrabold text-emerald-400">MeuCorre</h1>
          <p className="mt-1 text-sm text-zinc-500">Crie sua conta grátis</p>
          <p className="mt-1 text-[11px] text-zinc-600">
            14 dias de trial + 5 lançamentos/dia após
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
        >
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-zinc-400">
              <User className="h-3 w-3" />
              Nome completo *
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="João da Silva"
              required
              autoFocus
              maxLength={100}
              className="border-zinc-800 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Mail className="h-3 w-3" />
              Email *
            </Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="seu@email.com"
              required
              className="border-zinc-800 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Lock className="h-3 w-3" />
              Senha * <span className="text-zinc-600">(mín 6 caracteres)</span>
            </Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
              minLength={6}
              className="border-zinc-800 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Phone className="h-3 w-3" />
                WhatsApp
              </Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="border-zinc-800 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-zinc-400">
                <MapPin className="h-3 w-3" />
                Cidade
              </Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="São Paulo - SP"
                className="border-zinc-800 bg-zinc-950 text-zinc-100 focus:border-emerald-500"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading || !form.name || !form.email || !form.password}
            className="w-full bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400"
          >
            {loading ? "Cadastrando..." : "Criar conta grátis"}
            {!loading && <ArrowRight className="ml-1.5 h-4 w-4" />}
          </Button>
        </form>

        <p className="text-center text-xs text-zinc-500">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-emerald-400 hover:underline">
            Faça login
          </Link>
        </p>

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
