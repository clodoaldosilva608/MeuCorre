"use client";

import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { Header } from "@/components/meucorre/header";
import { SummaryCards } from "@/components/meucorre/summary-cards";
import { PeriodFilter, periodLabel } from "@/components/meucorre/period-filter";
import { AppSummary } from "@/components/meucorre/app-summary";
import { DeliveryList } from "@/components/meucorre/delivery-list";
import { DeliveryForm } from "@/components/meucorre/delivery-form";
import { Fab } from "@/components/meucorre/fab";
import { SplashScreen } from "@/components/meucorre/splash-screen";
import {
  useDeliveries,
  filterByPeriod,
  computeStats,
  exportJSON,
  exportCSV,
  downloadFile,
} from "@/hooks/use-deliveries";
import type { AppName, Delivery, PeriodFilter as Period } from "@/lib/types";
import { todayISO } from "@/lib/apps";
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

export default function Home() {
  // Splash some por ~1.4s no primeiro carregamento
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1400);
    return () => clearTimeout(t);
  }, []);

  const [period, setPeriod] = useState<Period>("hoje");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Delivery | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Delivery | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const { allDeliveries, addDelivery, updateDelivery, deleteDelivery, clearAll } =
    useDeliveries();

  // Estatísticas do período atual
  const filtered = useMemo(
    () => filterByPeriod(allDeliveries, period),
    [allDeliveries, period],
  );
  const stats = useMemo(() => computeStats(filtered), [filtered]);

  // Corridas de hoje (para mostrar sempre, mesmo em outro período)
  const todayCount = useMemo(() => {
    const t = todayISO();
    return allDeliveries.filter((d) => d.date === t).length;
  }, [allDeliveries]);

  const handleAdd = async (data: {
    app: AppName;
    value: number;
    km: number;
    notes?: string;
  }) => {
    if (editing?.id) {
      await updateDelivery(editing.id, data);
      toast.success("Corrida atualizada!", {
        description: `${data.app} • R$ ${data.value.toFixed(2).replace(".", ",")}`,
      });
    } else {
      await addDelivery(data);
      toast.success("Corrida lançada! 🚀", {
        description: `${data.app} • R$ ${data.value.toFixed(2).replace(".", ",")}`,
      });
    }
    setEditing(null);
  };

  const handleEdit = (d: Delivery) => {
    setEditing(d);
    setFormOpen(true);
  };

  const handleDelete = (d: Delivery) => setConfirmDelete(d);

  const confirmDeleteAction = async () => {
    if (confirmDelete?.id) {
      await deleteDelivery(confirmDelete.id);
      toast.success("Corrida excluída", {
        description: confirmDelete.app,
      });
    }
    setConfirmDelete(null);
  };

  const handleClearAll = () => setConfirmClear(true);
  const confirmClearAction = async () => {
    await clearAll();
    setConfirmClear(false);
    toast.success("Todos os dados foram apagados");
  };

  const handleExportJSON = () => {
    if (allDeliveries.length === 0) {
      toast.error("Nenhuma corrida para exportar");
      return;
    }
    const content = exportJSON(allDeliveries);
    downloadFile(content, `meucorre-backup-${todayISO()}.json`, "application/json");
    toast.success(`Backup JSON exportado (${allDeliveries.length} corridas)`);
  };

  const handleExportCSV = () => {
    if (allDeliveries.length === 0) {
      toast.error("Nenhuma corrida para exportar");
      return;
    }
    const content = exportCSV(allDeliveries);
    downloadFile(content, `meucorre-${todayISO()}.csv`, "text/csv;charset=utf-8");
    toast.success(`CSV exportado (${allDeliveries.length} corridas)`);
  };

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <SplashScreen visible={showSplash} />

      <Header
        onExportJSON={handleExportJSON}
        onExportCSV={handleExportCSV}
        onClearAll={handleClearAll}
      />

      <main className="mx-auto w-full max-w-md flex-1 space-y-5 px-4 pb-28 pt-4">
        {/* Indicador de hoje (sempre visível) */}
        {todayCount > 0 && period !== "hoje" && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-950/30 px-3 py-2 text-xs">
            <span className="text-emerald-300">
              Você tem {todayCount}{" "}
              {todayCount === 1 ? "corrida" : "corridas"} hoje
            </span>
            <button
              onClick={() => setPeriod("hoje")}
              className="font-semibold text-emerald-400 underline-offset-2 hover:underline"
            >
              ver hoje
            </button>
          </div>
        )}

        <SummaryCards stats={stats} periodLabel={periodLabel(period)} />

        <PeriodFilter value={period} onChange={setPeriod} />

        <AppSummary stats={stats} />

        <DeliveryList
          deliveries={filtered}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Rodapé minimalista */}
        <footer className="pt-4 text-center">
          <p className="text-[10px] text-zinc-600">
            ⚡ MeuCorre • 100% offline • seus dados ficam só no seu celular
          </p>
        </footer>
      </main>

      <Fab onClick={openNew} />

      <DeliveryForm
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        onSubmit={handleAdd}
        editing={editing}
      />

      {/* Confirmação de exclusão */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              Excluir corrida?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {confirmDelete && (
                <>
                  Esta ação vai remover a corrida de{" "}
                  <strong className="text-zinc-200">{confirmDelete.app}</strong>{" "}
                  no valor de{" "}
                  <strong className="text-emerald-400">
                    R$ {confirmDelete.value.toFixed(2).replace(".", ",")}
                  </strong>
                  . Não dá pra desfazer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-800 text-zinc-300 hover:bg-zinc-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAction}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação de apagar tudo */}
      <AlertDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
      >
        <AlertDialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              Apagar TODOS os dados?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Você tem{" "}
              <strong className="text-zinc-200">{allDeliveries.length}</strong>{" "}
              corridas salvas. Tudo será apagado do seu celular permanentemente.
              Faça um backup antes se quiser manter o histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-800 text-zinc-300 hover:bg-zinc-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearAction}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Apagar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
