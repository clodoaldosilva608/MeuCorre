"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import { AdBanner } from "@/components/meucorre/ad-banner";
import { AdCard } from "@/components/meucorre/ad-card";
import { SponsoredSplash } from "@/components/meucorre/sponsored-splash";
import { LicenseDialog } from "@/components/meucorre/license-dialog";
import { PromoPopup } from "@/components/meucorre/promo-popup";
import { SharePopup } from "@/components/meucorre/share-popup";
import { FeedbackPopup } from "@/components/meucorre/feedback-popup";
import { useAds, activateLicense, checkProStatus } from "@/hooks/use-ads";
import { db, switchDb } from "@/lib/db";
import {
  useTrialStatus,
  shouldShowPromoPopup,
  dismissPromoPopup,
  shouldShowSharePopup,
  dismissSharePopup,
  shouldShowFeedbackPopup,
  markFeedbackAsked,
} from "@/hooks/use-trial";
import { useSync } from "@/hooks/use-sync";
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
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  // Auto-ativação via ?license=xxx (vindo da página /obrigado)
  const searchParams = useSearchParams();

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
  const [licenseOpen, setLicenseOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Anúncios (busca banner_top, card_list e splash; em PRO retorna vazio)
  const { ads: bannerAds, clickAd: clickBanner } = useAds("banner_top");
  const { ads: cardAds, clickAd: clickCard } = useAds("card_list");
  const { ads: splashAds } = useAds("splash");
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(
    new Set(),
  );
  const [isPro, setIsPro] = useState(false);

  // Status de trial/limite (14 dias grátis + 5 lançamentos/dia após)
  const trialStatus = useTrialStatus(isPro);
  const { status: syncStatus, syncNow } = useSync();

  // Verifica status PRO ao montar:
  // 1. Tenta licença no localStorage (PRO ativado manualmente)
  // 2. Se não tem, busca sessão de usuário logado (login via /login)
  //    Se user.isPro, salva licenseKey no localStorage e marca como PRO
  useEffect(() => {
    (async () => {
      // 1. Licença no localStorage (ativação manual via ?license=xxx)
      const localPro = await checkProStatus();
      if (localPro) {
        setIsPro(true);
        return;
      }
      // 2. Sessão de usuário (login via email/senha)
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user?.isPro && data.user.licenseKey) {
          // Sincroniza licença do servidor pro localStorage
          localStorage.setItem("meucorre_license", data.user.licenseKey);
          setIsPro(true);
        }
      } catch {
        // offline ou não logado — continua free
      }
    })();
  }, []);

  // Pop-up "Compre PRO" — aparece sempre que abre o app (se free, 1x a cada 4h)
  useEffect(() => {
    if (!showSplash && shouldShowPromoPopup(isPro)) {
      const t = setTimeout(() => setPromoOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, [showSplash, isPro]);

  // Pop-up "Compartilhe com amigos" — 1x por dia, 6s após promo
  useEffect(() => {
    if (!showSplash && shouldShowSharePopup(isPro) && !promoOpen) {
      const t = setTimeout(() => setShareOpen(true), 6000);
      return () => clearTimeout(t);
    }
  }, [showSplash, isPro, promoOpen]);

  // Pop-up de feedback — após 3+ corridas, 1x por mês
  useEffect(() => {
    if (!showSplash) {
      shouldShowFeedbackPopup().then((show) => {
        if (show) {
          const t = setTimeout(() => setFeedbackOpen(true), 12000);
          return () => clearTimeout(t);
        }
      });
    }
  }, [showSplash]);

  // Auto-ativação: se veio da página /obrigado com ?license=xxx, ativa automaticamente
  useEffect(() => {
    const licenseParam = searchParams?.get("license");
    if (!licenseParam) return;
    (async () => {
      const result = await activateLicense(licenseParam);
      if (result.ok) {
        toast.success("Licença PRO ativada! 🎉", {
          description: "Bem-vindo ao MeuCorre PRO!",
        });
        setIsPro(true);
      } else {
        toast.error(result.error || "Licença inválida");
      }
      // Limpa o ?license=xxx da URL sem recarregar a página
      const url = new URL(window.location.href);
      url.searchParams.delete("license");
      window.history.replaceState({}, "", url.toString());
    })();
  }, [searchParams]);

  const handleActivateLicense = async (key: string) => {
    const result = await activateLicense(key);
    if (result.ok) {
      toast.success("Licença PRO ativada! 🎉", {
        description: "Obrigado por apoiar o MeuCorre!",
      });
      setIsPro(true);
      setLicenseOpen(false);
      return true;
    }
    toast.error(result.error || "Licença inválida");
    return false;
  };

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
    // Bloqueia lançamento se free + trial expirado + atingiu limite diário
    if (
      !editingDelivery &&
      !isPro &&
      trialStatus.isTrialExpired &&
      !trialStatus.canLaunch
    ) {
      toast.error("Limite diário atingido 😢", {
        description: `Você já fez ${trialStatus.launchesToday} lançamentos hoje. Upgrade PRO pra lançar ilimitado!`,
      });
      setPromoOpen(true);
      return;
    }

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
    // Sincroniza com servidor (se logado) em background
    syncNow();
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
    // Sincroniza com servidor (se logado) em background
    syncNow();
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    // Troca para database anônimo (sem userId) — dados do usuário ficam isolados
    switchDb(null);
    // Limpa localStorage (licença, sync, trial — mas NÃO apaga o userId que já foi removido por switchDb)
    localStorage.removeItem("meucorre_license");
    localStorage.removeItem("meucorre_last_sync");
    localStorage.removeItem("meucorre_first_use");
    localStorage.removeItem("meucorre_promo_dismissed_at");
    localStorage.removeItem("meucorre_share_dismissed_at");
    localStorage.removeItem("meucorre_feedback_asked_at");
    toast.success("Você saiu da sua conta");
    window.location.href = "/";
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
    // Captura o ID ANTES de fechar o dialog (Radix fecha automático)
    const idToDelete = confirmDeleteDelivery?.id;
    setConfirmDeleteDelivery(null);
    if (idToDelete) {
      await deleteDelivery(idToDelete);
      toast.success("Corrida excluída");
      syncNow();
    }
  };

  const confirmDeleteExpenseAction = async () => {
    const idToDelete = confirmDeleteExpense?.id;
    setConfirmDeleteExpense(null);
    if (idToDelete) {
      await deleteExpense(idToDelete);
      toast.success("Despesa excluída");
      syncNow();
    }
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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SplashScreen visible={showSplash}>
        {/* Splash patrocinado (apenas se não for PRO e houver anúncio do tipo splash) */}
        {!isPro && splashAds[0] && <SponsoredSplash ad={splashAds[0]} />}
      </SplashScreen>

      <Header
        isPro={isPro}
        onExportJSON={handleExportJSON}
        onExportCSV={handleExportCSV}
        onClearAll={() => setConfirmClear(true)}
        onOpenApps={() => setAppManagerOpen(true)}
        onOpenCapture={() => setCaptureOpen(true)}
        onOpenLicense={() => setLicenseOpen(true)}
        onOpenShare={() => setShareOpen(true)}
        syncStatus={syncStatus}
        onLogout={handleLogout}
      />

      <main className="mx-auto w-full max-w-md flex-1 space-y-5 px-4 pb-32 pt-4">
        {/* Banner de anúncio no topo (apenas se não for PRO) */}
        {!isPro &&
          bannerAds
            .filter((a) => !dismissedBanners.has(a.id))
            .slice(0, 1)
            .map((ad) => (
              <AdBanner
                key={ad.id}
                ad={ad}
                onClick={clickBanner}
                onDismiss={(id) =>
                  setDismissedBanners((prev) => new Set(prev).add(id))
                }
              />
            ))}

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

            {/* Anúncio card patrocinado entre listas (apenas se não for PRO) */}
            {!isPro && cardAds[0] && (
              <AdCard ad={cardAds[0]} onClick={clickCard} />
            )}

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
                <h3 className="text-sm font-semibold text-foreground/80 dark:text-zinc-300">
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
                        className="overflow-hidden rounded-xl border border-border dark:border-zinc-800 bg-card dark:bg-zinc-900"
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

      <LicenseDialog
        open={licenseOpen}
        onOpenChange={setLicenseOpen}
        isPro={isPro}
        onActivate={handleActivateLicense}
      />

      {/* Pop-up "Compre PRO" — aparece sempre que abre o app (free) */}
      <PromoPopup
        open={promoOpen}
        onClose={() => {
          setPromoOpen(false);
          dismissPromoPopup();
        }}
        trialDaysLeft={trialStatus.trialDaysLeft}
        isTrialExpired={trialStatus.isTrialExpired}
        remainingLaunches={trialStatus.remainingLaunches}
      />

      {/* Pop-up "Compartilhe com amigos" */}
      <SharePopup
        open={shareOpen}
        onClose={() => {
          setShareOpen(false);
          dismissSharePopup();
        }}
      />

      {/* Pop-up de feedback */}
      <FeedbackPopup
        open={feedbackOpen}
        onClose={() => {
          setFeedbackOpen(false);
          markFeedbackAsked();
        }}
      />

      {/* Confirmações */}
      <AlertDialog
        open={!!confirmDeleteDelivery}
        onOpenChange={(o) => !o && setConfirmDeleteDelivery(null)}
      >
        <AlertDialogContent className="border-border dark:border-zinc-800 bg-background dark:bg-zinc-950 text-foreground dark:text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir corrida?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground dark:text-zinc-400">
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
            <AlertDialogCancel className="border-border dark:border-zinc-800 text-foreground/80 dark:text-zinc-300 hover:bg-muted dark:bg-zinc-800">
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
        <AlertDialogContent className="border-border dark:border-zinc-800 bg-background dark:bg-zinc-950 text-foreground dark:text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground dark:text-zinc-400">
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
            <AlertDialogCancel className="border-border dark:border-zinc-800 text-foreground/80 dark:text-zinc-300 hover:bg-muted dark:bg-zinc-800">
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
        <AlertDialogContent className="border-border dark:border-zinc-800 bg-background dark:bg-zinc-950 text-foreground dark:text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar TODOS os dados?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground dark:text-zinc-400">
              Você tem{" "}
              <strong className="text-zinc-200">{allDeliveries.length}</strong>{" "}
              corridas e{" "}
              <strong className="text-zinc-200">{allExpenses.length}</strong>{" "}
              despesas. Tudo será apagado do seu celular permanentemente. Faça
              um backup antes se quiser manter o histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border dark:border-zinc-800 text-foreground/80 dark:text-zinc-300 hover:bg-muted dark:bg-zinc-800">
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
