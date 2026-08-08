"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Megaphone,
  CreditCard,
  MessageSquare,
  TrendingUp,
  Eye,
  MousePointerClick,
  DollarSign,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";

interface DashboardData {
  ads: {
    total: number;
    active: number;
    views: number;
    clicks: number;
    ctr: number;
  };
  subscriptions: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    revenue: number;
  };
  feedbacks: {
    total: number;
    avgRating: number;
  };
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/dashboard");
    if (res.ok) {
      const json = await res.json();
      setData(json);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-4xl py-8 text-center text-sm text-zinc-500">
        Carregando dashboard...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Dashboard</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Visão geral do MeuCorre em tempo real
        </p>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Receita"
          value={`R$ ${data.subscriptions.revenue.toFixed(2).replace(".", ",")}`}
          icon={<DollarSign className="h-3.5 w-3.5" />}
          accent="emerald"
        />
        <StatCard
          label="Vendas aprovadas"
          value={data.subscriptions.approved.toString()}
          icon={<CheckCircle className="h-3.5 w-3.5" />}
          accent="emerald"
        />
        <StatCard
          label="Pendentes"
          value={data.subscriptions.pending.toString()}
          icon={<Clock className="h-3.5 w-3.5" />}
          accent="amber"
        />
        <StatCard
          label="Avaliação média"
          value={data.feedbacks.avgRating > 0 ? `${data.feedbacks.avgRating} ⭐` : "—"}
          icon={<Star className="h-3.5 w-3.5" />}
          accent="amber"
        />
      </div>

      {/* Seção: Anúncios */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <Megaphone className="h-4 w-4 text-emerald-400" />
            Anúncios
          </h2>
          <Link
            href="/admin/ads"
            className="flex items-center gap-1 text-xs text-emerald-400 hover:underline"
          >
            Gerenciar <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniStat label="Total" value={data.ads.total} />
          <MiniStat label="Ativos" value={data.ads.active} accent="emerald" />
          <MiniStat
            label="Views"
            value={data.ads.views}
            icon={<Eye className="h-3 w-3" />}
          />
          <MiniStat
            label="Cliques"
            value={data.ads.clicks}
            icon={<MousePointerClick className="h-3 w-3" />}
          />
        </div>
        <div className="mt-3 rounded-lg bg-zinc-800/50 p-2 text-center text-xs text-zinc-400">
          CTR (taxa de cliques):{" "}
          <span className="font-bold text-emerald-400">{data.ads.ctr}%</span>
        </div>
      </section>

      {/* Seção: Assinaturas */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <CreditCard className="h-4 w-4 text-emerald-400" />
            Assinaturas
          </h2>
          <Link
            href="/admin/subscriptions"
            className="flex items-center gap-1 text-xs text-emerald-400 hover:underline"
          >
            Gerenciar <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniStat label="Total" value={data.subscriptions.total} />
          <MiniStat
            label="Aprovadas"
            value={data.subscriptions.approved}
            icon={<CheckCircle className="h-3 w-3" />}
            accent="emerald"
          />
          <MiniStat
            label="Pendentes"
            value={data.subscriptions.pending}
            icon={<Clock className="h-3 w-3" />}
            accent="amber"
          />
          <MiniStat
            label="Rejeitadas"
            value={data.subscriptions.rejected}
            icon={<XCircle className="h-3 w-3" />}
            accent="red"
          />
        </div>
      </section>

      {/* Seção: Feedbacks */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <MessageSquare className="h-4 w-4 text-emerald-400" />
            Feedbacks dos usuários
          </h2>
          <Link
            href="/admin/feedback"
            className="flex items-center gap-1 text-xs text-emerald-400 hover:underline"
          >
            Ver todos <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="Total" value={data.feedbacks.total} />
          <MiniStat
            label="Nota média"
            value={data.feedbacks.avgRating > 0 ? `${data.feedbacks.avgRating}/5` : "—"}
            icon={<Star className="h-3 w-3" />}
            accent="amber"
          />
        </div>
      </section>

      {/* Atalhos */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-200">
          Atalhos rápidos
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Link
            href="/admin/ads"
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm font-medium text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400"
          >
            <Megaphone className="h-4 w-4" />
            Cadastrar anúncio
          </Link>
          <Link
            href="/admin/subscriptions"
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm font-medium text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400"
          >
            <CreditCard className="h-4 w-4" />
            Revisar vendas
          </Link>
          <Link
            href="/admin/feedback"
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm font-medium text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400"
          >
            <MessageSquare className="h-4 w-4" />
            Ler feedbacks
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: "emerald" | "amber" | "red";
}) {
  const color =
    accent === "emerald"
      ? "text-emerald-400"
      : accent === "amber"
        ? "text-amber-400"
        : accent === "red"
          ? "text-red-400"
          : "text-zinc-100";
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500">
        {icon}
        {label}
      </div>
      <p className={`mt-1 text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  accent?: "emerald" | "amber" | "red";
}) {
  const color =
    accent === "emerald"
      ? "text-emerald-400"
      : accent === "amber"
        ? "text-amber-400"
        : accent === "red"
          ? "text-red-400"
          : "text-zinc-100";
  return (
    <div className="rounded-lg bg-zinc-800/50 p-2 text-center">
      <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-500">
        {icon}
        {label}
      </div>
      <p className={`mt-0.5 text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
