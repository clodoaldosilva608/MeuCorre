"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Crown,
  Clock,
  Calendar,
  Save,
  Loader2,
  ArrowLeft,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserData {
  id: string;
  name: string;
  email: string;
  isPro: boolean;
  licenseKey: string | null;
  phone: string | null;
  city: string | null;
  active: boolean;
  trialExtendedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setName(data.user.name || "");
          setPhone(data.user.phone || "");
          setCity(data.user.city || "");
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSaveProfile = async () => {
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Nome inválido (mínimo 2 caracteres)");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          city: city.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Perfil atualizado! ✅");
        setUser(data.user);
      } else {
        toast.error(data.error || "Erro ao atualizar");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Senha alterada! 🔒");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Erro ao alterar senha");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push("/app")}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-emerald-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <h1 className="text-sm font-bold text-zinc-100">Meu Perfil</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-6 px-4 pt-6">
        {/* Avatar + Status */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-2xl font-black text-zinc-950 shadow-lg shadow-emerald-500/30">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-zinc-100">{user.name}</h2>
            <p className="text-sm text-zinc-500">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {user.isPro ? (
              <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 px-3 py-1 text-xs font-black text-zinc-950">
                <Crown className="h-3 w-3" />
                PRO Vitalício
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400">
                <Clock className="h-3 w-3" />
                Trial / Free
              </span>
            )}
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
              <Calendar className="h-3 w-3" />
              Membro desde
            </div>
            <p className="mt-1 text-sm font-medium text-zinc-200">
              {new Date(user.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
              <Clock className="h-3 w-3" />
              Último login
            </div>
            <p className="mt-1 text-sm font-medium text-zinc-200">
              {user.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleDateString("pt-BR")
                : "Agora"}
            </p>
          </div>
        </div>

        {/* License Key (if PRO) */}
        {user.isPro && user.licenseKey && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-1.5">
              <Key className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">
                Sua licença PRO
              </span>
            </div>
            <code className="mt-2 block break-all rounded-lg bg-zinc-950 p-2 font-mono text-xs text-emerald-400">
              {user.licenseKey}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(user.licenseKey || "");
                toast.success("Licença copiada!");
              }}
              className="mt-2 text-[11px] text-zinc-500 underline hover:text-zinc-300"
            >
              Copiar licença
            </button>
          </div>
        )}

        {/* Edit profile */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-zinc-100">Editar informações</h3>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-zinc-400">
                <UserIcon className="h-3 w-3" />
                Nome completo
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-zinc-800 bg-zinc-900 text-zinc-100 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Mail className="h-3 w-3" />
                Email (não editável)
              </Label>
              <Input
                value={user.email}
                disabled
                className="border-zinc-800 bg-zinc-950 text-zinc-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Phone className="h-3 w-3" />
                WhatsApp
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="border-zinc-800 bg-zinc-900 text-zinc-100 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-zinc-400">
                <MapPin className="h-3 w-3" />
                Cidade
              </Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="São Paulo - SP"
                className="border-zinc-800 bg-zinc-900 text-zinc-100 focus:border-emerald-500"
              />
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={saving || !name.trim()}
              className="w-full bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400"
            >
              {saving ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" />
              )}
              Salvar alterações
            </Button>
          </div>
        </section>

        {/* Change password */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-zinc-100">Alterar senha</h3>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Nova senha</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="border-zinc-800 bg-zinc-900 text-zinc-100 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Confirmar nova senha</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="border-zinc-800 bg-zinc-900 text-zinc-100 focus:border-emerald-500"
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={saving || !newPassword || !confirmPassword}
              variant="outline"
              className="w-full border-zinc-700 text-zinc-200 hover:bg-zinc-800"
            >
              {saving ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Key className="mr-1.5 h-4 w-4" />
              )}
              Alterar senha
            </Button>
          </div>
        </section>

        {/* Account info */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-xs text-zinc-500">
          <p>
            <strong className="text-zinc-300">ID da conta:</strong> {user.id}
          </p>
          <p className="mt-1">
            <strong className="text-zinc-300">Status:</strong>{" "}
            {user.active ? "✅ Ativa" : "❌ Desativada"}
          </p>
          {user.trialExtendedUntil && (
            <p className="mt-1">
              <strong className="text-zinc-300">Trial estendido até:</strong>{" "}
              {new Date(user.trialExtendedUntil).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
