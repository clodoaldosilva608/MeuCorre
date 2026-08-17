"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DollarSign, TrendingUp, ShoppingCart, RefreshCw, Loader2,
  ExternalLink, CheckCircle2, XCircle, Clock, AlertCircle,
} from "lucide-react";

interface RevenueEntry {
  id: string;
  date: string;
  source: string;
  description: string | null;
  amount: number;
  cost: number;
  productId: string | null;
  metadata: any;
  createdAt: string;
}

interface KiwifyOrder {
  id?: string;
  order_id?: string;
  status?: string;
  total?: number;
  price?: number;
  customer?: { name?: string; email?: string };
  product?: { name?: string };
  product_name?: string;
  created_at?: string;
  payment_method?: string;
}

interface KiwifyProduct {
  id?: string;
  product_id?: string;
  name?: string;
  title?: string;
  price?: number;
  status?: string;
  affiliate_commission?: number;
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  adsense: { label: "AdSense", color: "#10b981" },
  affiliates: { label: "Afiliados", color: "#3b82f6" },
  sponsorships: { label: "Patrocínios", color: "#a855f7" },
  products: { label: "Produtos", color: "#f59e0b" },
  subscription: { label: "Assinaturas", color: "#10b981" },
  live: { label: "Lives", color: "#ef4444" },
  toolkit: { label: "Toolkit", color: "#f59e0b" },
  course: { label: "Curso", color: "#a855f7" },
  ebook: { label: "E-book", color: "#ec4899" },
  other: { label: "Outros", color: "#64748b" },
};

