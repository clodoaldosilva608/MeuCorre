"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Gift,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Referral {
  id: string;
  referrerName: string;
  referrerEmail: string;
  referredName: string;
  referredEmail: string;
  status: string;
  payoutAmount: number;
  payoutPixKey: string | null;
  convertedAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface Campaign {
  id: string;
  name: string;
  active: boolean;
  rewardAmount: number;
  maxReferrals: number;
}

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState<Record<string, { count: number; total: number }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [refRes, campRes] = await Promise.all([
      fetch(`/api/admin/referrals?status=${filter}`),
      fetch("/api/admin/referrals/campaign"),
    ]);
    if (refRes.ok) {
      const data = await refRes.json();
      setReferrals(data.referrals);
      setStats(data.stats);
    }
    if (campRes.ok) {
      const campData = await campRes.json();
      setCampaign(campData.campaign);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const toggleCampaign = async () => {
    if (!campaign) return;
    const res = await fetch("/api/admin/referrals/campaign", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !campaign.active }),
    });
    if (res.ok) {
      const data = await res.json();
      setCampaign(data.campaign);
      toast.success(campaign.active ? "Campanha desativada" : "Campanha ativada! 🎉");
    }
  };

  const handleAction = async (id: string, action: "pay" | "reject") => {
    const pixKey = action === "pay" ? prompt("Chave PIX do referrer (para registro):") : null;
    const res = await fetch("/api/admin/referrals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, pixKey }),
    });
    if (res.ok) {
      toast.success(action === "pay" ? "Indicação marcada como paga ✅" : "Indicação rejeitada");
      load();
    } else {
      toast.error("Erro ao processar");
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4 text-amber-400" />;
      case "converted": return <CheckCircle className="h-4 w-4 text-blue-400" />;
      case "paid": return <DollarSign className="h-4 w-4 text-emerald-400" />;
      case "rejected": return <XCircle className="h-4 w-4 text-red-400" />;
      default: return null;
    }
  };

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Aguardando PRO",
      converted: "Convertido (pagar)",
      paid: "Pago",
      rejected: "Rejeitado",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-100">
            <Gift className="h-5 w-5 text-emerald-400" />
            Indicações
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Gerencie o programa de indicação
          </p>
        </div>
        <Link href="/admin/dashboard" className="flex items-center gap-1 text-sm text-zinc-400 hover:text-emerald-400">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      {/* Campaign config */}
      {campaign && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-zinc-100">{campaign.name}</p>
              <p className="text-xs text-zinc-500">
                Recompensa: R$ {campaign.rewardAmount.toFixed(2)} por PRO convertido
              </p>
            </div>
            <button onClick={toggleCampaign} className="flex items-center gap-2">
              {campaign.active ? (
                <ToggleRight className="h-8 w-8 text-emerald-400" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-zinc-600" />
              )}
              <span className={`text-sm font-medium ${campaign.active ? "text-emerald-400" : "text-zinc-500"}`}>
                {campaign.active ? "Ativa" : "Inativa"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-center">
          <p className="text-[10px] text-zinc-500">Total</p>
          <p className="text-xl font-bold text-zinc-100">{Object.values(stats).reduce((s, v) => s + v.count, 0)}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-center">
          <p className="text-[10px] text-zinc-500">Aguardando</p>
          <p className="text-xl font-bold text-amber-400">{stats.pending?.count || 0}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-center">
          <p className="text-[10px] text-zinc-500">A pagar</p>
          <p className="text-xl font-bold text-blue-400">{stats.converted?.count || 0}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-center">
          <p className="text-[10px] text-zinc-500">Pago</p>
          <p className="text-xl font-bold text-emerald-400">{stats.paid?.count || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "pending", "converted", "paid", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              filter === f ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {f === "all" ? "Todas" : statusLabel(f)}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p className="text-center text-zinc-500">Carregando...</p>
      ) : referrals.length === 0 ? (
        <p className="text-center text-zinc-500">Nenhuma indicação encontrada</p>
      ) : (
        <div className="space-y-2">
          {referrals.map((r) => (
            <div key={r.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {statusIcon(r.status)}
                    <span className="text-sm font-medium text-zinc-200">{r.referredName}</span>
                    <span className="text-xs text-zinc-500">← indicado por</span>
                    <span className="text-sm text-zinc-300">{r.referrerName}</span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {r.referredEmail} • {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-400">R$ {r.payoutAmount.toFixed(2)}</span>
                    {r.convertedAt && (
                      <span className="text-zinc-500">
                        PRO em: {new Date(r.convertedAt).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    {r.paidAt && (
                      <span className="text-emerald-400">
                        Pago em: {new Date(r.paidAt).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    <span className="text-zinc-600">{statusLabel(r.status)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {r.status === "converted" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleAction(r.id, "pay")}
                        className="bg-emerald-500 text-xs text-zinc-950 hover:bg-emerald-400"
                      >
                        Marcar pago
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(r.id, "reject")}
                        className="border-zinc-700 text-xs text-red-400"
                      >
                        Rejeitar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
