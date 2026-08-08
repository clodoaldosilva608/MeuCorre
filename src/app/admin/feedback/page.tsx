"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  MessageSquare,
  Star,
  Trash2,
  Clock,
  Mail,
  Filter,
} from "lucide-react";

interface Feedback {
  id: string;
  rating: number;
  message: string;
  userAgent: string | null;
  page: string | null;
  createdAt: string;
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<Feedback | null>(null);
  const [filter, setFilter] = useState<"all" | 5 | 4 | 3 | 2 | 1>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/feedback?limit=500");
    if (res.ok) {
      const data = await res.json();
      setFeedbacks(data.feedbacks);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const res = await fetch(`/api/admin/feedback?id=${confirmDelete.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Feedback excluído");
      setConfirmDelete(null);
      load();
    } else {
      toast.error("Erro ao excluir");
    }
  };

  const filtered =
    filter === "all"
      ? feedbacks
      : feedbacks.filter((f) => f.rating === filter);

  const stats = {
    total: feedbacks.length,
    avg:
      feedbacks.length > 0
        ? (
            feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length
          ).toFixed(1)
        : "—",
    five: feedbacks.filter((f) => f.rating === 5).length,
    one: feedbacks.filter((f) => f.rating === 1).length,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-zinc-100">
          <MessageSquare className="h-5 w-5 text-emerald-400" />
          Feedbacks
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          O que os usuários estão falando do MeuCorre
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total" value={stats.total.toString()} />
        <StatCard
          label="Nota média"
          value={stats.avg}
          accent="amber"
        />
        <StatCard
          label="5 estrelas"
          value={stats.five.toString()}
          accent="emerald"
        />
        <StatCard
          label="1 estrela"
          value={stats.one.toString()}
          accent="red"
        />
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-zinc-500" />
        <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          {[
            { v: "all", label: "Todas" },
            { v: 5, label: "5 ⭐" },
            { v: 4, label: "4 ⭐" },
            { v: 3, label: "3 ⭐" },
            { v: 2, label: "2 ⭐" },
            { v: 1, label: "1 ⭐" },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setFilter(f.v as typeof filter)}
              className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${
                filter === f.v
                  ? "bg-emerald-500 text-zinc-950"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <p className="py-8 text-center text-sm text-zinc-500">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <MessageSquare className="mx-auto mb-2 h-10 w-10 text-zinc-700" />
          <p className="text-sm font-medium text-zinc-300">
            Nenhum feedback {filter !== "all" ? `com ${filter} estrelas` : ""} ainda
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((f) => (
            <div
              key={f.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-3.5 w-3.5 ${
                            n <= f.rating
                              ? "fill-amber-400 text-amber-400"
                              : "fill-zinc-800 text-zinc-700"
                          }`}
                        />
                      ))}
                    </div>
                    {f.page && (
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400">
                        {f.page}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(f.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-300">{f.message}</p>
                  {f.userAgent && (
                    <p className="mt-2 flex items-center gap-1 truncate text-[10px] text-zinc-600">
                      <Mail className="h-2.5 w-2.5" />
                      {f.userAgent.slice(0, 80)}
                      {f.userAgent.length > 80 ? "..." : ""}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setConfirmDelete(f)}
                  aria-label="Excluir feedback"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded text-zinc-400 hover:bg-red-950/40 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirma exclusão */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir feedback?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-800 text-zinc-300 hover:bg-zinc-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <p className="text-[10px] font-medium text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}