export default function AdminVendasPage() {
  const [revenueEntries, setRevenueEntries] = useState<RevenueEntry[]>([]);
  const [kiwifyOrders, setKiwifyOrders] = useState<KiwifyOrder[]>([]);
  const [kiwifyProducts, setKiwifyProducts] = useState<KiwifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [revRes, ordersRes, productsRes] = await Promise.all([
        fetch("/api/admin/revenue?days=90"),
        fetch("/api/admin/kiwify/orders?days=30").catch(() => null),
        fetch("/api/admin/kiwify/products").catch(() => null),
      ]);

      if (revRes.ok) {
        const data = await revRes.json();
        setRevenueEntries(data.entries ?? []);
      }

      if (ordersRes?.ok) {
        const data = await ordersRes.json();
        setKiwifyOrders(data.orders ?? []);
      }

      if (productsRes?.ok) {
        const data = await productsRes.json();
        setKiwifyProducts(data.products ?? []);
      }

      setLastUpdate(new Date());
    } catch (err) {
      toast.error("Erro ao carregar vendas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  // Stats
  const totalRevenue = revenueEntries
    .filter((e) => e.amount > 0)
    .reduce((s, e) => s + e.amount, 0);
  const totalCost = revenueEntries.reduce((s, e) => s + e.cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const totalSales = revenueEntries.filter((e) => e.amount > 0).length;

  // Receita por fonte
  const bySource: Record<string, { total: number; count: number }> = {};
  for (const entry of revenueEntries.filter((e) => e.amount > 0)) {
    if (!bySource[entry.source]) bySource[entry.source] = { total: 0, count: 0 };
    bySource[entry.source].total += entry.amount;
    bySource[entry.source].count += 1;
  }

  // Kiwify stats
  const kiwifyTotal = kiwifyOrders.reduce(
    (s, o) => s + (o.total || o.price || 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Vendas</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Vendas em tempo real — Kiwify + receita registrada manualmente
            {lastUpdate && (
              <span className="ml-2 text-xs">
                · Atualizado: {lastUpdate.toLocaleTimeString("pt-BR")}
              </span>
            )}
          </p>
        </div>
        <Button onClick={load} disabled={refreshing} variant="outline" className="gap-1.5">
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Atualizar
        </Button>
      </div>

      {/* Stats principais */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Receita total (90 dias)"
          value={`R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          color="#10b981"
        />
        <StatCard
          icon={TrendingUp}
          label="Lucro líquido"
          value={`R$ ${totalProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          color="#3b82f6"
          sub={`Custo: R$ ${totalCost.toFixed(2)}`}
        />
        <StatCard
          icon={ShoppingCart}
          label="Vendas (90 dias)"
          value={String(totalSales)}
          color="#a855f7"
        />
        <StatCard
          icon={DollarSign}
          label="Kiwify (30 dias)"
          value={`R$ ${kiwifyTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          color="#f59e0b"
          sub={`${kiwifyOrders.length} pedidos`}
        />
      </div>

      {/* Configuração do Webhook */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
          <div className="flex-1">
            <p className="text-sm font-bold text-blue-400">
              Configuração do Webhook Kiwify
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Para receber vendas automaticamente, configure o webhook na Kiwify:
            </p>
            <ol className="mt-2 space-y-1 text-xs text-zinc-400">
              <li>1. Acesse <strong>Kiwify → Apps → Webhooks</strong></li>
              <li>2. Clique em <strong>"Criar Webhook"</strong></li>
              <li>3. URL: <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">https://meucorre.vercel.app/api/webhooks/kiwify</code></li>
              <li>4. Eventos: <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">order_approved</code>, <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">order_refunded</code>, <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">order_canceled</code></li>
              <li>5. Secret: <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">y3un7jHjRipUfig</code> (já configurado)</li>
            </ol>
            <a
              href="https://kiwify.com.br/apps/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:underline"
            >
              Abrir Kiwify Webhooks
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Receita por fonte */}
      {Object.keys(bySource).length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-bold text-zinc-100">Receita por fonte (90 dias)</h2>
          <div className="mt-3 space-y-2">
            {Object.entries(bySource)
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([source, data]) => {
                const info = SOURCE_LABELS[source] ?? { label: source, color: "#64748b" };
                return (
                  <div key={source} className="flex items-center justify-between rounded bg-zinc-950 p-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: info.color }}
                      />
                      <span className="text-sm font-medium text-zinc-200">{info.label}</span>
                      <span className="text-[10px] text-zinc-500">{data.count} vendas</span>
                    </div>
                    <p className="text-sm font-bold text-emerald-400">
                      R$ {data.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Produtos da Kiwify */}
      {kiwifyProducts.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-bold text-zinc-100">
            Produtos na Kiwify ({kiwifyProducts.length})
          </h2>
          <div className="mt-3 space-y-2">
            {kiwifyProducts.map((p, i) => (
              <div key={p.id || p.product_id || i} className="flex items-center justify-between rounded bg-zinc-950 p-3">
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {p.name || p.title || `Produto ${i + 1}`}
                  </p>
                  <p className="text-[10px] text-zinc-500">ID: {p.id || p.product_id}</p>
                </div>
                <div className="text-right">
                  {p.price && (
                    <p className="text-sm font-bold text-emerald-400">
                      R$ {p.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  )}
                  {p.affiliate_commission && (
                    <p className="text-[10px] text-blue-400">
                      {p.affiliate_commission}% comissão
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pedidos recentes da Kiwify */}
      {kiwifyOrders.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-bold text-zinc-100">
            Pedidos Kiwify (últimos 30 dias)
          </h2>
          <div className="mt-3 space-y-2">
            {kiwifyOrders.slice(0, 20).map((o, i) => {
              const status = o.status || "unknown";
              const statusInfo = getStatusInfo(status);
              return (
                <div key={o.id || o.order_id || i} className="flex items-center justify-between rounded bg-zinc-950 p-3">
                  <div className="flex items-center gap-3">
                    <statusInfo.icon className={`h-4 w-4 ${statusInfo.colorClass}`} />
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        {o.customer?.name || "Cliente"}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {o.product?.name || o.product_name || "Produto"} · {o.customer?.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">
                      R$ {(o.total || o.price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <Badge variant="outline" className={`mt-1 ${statusInfo.badgeClass}`}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Histórico de receita (do banco) */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="text-sm font-bold text-zinc-100">
          Histórico de receita registrada ({revenueEntries.length})
        </h2>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-zinc-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando...
          </div>
        ) : revenueEntries.length === 0 ? (
          <div className="mt-3 rounded bg-zinc-950 p-6 text-center">
            <ShoppingCart className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
            <p className="text-sm text-zinc-400">Nenhuma venda registrada ainda</p>
            <p className="mt-1 text-xs text-zinc-500">
              As vendas aparecerão aqui automaticamente quando o webhook da Kiwify for configurado.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
            {revenueEntries.slice(0, 50).map((entry) => {
              const info = SOURCE_LABELS[entry.source] ?? { label: entry.source, color: "#64748b" };
              return (
                <div key={entry.id} className="flex items-start justify-between rounded bg-zinc-950 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: info.color }}
                      />
                      <span className="text-xs font-medium text-zinc-200">
                        {info.label}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(entry.date).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-400 truncate">
                      {entry.description}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    {entry.amount > 0 ? (
                      <>
                        <p className="text-sm font-bold text-emerald-400">
                          +R$ {entry.amount.toFixed(2)}
                        </p>
                        {entry.cost > 0 && (
                          <p className="text-[10px] text-red-400">
                            -R$ {entry.cost.toFixed(2)} (custo)
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm font-bold text-red-400">
                        -R$ {entry.cost.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusInfo(status: string) {
  const s = status.toLowerCase();
  if (s.includes("approved") || s.includes("paid") || s.includes("completed")) {
    return {
      label: "Aprovado",
      icon: CheckCircle2,
      colorClass: "text-emerald-400",
      badgeClass: "border-emerald-500/30 text-emerald-400",
    };
  }
  if (s.includes("refund") || s.includes("canceled") || s.includes("cancel")) {
    return {
      label: "Cancelado",
      icon: XCircle,
      colorClass: "text-red-400",
      badgeClass: "border-red-500/30 text-red-400",
    };
  }
  if (s.includes("pending") || s.includes("waiting") || s.includes("processing")) {
    return {
      label: "Pendente",
      icon: Clock,
      colorClass: "text-amber-400",
      badgeClass: "border-amber-500/30 text-amber-400",
    };
  }
  return {
    label: status,
    icon: AlertCircle,
    colorClass: "text-zinc-400",
    badgeClass: "border-zinc-700 text-zinc-400",
  };
}

function StatCard({
  icon: Icon, label, value, sub, color,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center gap-2 text-zinc-500">
        <Icon className="h-4 w-4" style={{ color }} />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-zinc-100">{value}</p>
      {sub && <p className="mt-1 text-[10px] text-zinc-500">{sub}</p>}
    </div>
  );
}
