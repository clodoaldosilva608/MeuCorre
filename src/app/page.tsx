"use client";

import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { Header } from "@/components/meucorre/header";
import { SummaryCards } from "@/components/meucorre/summary-cards";
import { PeriodFilter, periodLabel } from "@/components/meucorre/period-filter";
import { AppSummary } from "@/components/meucorre/app-summary";
import { DeliveryList } from "@/components/meucorre/delivery-list";
import { DeliveryForm } from "@/components/meucorre/delivery-form";
import { ExpenseForm } from "@/components/meucorre/expense-form";
import { ExpenseList } from "@/components/meucorre/expense-list";
import { AppManager } from "@/components/meucorre/app-manager";
import { NotificationCapture } from "@/components/meucorre/notification-capture";
import { Charts } from "@/components/meucorre/charts";
import { Fab } from "@/components/meucorre/fab";
import { BottomNav, type Tab } from "@/components/meucorre/bottom-nav";
import { SplashScreen } from "@/components/meucorre/splash-screen";
import {
  useDeliveries,
  useExpenses,
  useApps,
  filterByPeriodDeliveries,
  filterByPeriodExpenses,
  computeStats,
  computeDailySeries,
  exportJSON,
  exportDeliveriesCSV,
  exportExpensesCSV,
  downloadFile,
} from "@/hooks/use-deliveries";
import type {
  Delivery,
  DeliveryApp,
  Expense,
  ExpenseCategory,
  PeriodFilter as Period,
} from "@/lib/types";
import { todayISO, expenseCategoryMeta } from "@/lib/apps";
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
  const [activeTab, setActiveTab] = useState<Tab>("corridas");

  // Modais
  const [deliveryFormOpen, setDeliveryFormOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [appManagerOpen, setAppManagerOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);

  // Confirmações
  const [confirmDeleteDelivery, setConfirmDeleteDelivery] =
    useState<Delivery | null>(null);
  const [confirmDeleteExpense, setConfirmDeleteExpense] =
    useState<Expense | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const {
    allDeliveries,
    addDelivery,
    updateDelivery,
    deleteDelivery,
    clearAll,
  } = useDeliveries();
  const {
    allExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useExpenses();
  const {
    apps,
    visibleApps,
    addApp,
    updateApp,
    deleteApp,
    toggleHideApp,
  } = useApps();

  // Filtragem por período
  const filteredDeliveries = useMemo(
    () => filterByPeriodDeliveries(allDeliveries, period),
    [allDeliveries, period],
  );
  const filteredExpenses = useMemo(
    () => filterByPeriodExpenses(allExpenses, period),
    [allExpenses, period],
  );

  // Estatísticas
  const stats = useMemo(
    () => computeStats(filteredDeliveries, filteredExpenses, apps),
    [filteredDeliveries, filteredExpenses, apps],
  );

  // Série diária (sempre últimos 7 dias, independente do filtro)
  const dailySeries = useMemo(
    () => computeDailySeries(allDeliveries, allExpenses, 7),
    [allDeliveries, allExpenses],
  );

  // Despesas por categoria (do período)
  const expensesByCategory = useMemo(() => {
    const map = new Map<ExpenseCategory, { total: number; count: number }>();
    for (const e of filteredExpenses) {
      const prev = map.get(e.category) ?? { total: 0, count: 0 };
      prev.total += e.value;
      prev.count += 1;
      map.set(e.category, prev);
    }
    return Array.from(map.entries())
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses]);

  // Contadores de hoje (sempre visíveis)
  const todayCount = useMemo(() => {
    const t = todayISO();
    return allDeliveries.filter((d) => d.date === t).length;
  }, [allDeliveries]);

  // ===== Handlers =====

  const handleAddDelivery = async (data: {
    app: string;
    value: number;
    km: number;
    notes?: string;
  }) => {
    if (editingDelivery?.id) {
      await updateDelivery(editingDelivery.id, data);
      toast.success("Corrida atualizada!", {
        description: `${data.app} • R$ ${data.value.toFixed(2).replace(".", ",")}`,
      });
    } else {
      await addDelivery(data);
      toast.success("Corrida lançada! 🚀", {
        description: `${data.app} • R$ ${data.value.toFixed(2).replace(".", ",")}`,
      });
    }
    setEditingDelivery(null);
  };

  const handleAddExpense = async (data: {
    category: ExpenseCategory;
    value: number;
    description?: string;
  }) => {
    if (editingExpense?.id) {
      await updateExpense(editingExpense.id, data);
      toast.success("Despesa atualizada", {
        description: `${expenseCategoryMeta(data.category).label} • R$ ${data.value.toFixed(2).replace(".", ",")}`,
      });
    } else {
      await addExpense(data);
      toast.success("Despesa lançada 💸", {
        description: `${expenseCategoryMeta(data.category).label} • R$ ${data.value.toFixed(2).replace(".", ",")}`,
      });
    }
    setEditingExpense(null);
  };

  const handleCapture = async (data: {
    app: string;
    value: number;
    km: number;
  }) => {
    await addDelivery({
      app: data.app,
      value: data.value,
      km: data.km,
      notes: "Capturado por notificação",
    });
    toast.success("Corrida capturada! 🔔", {
      description: `${data.app} • R$ ${data.value.toFixed(2).replace(".", ",")}`,
    });
  };

  const confirmDeleteDeliveryAction = async () => {
    if (confirmDeleteDelivery?.id) {
      await deleteDelivery(confirmDeleteDelivery.id);
      toast.success("Corrida excluída");
    }
    setConfirmDeleteDelivery(null);
  };

  const confirmDeleteExpenseAction = async () => {
    if (confirmDeleteExpense?.id) {
      await deleteExpense(confirmDeleteExpense.id);
      toast.success("Despesa excluída");
    }
    setConfirmDeleteExpense(null);
  };

  const confirmClearAction = async () => {
    await clearAll();
    setConfirmClear(false);
    toast.success("Todos os dados foram apagados");
  };

  const handleExportJSON = () => {
    if (allDeliveries.length === 0 && allExpenses.length === 0) {
      toast.error("Nada para exportar");
      return;
    }
    const content = exportJSON(allDeliveries, allExpenses, apps);
    downloadFile(content, `meucorre-backup-${todayISO()}.json`, "application/json");
    toast.success("Backup JSON exportado", {
      description: `${allDeliveries.length} corridas, ${allExpenses.length} despesas`,
    });
  };

  const handleExportCSV = () => {
    if (allDeliveries.length === 0 && allExpenses.length === 0) {
      toast.error("Nada para exportar");
      return;
    }
    const deliveriesCSV = exportDeliveriesCSV(allDeliveries);
    const expensesCSV = exportExpensesCSV(allExpenses);
    const content = `# CORRIDAS\n${deliveriesCSV}\n\n# DESPESAS\n${expensesCSV}`;
    downloadFile(content, `meucorre-${todayISO()}.csv`, "text/csv;charset=utf-8");
    toast.success("CSV exportado");
  };

  const openNewDelivery = () => {
    setEditingDelivery(null);
    setDeliveryFormOpen(true);
  };

  const openNewExpense = () => {
    setEditingExpense(null);
    setExpenseFormOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <SplashScreen visible={showSplash} />

      <Header
        onExportJSON={handleExportJSON}
        onExportCSV={handleExportCSV}
        onClearAll={() => setConfirmClear(true)}
        onOpenApps={() => setAppManagerOpen(true)}
        onOpenCapture={() => setCaptureOpen(true)}
      />

      <main className="mx-auto w-full max-w-md flex-1 space-y-5 px-4 pb-32 pt-4">
        {/* Indicador de hoje */}
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

        {/* Cards de resumo sempre visíveis */}
        <SummaryCards stats={stats} periodLabel={periodLabel(period)} />

        <PeriodFilter value={period} onChange={setPeriod} />

        {/* Conteúdo da tab ativa */}
        {activeTab === "corridas" && (
          <>
            <AppSummary stats={stats} />
            <DeliveryList
              deliveries={filteredDeliveries}
              onEdit={(d) => {
                setEditingDelivery(d);
                setDeliveryFormOpen(true);
              }}
              onDelete={(d) => setConfirmDeleteDelivery(d)}
              apps={apps}
            />
          </>
        )}

        {activeTab === "despesas" && (
          <>
            {/* Resumo de despesas por categoria */}
            {expensesByCategory.length > 0 && (
              <section className="space-y-2.5">
                <h3 className="text-sm font-semibold text-zinc-300">
                  Despesas por categoria
                </h3>
                <div className="space-y-2">
                  {expensesByCategory.map((e) => {
                    const meta = expenseCategoryMeta(e.category);
                    const pct =
                      stats.expenses > 0 ? (e.total / stats.expenses) * 100 : 0;
                    return (
                      <div
                        key={e.category}
                        className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
                      >
                        <div className="relative flex items-center justify-between p-3">
                          <div
                            className="absolute inset-y-0 left-0 opacity-[0.10]"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: meta.color,
                            }}
                          />
                          <div className="relative flex items-center gap-2">
                            <span className="text-base">{meta.emoji}</span>
                            <div className="leading-tight">
                              <p className="text-sm font-semibold text-zinc-200">
                                {meta.label}
                              </p>
                              <p className="text-[10px] text-zinc-500">
                                {e.count}{" "}
                                {e.count === 1 ? "lançamento" : "lançamentos"}
                              </p>
                            </div>
                          </div>
                          <span className="relative text-sm font-bold text-red-400">
                            -{new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(e.total)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <ExpenseList
              expenses={filteredExpenses}
              onEdit={(e) => {
                setEditingExpense(e);
                setExpenseFormOpen(true);
              }}
              onDelete={(e) => setConfirmDeleteExpense(e)}
            />
          </>
        )}

        {activeTab === "graficos" && (
          <Charts
            dailySeries={dailySeries}
            stats={stats}
            expensesByCategory={expensesByCategory}
          />
        )}

        {/* Rodapé */}
        <footer className="pt-4 text-center">
          <p className="text-[10px] text-zinc-600">
            ⚡ MeuCorre • 100% offline • seus dados ficam só no seu celular
          </p>
        </footer>
      </main>

      {/* FAB muda de cor baseado na tab */}
      <Fab
        onClick={activeTab === "despesas" ? openNewExpense : openNewDelivery}
        variant={activeTab === "despesas" ? "danger" : "primary"}
        label={activeTab === "despesas" ? "Nova despesa" : "Nova corrida"}
      />

      <BottomNav
        active={activeTab}
        onChange={setActiveTab}
        hasExpenses={allExpenses.length > 0}
        hasDeliveries={allDeliveries.length > 0}
      />

      {/* Modais */}
      <DeliveryForm
        open={deliveryFormOpen}
        onOpenChange={(o) => {
          setDeliveryFormOpen(o);
          if (!o) setEditingDelivery(null);
        }}
        onSubmit={handleAddDelivery}
        editing={editingDelivery}
        apps={visibleApps}
      />

      <ExpenseForm
        open={expenseFormOpen}
        onOpenChange={(o) => {
          setExpenseFormOpen(o);
          if (!o) setEditingExpense(null);
        }}
        onSubmit={handleAddExpense}
        editing={editingExpense}
      />

      <AppManager
        open={appManagerOpen}
        onOpenChange={setAppManagerOpen}
        apps={apps}
        onAdd={addApp}
        onUpdate={updateApp}
        onDelete={deleteApp}
        onToggleHide={toggleHideApp}
      />

      <NotificationCapture
        open={captureOpen}
        onOpenChange={setCaptureOpen}
        apps={visibleApps}
        onConfirm={handleCapture}
      />

      {/* Confirmações */}
      <AlertDialog
        open={!!confirmDeleteDelivery}
        onOpenChange={(o) => !o && setConfirmDeleteDelivery(null)}
      >
        <AlertDialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir corrida?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {confirmDeleteDelivery && (
                <>
                  Esta ação vai remover a corrida de{" "}
                  <strong className="text-zinc-200">
                    {confirmDeleteDelivery.app}
                  </strong>{" "}
                  no valor de{" "}
                  <strong className="text-emerald-400">
                    R${" "}
                    {confirmDeleteDelivery.value
                      .toFixed(2)
                      .replace(".", ",")}
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
              onClick={confirmDeleteDeliveryAction}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!confirmDeleteExpense}
        onOpenChange={(o) => !o && setConfirmDeleteExpense(null)}
      >
        <AlertDialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {confirmDeleteExpense && (
                <>
                  Remover{" "}
                  <strong className="text-zinc-200">
                    {expenseCategoryMeta(confirmDeleteExpense.category).label}
                  </strong>{" "}
                  de{" "}
                  <strong className="text-red-400">
                    R${" "}
                    {confirmDeleteExpense.value.toFixed(2).replace(".", ",")}
                  </strong>
                  ?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-800 text-zinc-300 hover:bg-zinc-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteExpenseAction}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar TODOS os dados?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Você tem{" "}
              <strong className="text-zinc-200">{allDeliveries.length}</strong>{" "}
              corridas e{" "}
              <strong className="text-zinc-200">{allExpenses.length}</strong>{" "}
              despesas. Tudo será apagado do seu celular permanentemente. Faça
              um backup antes se quiser manter o histórico.
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
