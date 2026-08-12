"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  Users,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface InviteData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  invitedAt: string;
  expiresAt: string;
  team: {
    id: string;
    name: string;
    companyName: string | null;
    description: string | null;
  };
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  member: "Membro",
};

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params?.token;
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/public/teams/invite/${token}`)
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          throw new Error(data.error ?? "Erro ao carregar convite");
        }
        return r.json();
      })
      .then((data) => {
        setInvite(data.invite);
        setName(data.invite.name ?? "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setAccepting(true);
    try {
      const res = await fetch(`/api/public/teams/invite/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: phone || undefined }),
      });
      if (res.ok) {
        setAccepted(true);
        toast.success("Convite aceito!");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Erro ao aceitar");
      }
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 text-zinc-500">
        <div className="text-center">
          <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
          <p className="text-sm">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 p-6 text-zinc-300">
        <div className="max-w-md text-center">
          <XCircle className="mx-auto mb-3 h-12 w-12 text-red-400" />
          <h1 className="mb-2 text-xl font-bold">Convite indisponível</h1>
          <p className="text-sm text-zinc-500">{error}</p>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="mt-4"
          >
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 p-6 text-zinc-300">
        <div className="max-w-md text-center">
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-400" />
          <h1 className="mb-2 text-xl font-bold">Bem-vindo ao time!</h1>
          <p className="text-sm text-zinc-500">
            Você agora é membro de <strong>{invite?.team.name}</strong>.
          </p>
          <Button
            onClick={() => router.push("/")}
            className="mt-4 gap-2"
          >
            Ir para o app
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (!invite) return null;

  const expiresAt = new Date(invite.expiresAt);
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

  return (
    <div className="min-h-screen bg-zinc-950 py-8 text-zinc-200">
      <div className="mx-auto max-w-md px-4">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">Convite para Time</h1>
          <p className="mt-1 text-xs text-zinc-500">MeuCorre Equipes B2B</p>
        </div>

        {/* Card do convite */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4">
            <p className="text-[10px] uppercase text-zinc-500">Time</p>
            <p className="text-lg font-bold text-zinc-100">{invite.team.name}</p>
            {invite.team.companyName && (
              <p className="text-xs text-zinc-500">{invite.team.companyName}</p>
            )}
          </div>

          {invite.team.description && (
            <div className="mb-4 rounded bg-zinc-950/50 p-3 text-xs text-zinc-400">
              {invite.team.description}
            </div>
          )}

          <div className="mb-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Email:</span>
              <span className="flex items-center gap-1 text-zinc-200">
                <Mail className="h-3 w-3" />
                {invite.email}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Role:</span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                {ROLE_LABELS[invite.role] ?? invite.role}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Expira em:</span>
              <span className="text-zinc-200">
                {daysLeft > 0 ? `${daysLeft} dia${daysLeft === 1 ? "" : "s"}` : "Expira hoje"}
              </span>
            </div>
          </div>

          {/* Form de aceite */}
          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <div>
              <Label className="text-xs">Nome *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Telefone (opcional)</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(81) 99999-9999"
                className="mt-1 text-sm"
              />
            </div>

            <div className="flex items-start gap-2 rounded bg-blue-500/5 p-2 text-[10px] text-blue-300">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              <p>
                Ao aceitar, você será membro deste time. Seus dados de uso do MeuCorre
                permanecem privados — apenas estatísticas agregadas do time são visíveis para o gestor.
              </p>
            </div>

            <Button
              onClick={handleAccept}
              disabled={accepting || !name.trim()}
              className="w-full gap-2"
            >
              {accepting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Aceitar convite
            </Button>
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] text-zinc-600">
          Se você não esperava este convite, ignore esta página.
        </p>
      </div>
    </div>
  );
}
