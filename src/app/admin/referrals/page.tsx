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
  AlertTriangle,
  Ban,
  Search,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Referral {
  id: string;
  referrerName: string;
  referrerEmail: string;
  referrerId: string;
  referrerCode: string;
  referredName: string;
  referredEmail: string;
  referredId: string;
  status: string;
  payoutAmount: number;
  payoutPixKey: string | null;
  adminNotes: string | null;
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
  startsAt: string | null;
  endsAt: string | null;
}

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<Record<string, { count: number; total: number }>>({});
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [editReward, setEditReward] = useState("5");

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
      setEditReward(String(campData.campaign.rewardAmount));
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

  const updateReward = async () => {
    const res = await fetch("/api/admin/referrals/campaign", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardAmount: Number(editReward) }),
    });
    if (res.ok) {
      const data = await res.json();
      setCampaign(data.campaign);
      toast.success(`Recompensa atualizada para R$ ${editReward}`);
    }
  };

  const handleAction = async (id: string, action: "pay" | "reject") => {
    const pixKey = action === "pay"
      ? prompt("Chave PIX do referrer (para registro):") || ""
      : undefined;
    const notes = action === "reject"
      ? prompt("Motivo da rejeição (obrigatório):") || ""
      : undefined;

    if (action === "reject" && !notes) {
      toast.error("Motivo da rejeição é obrigatório");
      return;
    }

    const res = await fetch("/api/admin/referrals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, pixKey, notes }),
    });
    if (res.ok) {
      toast.success(action === "pay" ? "Indicação marcada como paga ✅" : "Indicação rejeitada");
      setSelectedReferral(null);
      load();
    } else {
      const data = await res.json();
      toast.error(data.error || "Erro ao processar");
    }
  };

  const exportCSV = () => {
    const headers = ["Referrer", "Referrer Email", "Indicado", "Indicado Email", "Status", "Recompensa", "Convertido em", "Pago em", "PIX", "Notas", "Criado em"];
    const rows = filteredReferrals.map((r) => [
      r.referrerName,
      r.referrerEmail,
      r.referredName,
      r.referredEmail,
      r.status,
      r.payoutAmount,
      r.convertedAt ? new Date(r.convertedAt).toLocaleDateString("pt-BR") : "",
      r.paidAt ? new Date(r.paidAt).toLocaleDateString("pt-BR") : "",
      r.payoutPixKey || "",
      r.adminNotes || "",
      new Date(r.createdAt).toLocaleDateString("pt-BR"),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `referrals-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  const statusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-amber-400";
      case "converted": return "text-blue-400";
      case "paid": return "text-emerald-400";
      case "rejected": return "text-red-400";
      default: return "text-zinc-400";
    }
  };

  // Filter by search
  const filteredReferrals = referrals.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.referrerName.toLowerCase().includes(q) ||
      r.referrerEmail.toLowerCase().includes(q) ||
      r.referredName.toLowerCase().includes(q) ||
      r.referredEmail.toLowerCase().includes(q) ||
      r.referrerCode?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-100">
            <Gift className="h-5 w-5 text-emerald-400" />
            Indicações
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Gerencie o programa &quot;Indique e Ganhe&quot;
          </p>
        </div>
        <Link href="/admin/dashboard" className="flex items-center gap-1 text-sm text-zinc-400 hover:text-emerald-400">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      {/* Anti-fraude warning */}
      <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
        <div className="text-xs text-red-300">
          <strong>Atenção:</strong> Tentativas de fraude (auto-indicação, múltiplas contas falsas,
          indicações forjadas) resultam em <strong>banimento permanente</strong> da plataforma
          e perda de todas as recompensas. Audite cada conversão antes de pagar.
        </div>
      </div>

      {/* Campaign config */}
      {campaign && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-bold text-zinc-100">{campaign.name}</p>
              <div className="flex items-center gap-3">
                <label className="text-xs text-zinc-500">Recompensa: R$</label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={editReward}
                  onChange={(e) => setEditReward(e.target.value)}
                  className="w-20 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
                />
                <button
                  onClick={updateReward}
                  className="rounded bg-emerald-500 px-2 py-1 text-xs font-bold text-zinc-950 hover:bg-emerald-400"
                >
                  Salvar
                </button>
              </div>
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

      {/* Search + Export */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <Input
            type="text"
            placeholder="Buscar por nome, email ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-zinc-800 bg-zinc-900 pl-9 text-zinc-100"
          />
        </div>
        <Button
          variant="outline"
          onClick={exportCSV}
          className="border-zinc-800 text-zinc-300 hover:bg-zinc-800"
        >
          <Download className="mr-1.5 h-4 w-4" />
          CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
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
      ) : filteredReferrals.length === 0 ? (
        <p className="text-center text-zinc-500">Nenhuma indicação encontrada</p>
      ) : (
        <div className="space-y-2">
          {filteredReferrals.map((r) => (
            <div
              key={r.id}
              className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition-colors hover:border-zinc-700"
              onClick={() => setSelectedReferral(r)}
            >
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
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-bold text-emerald-400">R$ {r.payoutAmount.toFixed(2)}</span>
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
                    <span className={statusColor(r.status)}>{statusLabel(r.status)}</span>
                    {r.adminNotes && (
                      <span className="text-zinc-600">📝 {r.adminNotes}</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {r.status === "converted" && (
                    <>
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleAction(r.id, "pay"); }}
                        className="bg-emerald-500 text-xs text-zinc-950 hover:bg-emerald-400"
                      >
                        Marcar pago
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); handleAction(r.id, "reject"); }}
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

      {/* Detail modal */}
      {selectedReferral && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          onClick={() => setSelectedReferral(null)}
        >
          <div
            className="w-full max-w-md space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-zinc-100">Detalhes da Indicação</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Quem indicou:</span>
                <span className="font-medium text-zinc-200">{selectedReferral.referrerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Email do indicador:</span>
                <span className="text-zinc-300">{selectedReferral.referrerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Quem foi indicado:</span>
                <span className="font-medium text-zinc-200">{selectedReferral.referredName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Email do indicado:</span>
                <span className="text-zinc-300">{selectedReferral.referredEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Status:</span>
                <span className={statusColor(selectedReferral.status)}>{statusLabel(selectedReferral.status)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Recompensa:</span>
                <span className="font-bold text-emerald-400">R$ {selectedReferral.payoutAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Criado em:</span>
                <span className="text-zinc-300">{new Date(selectedReferral.createdAt).toLocaleString("pt-BR")}</span>
              </div>
              {selectedReferral.convertedAt && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Convertido em:</span>
                  <span className="text-zinc-300">{new Date(selectedReferral.convertedAt).toLocaleString("pt-BR")}</span>
                </div>
              )}
              {selectedReferral.paidAt && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Pago em:</span>
                  <span className="text-zinc-300">{new Date(selectedReferral.paidAt).toLocaleString("pt-BR")}</span>
                </div>
              )}
              {selectedReferral.payoutPixKey && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Chave PIX:</span>
                  <span className="text-zinc-300">{selectedReferral.payoutPixKey}</span>
                </div>
              )}
              {selectedReferral.adminNotes && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-xs text-zinc-400">
                  <strong className="text-zinc-300">Notas admin:</strong> {selectedReferral.adminNotes}
                </div>
              )}
            </div>

            {/* Anti-fraude check */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300">
              <strong>⚠️ Checklist anti-fraude antes de pagar:</strong>
              <ul className="mt-1 space-y-0.5">
                <li>• Referrer e indicado têm emails diferentes</li>
                <li>• Referrer e indicado têm IPs/telefones diferentes</li>
                <li>• Indicado tem pagamento real confirmado (não admin_grant)</li>
                <li>• Indicado não foi indicado por outra pessoa</li>
              </ul>
            </div>

            <div className="flex gap-2">
              {selectedReferral.status === "converted" && (
                <>
                  <Button
                    onClick={() => handleAction(selectedReferral.id, "pay")}
                    className="flex-1 bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                  >
                    Marcar como Pago
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAction(selectedReferral.id, "reject")}
                    className="border-red-500/40 text-red-400 hover:bg-red-950/30"
                  >
                    Rejeitar
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                onClick={() => setSelectedReferral(null)}
                className="text-zinc-400"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
