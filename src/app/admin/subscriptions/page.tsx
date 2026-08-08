"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CreditCard,
  Check,
  X,
  Eye,
  Mail,
  Phone,
  MapPin,
  Clock,
  Copy,
  CheckCheck,
} from "lucide-react";

interface Subscription {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  buyerCity: string | null;
  amount: number;
  pixKey: string;
  receiptUrl: string | null;
  receiptNotes: string | null;
  status: "pending" | "approved" | "rejected";
  reviewedAt: Date | null;
  reviewNotes: string | null;
  licenseKey: string | null;
  createdAt: Date;
}

type Filter = "all" | "pending" | "approved" | "rejected";

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [reviewing, setReviewing] = useState<Subscription | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/admin/subscriptions?status=${filter === "all" ? "all" : filter}`,
    );
    if (res.ok) {
      const data = await res.json();
      setSubs(data.subscriptions);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleReview = async (
    action: "approve" | "reject",
    reviewNotes: string,
  ) => {
    if (!reviewing) return;
    const res = await fetch("/api/admin/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reviewing.id, action, reviewNotes }),
    });
    if (res.ok) {
      const data = await res.json();
      toast.success(
        action === "approve" ? "Assinatura aprovada!" : "Assinatura rejeitada",
        {
          description:
            action === "approve"
              ? `Licença gerada: ${data.licenseKey}`
              : undefined,
        },
      );
      setReviewing(null);
      load();
    } else {
      toast.error("Erro ao processar");
    }
  };

  const stats = {
    total: subs.length,
    pending: subs.filter((s) => s.status === "pending").length,
    approved: subs.filter((s) => s.status === "approved").length,
    revenue: subs
      .filter((s) => s.status === "approved")
      .reduce((sum, s) => sum + Number(s.amount), 0),
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-100">
          <CreditCard className="h-5 w-5 text-emerald-400" />
          Assinaturas
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Valide comprovantes Pix e ative licenças PRO
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total" value={stats.total.toString()} />
        <StatCard label="Pendentes" value={stats.pending.toString()} accent="amber" />
        <StatCard label="Aprovadas" value={stats.approved.toString()} accent="emerald" />
        <StatCard
          label="Receita"
          value={stats.revenue.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
          accent="emerald"
        />
      </div>

      {/* Filtros */}
      <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
        {(["pending", "approved", "rejected", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${
              filter === f
                ? "bg-emerald-500 text-zinc-950"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            {f === "pending"
              ? "Pendentes"
              : f === "approved"
                ? "Aprovadas"
                : f === "rejected"
                  ? "Rejeitadas"
                  : "Todas"}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <p className="py-8 text-center text-sm text-zinc-500">Carregando...</p>
      ) : subs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <CreditCard className="mx-auto mb-2 h-10 w-10 text-zinc-700" />
          <p className="text-sm font-medium text-zinc-300">
            Nenhuma assinatura {filter !== "all" ? filter : ""} ainda
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {subs.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-zinc-100">
                      {s.buyerName}
                    </span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="mt-1.5 space-y-0.5 text-[11px] text-zinc-500">
                    <p className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      {s.buyerEmail}
                    </p>
                    {s.buyerPhone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" />
                        {s.buyerPhone}
                      </p>
                    )}
                    {s.buyerCity && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        {s.buyerCity}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {new Date(s.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  {s.receiptNotes && (
                    <p className="mt-2 rounded bg-zinc-800/50 p-2 text-[11px] text-zinc-400">
                      <strong className="text-zinc-300">Obs. do cliente:</strong>{" "}
                      {s.receiptNotes}
                    </p>
                  )}
                  {s.licenseKey && (
                    <LicenseKey licenseKey={s.licenseKey} />
                  )}
                  {s.reviewNotes && (
                    <p className="mt-2 text-[11px] text-zinc-500">
                      <strong>Resenha admin:</strong> {s.reviewNotes}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-emerald-400">
                    R$ {Number(s.amount).toFixed(2).replace(".", ",")}
                  </p>
                  {s.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => setReviewing(s)}
                      className="mt-2 bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                    >
                      Revisar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReviewDialog
        sub={reviewing}
        onClose={() => setReviewing(null)}
        onReview={handleReview}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald" | "amber";
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <p className="text-[10px] font-medium text-zinc-500">{label}</p>
      <p
        className={`mt-1 text-xl font-black ${
          accent === "emerald"
            ? "text-emerald-400"
            : accent === "amber"
              ? "text-amber-400"
              : "text-zinc-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: Subscription["status"] }) {
  const map = {
    pending: { label: "Pendente", cls: "bg-amber-500/15 text-amber-400" },
    approved: { label: "Aprovada", cls: "bg-emerald-500/15 text-emerald-400" },
    rejected: { label: "Rejeitada", cls: "bg-red-500/15 text-red-400" },
  }[status];
  return (
    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${map.cls}`}>
      {map.label}
    </span>
  );
}

function LicenseKey({ licenseKey }: { licenseKey: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2">
      <code className="flex-1 truncate font-mono text-[11px] text-emerald-400">
        {licenseKey}
      </code>
      <button
        onClick={copy}
        className="grid h-6 w-6 shrink-0 place-items-center rounded text-emerald-400 hover:bg-emerald-500/20"
      >
        {copied ? (
          <CheckCheck className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

// ===== Dialog de revisão =====

function ReviewDialog({
  sub,
  onClose,
  onReview,
}: {
  sub: Subscription | null;
  onClose: () => void;
  onReview: (
    action: "approve" | "reject",
    reviewNotes: string,
  ) => void;
}) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (sub) setNotes("");
  }, [sub]);

  if (!sub) return null;

  return (
    <Dialog open={!!sub} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md gap-0 overflow-y-auto border-zinc-800 bg-zinc-950 p-0 text-zinc-100">
        <DialogHeader className="border-b border-zinc-800 px-5 py-4">
          <DialogTitle className="text-base font-bold text-emerald-400">
            Revisar assinatura
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            {sub.buyerName} • R$ {Number(sub.amount).toFixed(2).replace(".", ",")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5">
          {/* Dados do comprador */}
          <div className="space-y-1.5 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs">
            <p className="flex items-center gap-1.5 text-zinc-300">
              <Mail className="h-3 w-3" />
              {sub.buyerEmail}
            </p>
            {sub.buyerPhone && (
              <p className="flex items-center gap-1.5 text-zinc-400">
                <Phone className="h-3 w-3" />
                {sub.buyerPhone}
              </p>
            )}
            {sub.buyerCity && (
              <p className="flex items-center gap-1.5 text-zinc-400">
                <MapPin className="h-3 w-3" />
                {sub.buyerCity}
              </p>
            )}
            <p className="flex items-center gap-1.5 text-zinc-400">
              <Clock className="h-3 w-3" />
              {new Date(sub.createdAt).toLocaleString("pt-BR")}
            </p>
            {sub.receiptNotes && (
              <p className="mt-2 rounded bg-zinc-800/50 p-2 text-zinc-400">
                <strong className="text-zinc-300">Obs.:</strong>{" "}
                {sub.receiptNotes}
              </p>
            )}
          </div>

          {/* Comprovante */}
          {sub.receiptUrl ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">
                Comprovante Pix enviado
              </Label>
              <a
                href={sub.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
              >
                <img
                  src={sub.receiptUrl}
                  alt="Comprovante"
                  className="max-h-72 w-full object-contain"
                />
              </a>
              <a
                href={sub.receiptUrl}
                download={`comprovante-${sub.buyerName}.png`}
                className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-400 hover:underline"
              >
                <Eye className="h-3 w-3" />
                Ver comprovante em tamanho real
              </a>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300">
              ⚠️ Cliente ainda não enviou comprovante. Verifique se o Pix foi
              recebido na sua conta antes de aprovar.
            </div>
          )}

          {/* Notas do admin */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">
              Notas (visíveis ao cliente)
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Comprovante verificado, licença liberada."
              rows={2}
              className="resize-none border-zinc-800 bg-zinc-900 text-zinc-100 focus:border-emerald-500"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-zinc-800 px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onReview("reject", notes)}
            className="flex-1 border border-red-500/40 text-red-400 hover:bg-red-950/40"
          >
            <X className="mr-1.5 h-4 w-4" />
            Rejeitar
          </Button>
          <Button
            type="button"
            onClick={() => onReview("approve", notes)}
            className="flex-1 bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400"
          >
            <Check className="mr-1.5 h-4 w-4" />
            Aprovar e gerar licença
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
