"use client";

import { useMemo, useState, useEffect, Suspense, lazy } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Clock, AlertCircle, Gift, Share2, AlertTriangle } from "lucide-react";
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
// PERFORMANCE: Charts carrega recharts (~200KB) + framer-motion (~50KB).
// Só é necessário quando o usuário clica na aba "Gráficos". Usamos lazy()
// para code-split e reduzir o bundle inicial do /app em ~250KB.
const Charts = lazy(() =>
  import("@/components/meucorre/charts").then((m) => ({ default: m.Charts })),
);
import { OffersList } from "@/components/meucorre/offers-list";
import { Fab } from "@/components/meucorre/fab";
import { BottomNav, type Tab } from "@/components/meucorre/bottom-nav";
import { AppLoadingLogo } from "@/components/meucorre/app-loading-logo";
import { AdBanner } from "@/components/meucorre/ad-banner";
import { AdCard } from "@/components/meucorre/ad-card";
import { SponsoredSplash } from "@/components/meucorre/sponsored-splash";
import { LicenseDialog } from "@/components/meucorre/license-dialog";
import { PromoPopup } from "@/components/meucorre/promo-popup";
import { SharePopup } from "@/components/meucorre/share-popup";
import { FeedbackPopup } from "@/components/meucorre/feedback-popup";
import { ReferralBannerRotator } from "@/components/meucorre/referral-banner-rotator";
import { PixKeyRegister } from "@/components/meucorre/pix-key-register";
import { CorreDoDia } from "@/components/meucorre/corre-do-dia";
import { GoalsProgress } from "@/components/meucorre/goals-progress";
import { OnboardingPopup } from "@/components/meucorre/onboarding-popup";
import { BlogPromoPopup } from "@/components/meucorre/blog-promo-popup";
import { SocialFollowPopup } from "@/components/meucorre/social-follow-popup";
import { SponsorBannerPopup } from "@/components/meucorre/sponsor-banner-popup";
import { HeatmapMap } from "@/components/meucorre/heatmap-map";
import { useGoals } from "@/hooks/use-goals";
import { useWorkSessions } from "@/hooks/use-work-sessions";
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

  // ===== Modo demo (iframe da landing page) =====
  // Quando ?demo=1, suprime splash, popups e permite controle via postMessage.
  // A landing page usa isso para mostrar o app rodando dentro do iPhone mockup.
  const isDemoMode = searchParams?.get("demo") === "1";

  // Splash com VÍDEO REAL do MeuCorre (idêntico ao vídeo enviado)
  // Dura 10s (duração do vídeo)
  const [showSplash, setShowSplash] = useState(!isDemoMode);
  useEffect(() => {
    if (isDemoMode) return;
    const t = setTimeout(() => setShowSplash(false), 10000);
    return () => clearTimeout(t);
  }, [isDemoMode]);

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
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [heatmapOpen, setHeatmapOpen] = useState(false);
  const [referralData, setReferralData] = useState<{
    active: boolean;
    code: string;
    link: string;
    rewardAmount: number;
    stats: { total: number; converted: number; paid: number; totalEarned: number };
  } | null>(null);

  // Anúncios (busca banner_top, card_list e splash; em PRO retorna vazio)
  const { ads: bannerAds, clickAd: clickBanner } = useAds("banner_top");
  const { ads: cardAds, clickAd: clickCard } = useAds("card_list");
  const { ads: splashAds } = useAds("splash");
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(
    new Set(),
  );
  const [isPro, setIsPro] = useState(false);
  // Nome do usuário logado para saudação personalizada no dashboard.
  // Vazio enquanto não sabemos se está logado.
  const [userName, setUserName] = useState<string>("");

  // Status de trial/limite (14 dias grátis + 5 lançamentos/dia após)
  const trialStatus = useTrialStatus(isPro);
  // No modo demo, useSync não deve tentar sincronizar com o servidor
  // (poderia puxar dados do usuário real logado). Passamos um flag.
  const { status: syncStatus, syncNow } = useSync();

  // Verifica status PRO ao montar:
  // 1. Busca sessão de usuário logado (login via /login)
  //    Se user.isPro, salva licenseKey no localStorage e marca como PRO
  // 2. Se não logado, tenta licença no localStorage (PRO ativado manualmente
  //    sem login — dispositivo shared)
  // Aproveitamos o mesmo fetch para guardar o nome do usuário (saudação).
  // CRÍTICO: se a sessão não bater com o meucorre_user_id do localStorage,
  // chamamos switchDb imediatamente para evitar exibir dados do usuário
  // anterior (race condition pós-login).
  //
  // MODO DEMO: NÃO verifica sessão real. Usa DB isolado 'MeuCorreDB_demo'
  // e nome fictício 'Carlos Entregador'. Isso garante que a conta real
  // do usuário NUNCA apareça no iframe da landing page.
  useEffect(() => {
    if (isDemoMode) {
      // Modo demo — usa DB isolado e nome fictício
      // NÃO faz fetch de /api/auth/me (não quer saber se há sessão real)
      switchDb("demo");
      // Usa setTimeout para evitar setState síncrono no effect
      const t = setTimeout(() => {
        setUserName("Carlos Entregador");
        setIsPro(false);
      }, 0);
      return () => clearTimeout(t);
    }

    (async () => {
      // 1. PRIMEIRO verifica sessão de usuário (login via email/senha)
      //    Isso garante que a licença do localStorage não seja de outro usuário.
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user?.name) setUserName(data.user.name);

        // Sincroniza DB com a sessão ativa
        if (data.user?.id) {
          const storedUid = localStorage.getItem("meucorre_user_id");
          if (storedUid !== data.user.id) {
            switchDb(data.user.id);
          }
        }

        if (data.user?.isPro && data.user.licenseKey) {
          // Usuário logado É PRO no servidor — salva licença e marca como PRO
          localStorage.setItem("meucorre_license", data.user.licenseKey);
          setIsPro(true);
          return;
        } else {
          // Usuário logado NÃO é PRO — remove licença do localStorage
          // (pode ser de um usuário anterior que esqueceu de fazer logout)
          localStorage.removeItem("meucorre_license");
          setIsPro(false);
          return;
        }
      } catch {
        // offline ou não logado — continua para passo 2
      }

      // 2. Se não está logado, tenta licença no localStorage (modo offline)
      //    Só confia na licença local se não há sessão de usuário (guest mode)
      const localPro = await checkProStatus();
      if (localPro) {
        setIsPro(true);
      }
    })();
  }, []);

  // ===== Referral: busca dados da campanha para todos os usuários logados =====
  useEffect(() => {
    let cancelled = false;
    fetch("/api/referral/code")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.active && data.code) {
          setReferralData(data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // ===== Modo demo: listener para trocar abas via postMessage =====
  // A landing page envia { type: "meucorre-demo-tab", tab: "corridas"|"despesas"|... }
  // para o iframe controlar qual aba está visível na demo automática.
  useEffect(() => {
    if (!isDemoMode) return;

    // Injeta CSS para esconder scrollbars mas permitir scroll (touch/wheel)
    const style = document.createElement("style");
    style.id = "demo-mode-css";
    style.textContent = `
      ::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
      html { overflow-x: hidden !important; scrollbar-width: none !important; -ms-overflow-style: none !important; }
      body { overflow-x: hidden !important; scrollbar-width: none !important; -ms-overflow-style: none !important; padding-top: 0 !important; }
      /* Permite scroll vertical mas esconde a barra */
      html, body { overflow-y: auto !important; -webkit-overflow-scrolling: touch !important; }
    `;
    document.head.appendChild(style);

    const handler = (event: MessageEvent) => {
      if (event.data?.type === "meucorre-demo-tab" && event.data.tab) {
        const validTabs: Tab[] = ["corridas", "despesas", "graficos", "ofertas"];
        if (validTabs.includes(event.data.tab)) {
          setActiveTab(event.data.tab);
        }
      }
    };
    window.addEventListener("message", handler);
    return () => {
      window.removeEventListener("message", handler);
      document.getElementById("demo-mode-css")?.remove();
    };
  }, [isDemoMode]);

  // ===== Seed de dados de demonstração (apenas no primeiro acesso, DB vazio) =====
  // Mostra algumas corridas de exemplo para o usuário não ver tela vazia.
  // Quando ele registrar sua primeira corrida real, os dados reais sobrepõem.
  useEffect(() => {
    (async () => {
      try {
        await db.open();
        const count = await db.deliveries.count();
        if (count === 0) {
          const today = new Date().toISOString().slice(0, 10);
          const now = Date.now();
          const base = { lat: -23.5505, lng: -46.6333 };
          const jit = () => (Math.random() - 0.5) * 0.012;
          const apps = ["iFood", "99Food", "Rappi", "Lalamove"];
          const notes = ["Centro → Vila Nova", "Centro → Jardim Europa", "Industrial → Centro", "Vila Mariana → Centro", "Centro → Pinheiros"];

          const demoDeliveries: Delivery[] = [];
          for (let i = 0; i < 5; i++) {
            demoDeliveries.push({
              app: apps[i % apps.length],
              value: Math.round((15 + Math.random() * 25) * 100) / 100,
              km: Math.round((3 + Math.random() * 8) * 10) / 10,
              date: today,
              timestamp: now - i * 1800000,
              notes: notes[i % notes.length],
              lat: base.lat + jit(),
              lng: base.lng + jit(),
            });
          }

          await db.deliveries.bulkAdd(demoDeliveries);
          await db.expenses.bulkAdd([
            { category: "combustivel", value: 20, description: "Gasolina", date: today, timestamp: now - 45000 },
            { category: "alimentacao", value: 10, description: "Almoço", date: today, timestamp: now - 35000 },
          ]);
          console.log("[seed] 5 corridas demo inseridas (primeiro acesso)");
        }
      } catch (err) {
        console.warn("[seed] Erro:", err);
      }
    })();
  }, []);

  // ===== Sistema de fila de pop-ups (1 por sessão, com prioridade) =====
  // Regra: apenas 1 popup por sessão. Entre sessões, intervalo mínimo de 24h.
  // Prioridade: Onboarding > Promo PRO > Share > Feedback > BlogPromo > SocialFollow
  useEffect(() => {
    if (isDemoMode) return;
    if (showSplash) return;

    const POPUP_SESSION_KEY = "meucorre_popup_shown_this_session";
    const alreadyShown = sessionStorage.getItem(POPUP_SESSION_KEY);
    if (alreadyShown) return; // já mostrou um popup nesta sessão

    // Verifica qual popup mostrar (em ordem de prioridade)
    const checkAndShow = async () => {
      // 1. Onboarding (primeira vez no app)
      const onboardingDone = localStorage.getItem("meucorre_onboarding_done");
      if (!onboardingDone) {
        const t = setTimeout(() => {
          setOnboardingOpen(true);
          sessionStorage.setItem(POPUP_SESSION_KEY, "onboarding");
        }, 2000);
        return () => clearTimeout(t);
      }

      // 2. Promo PRO (1x a cada 4h, se free)
      if (shouldShowPromoPopup(isPro)) {
        const t = setTimeout(() => {
          setPromoOpen(true);
          sessionStorage.setItem(POPUP_SESSION_KEY, "promo");
        }, 1500);
        return () => clearTimeout(t);
      }

      // 3. Share (1x por dia, se free)
      if (shouldShowSharePopup(isPro)) {
        const t = setTimeout(() => {
          setShareOpen(true);
          sessionStorage.setItem(POPUP_SESSION_KEY, "share");
        }, 1500);
        return () => clearTimeout(t);
      }

      // 4. Feedback (após 3+ corridas, 1x por mês)
      const showFeedback = await shouldShowFeedbackPopup();
      if (showFeedback) {
        const t = setTimeout(() => {
          setFeedbackOpen(true);
          sessionStorage.setItem(POPUP_SESSION_KEY, "feedback");
        }, 1500);
        return () => clearTimeout(t);
      }
    };

    checkAndShow();
  }, [showSplash, isPro, isDemoMode]);

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

  // ===== Hooks das novas features: Metas + Corre do dia =====
  const {
    goalsWithProgress,
    addGoal,
    updateGoal,
    deleteGoal,
  } = useGoals(allDeliveries);

  const {
    activeSession,
    liveDurationMs,
    liveDistanceKm,
    gpsError,
    sessions: workSessions,
    startSession,
    stopSession,
    cancelSession,
    deleteSession,
  } = useWorkSessions();

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
    // Limpa TUDO do localStorage relacionado à sessão do usuário.
    // Antes, algumas chaves (user_id, last_sync) não eram removidas explicitamente,
    // causando ocasionalmente dados do usuário anterior aparecerem após logout.
    localStorage.removeItem("meucorre_user_id");
    localStorage.removeItem("meucorre_license");
    localStorage.removeItem("meucorre_last_sync");
    localStorage.removeItem("meucorre_first_use");
    localStorage.removeItem("meucorre_promo_dismissed_at");
    localStorage.removeItem("meucorre_share_dismissed_at");
    localStorage.removeItem("meucorre_feedback_asked_at");
    // Limpa flag anti-loop do useSync
    sessionStorage.removeItem("meucorre_db_switched");
    toast.success("Você saiu da sua conta");
    // Hard redirect para a landing — garante que nenhum estado React persista
    window.location.replace("/");
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
    // clearAll() agora envia exclusões para o servidor (se logado) antes
    // de limpar o DB local. Aguardamos a conclusão para feedback correto.
    try {
      await clearAll();
      setConfirmClear(false);
      toast.success("Todos os dados foram apagados", {
        description: "Corridas e despesas removidas deste dispositivo e do servidor.",
      });
    } catch {
      setConfirmClear(false);
      toast.error("Erro ao apagar dados", {
        description: "Tente novamente. Se persistir, recarregue a página.",
      });
    }
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
    if (isDemoMode) return; // bloqueado em demo
    setEditingDelivery(null);
    setDeliveryFormOpen(true);
  };

  const openNewExpense = () => {
    if (isDemoMode) return; // bloqueado em demo
    setEditingExpense(null);
    setExpenseFormOpen(true);
  };

  return (
    <div className="meucorre-app-shell flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
      <AppLoadingLogo visible={showSplash} duration={10000}>
        {/* Splash patrocinado (apenas se não for PRO, não for demo, e houver anúncio) */}
        {!isPro && !isDemoMode && splashAds[0] && <SponsoredSplash ad={splashAds[0]} />}
      </AppLoadingLogo>

      <Header
        isPro={isPro}
        onExportJSON={isDemoMode ? (() => {}) : handleExportJSON}
        onExportCSV={isDemoMode ? (() => {}) : handleExportCSV}
        onClearAll={isDemoMode ? (() => {}) : () => setConfirmClear(true)}
        onOpenApps={isDemoMode ? (() => {}) : () => setAppManagerOpen(true)}
        onOpenCapture={isDemoMode ? (() => {}) : () => setCaptureOpen(true)}
        onOpenLicense={isDemoMode ? (() => {}) : () => setLicenseOpen(true)}
        onOpenShare={isDemoMode ? (() => {}) : () => setShareOpen(true)}
        onOpenOnboarding={isDemoMode ? undefined : () => setOnboardingOpen(true)}
        syncStatus={syncStatus}
        onLogout={isDemoMode ? (() => {}) : handleLogout}
      />

      <main className="dashboard-reference-main mx-auto w-full max-w-md flex-1 space-y-5 px-4 pb-32 pt-4">
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

        {/* Banner de Trial — contagem regressiva permanente na dashboard.
            Visível apenas para usuários free (não-PRO) enquanto o trial está ativo.
            Mostra dias restantes e CTA para upgrade. */}
        {!isPro && trialStatus.isTrialActive && trialStatus.trialDaysLeft > 0 && (
          <div className="dashboard-trial-row flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-300">
                {trialStatus.trialDaysLeft} {trialStatus.trialDaysLeft === 1 ? "dia restante" : "dias restantes"} do teste grátis
              </span>
            </div>
            <button
              onClick={() => setLicenseOpen(true)}
              className="text-xs font-bold text-amber-400 underline-offset-2 hover:underline"
            >
              Virar PRO →
            </button>
          </div>
        )}

        {/* Banner de Trial expirado — mostra limite de lançamentos */}
        {!isPro && trialStatus.isTrialExpired && (
          <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-red-300">
                {trialStatus.remainingLaunches > 0
                  ? `${trialStatus.remainingLaunches} ${trialStatus.remainingLaunches === 1 ? "lançamento restante" : "lançamentos restantes"} hoje`
                  : "Limite diário atingido"}
              </span>
            </div>
            <button
              onClick={() => setLicenseOpen(true)}
              className="text-xs font-bold text-red-400 underline-offset-2 hover:underline"
            >
              Virar PRO →
            </button>
          </div>
        )}

        {/* ===== Banner de Referral "Indique e Ganhe" =====
            Visível para TODOS os usuários logados quando a campanha está ativa.
            Inclui banner rotativo, recompensa, stats, cadastro de PIX e aviso antifraude. */}
        {referralData && (
          <div className="overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
            {/* Banner rotativo (muda a cada 5 segundos) */}
            <ReferralBannerRotator onShare={() => setShareOpen(true)} />

            {/* Info + Stats + PIX + Antifraude */}
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Gift className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">
                      Indique e Ganhe R$ {referralData.rewardAmount.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    Cada amigo que virar PRO = R$ {referralData.rewardAmount.toFixed(2)} pra você via PIX
                  </p>
                  {!isPro && (
                    <p className="mt-0.5 text-[11px] text-amber-400">
                      ⚠️ Você precisa ser PRO para receber a recompensa.{" "}
                      <button onClick={() => setLicenseOpen(true)} className="underline hover:text-amber-300">
                        Virar PRO →
                      </button>
                    </p>
                  )}
                  {referralData.stats.total > 0 && (
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px]">
                      <span className="text-zinc-500">
                        Indicados: <strong className="text-zinc-300">{referralData.stats.total}</strong>
                      </span>
                      <span className="text-zinc-500">
                        Convertidos: <strong className="text-emerald-400">{referralData.stats.converted}</strong>
                      </span>
                      <span className="text-zinc-500">
                        Ganho: <strong className="text-emerald-400">R$ {referralData.stats.totalEarned.toFixed(2)}</strong>
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShareOpen(true)}
                  className="shrink-0 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-zinc-950 transition-colors hover:bg-emerald-400"
                >
                  <Share2 className="mr-1 inline h-3.5 w-3.5" />
                  Indicar
                </button>
              </div>

              {/* Cadastro de PIX */}
              <PixKeyRegister />

              {/* Aviso antifraude detalhado */}
              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                <p className="text-[10px] leading-relaxed text-red-300/80">
                  <strong>Atenção:</strong> Fraude (auto-indicação, contas falsas, indicações forjadas)
                  resulta em <strong>banimento permanente</strong> da plataforma e perda de todas as
                  recompensas. Cadastre sua chave PIX para receber — sem PIX cadastrada, o repasse não será feito.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Saudação personalizada com o nome do usuário logado.
            Só renderizamos quando o nome já foi carregado — evita
            layout shift no SSR e esconde totalmente quando offline. */}
        {userName && (
          <div className="dashboard-greeting-row flex items-center gap-2 px-1">
            <h2 className="text-base font-bold text-foreground dark:text-zinc-100">
              Olá, {userName.split(" ")[0]}! 👋
            </h2>
          </div>
        )}

        <PeriodFilter value={period} onChange={setPeriod} />

        {/* Conteúdo da tab ativa */}
        {activeTab === "corridas" && (
          <>
            {/* Bloco principal da referência: Corre do dia + Metas em duas colunas */}
            <div className="dashboard-focus-grid">
              <CorreDoDia
                activeSession={activeSession}
                liveDurationMs={liveDurationMs}
                liveDistanceKm={liveDistanceKm}
                gpsError={gpsError}
                sessions={workSessions}
                onStart={startSession}
                onStop={stopSession}
                onCancel={cancelSession}
                onDelete={deleteSession}
                onOpenHeatmap={() => setHeatmapOpen(true)}
              />

              <GoalsProgress
                goals={goalsWithProgress}
                onAdd={addGoal}
                onUpdate={updateGoal}
                onDelete={deleteGoal}
              />
            </div>

            <AppSummary stats={stats} />

            {/* Anúncio card patrocinado entre listas (apenas se não for PRO) */}
            {!isPro && cardAds[0] && (
              <AdCard ad={cardAds[0]} onClick={clickCard} />
            )}

            <DeliveryList
              deliveries={filteredDeliveries}
              onEdit={(d) => {
                if (isDemoMode) return; // bloqueado em demo
                setEditingDelivery(d);
                setDeliveryFormOpen(true);
              }}
              onDelete={(d) => {
                if (isDemoMode) return; // bloqueado em demo
                setConfirmDeleteDelivery(d);
              }}
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
                if (isDemoMode) return; // bloqueado em demo
                setEditingExpense(e);
                setExpenseFormOpen(true);
              }}
              onDelete={(e) => {
                if (isDemoMode) return; // bloqueado em demo
                setConfirmDeleteExpense(e);
              }}
            />
          </>
        )}

        {activeTab === "graficos" && (
          <Suspense
            fallback={
              <div className="flex h-64 items-center justify-center text-zinc-500">
                <div className="animate-pulse text-sm">Carregando gráficos…</div>
              </div>
            }
          >
            <Charts
              dailySeries={dailySeries}
              stats={stats}
              expensesByCategory={expensesByCategory}
            />
          </Suspense>
        )}

        {activeTab === "ofertas" && (
          <OffersList isPro={isPro} />
        )}

        {/* Rodapé */}
        <footer className="pt-4 text-center">
          <p className="text-[10px] text-zinc-600">
            ⚡ MeuCorre • 100% offline • seus dados ficam só no seu celular
          </p>
        </footer>
      </main>

      {/* FAB — oculto em modo demo (não pode adicionar corridas) */}
      {!isDemoMode && (
        <Fab
          onClick={activeTab === "despesas" ? openNewExpense : openNewDelivery}
          variant={activeTab === "despesas" ? "danger" : "primary"}
          label={activeTab === "despesas" ? "Nova despesa" : "Nova corrida"}
        />
      )}

      {/* Overlay de bloqueio no modo demo — APENAS para o header.
          Cobre o header (topo) com pointer-events auto para impedir
          cliques no menu, botões de exportar, etc.
          O conteúdo (main) fica clicável para scroll mas os botões
          internos já estão desabilitados via isDemoMode nos callbacks.
          O bottom-nav fica livre para trocar de aba. */}
      {isDemoMode && (
        <div
          className="fixed left-0 right-0 top-0 z-40"
          style={{
            height: "52px", // altura do header
            background: "transparent",
            pointerEvents: "auto",
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      )}

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

      {/* Pop-up "Compartilhe com amigos" / "Indique e Ganhe" */}
      <SharePopup
        open={shareOpen}
        onClose={() => {
          setShareOpen(false);
          dismissSharePopup();
        }}
        referralLink={referralData?.link}
        referralReward={referralData?.rewardAmount}
      />

      {/* Pop-up de feedback */}
      <FeedbackPopup
        open={feedbackOpen}
        onClose={() => {
          setFeedbackOpen(false);
          markFeedbackAsked();
        }}
      />

      {/* Pop-up Tutorial / Onboarding — abre automaticamente na primeira
          visita ao /app. Também pode ser aberto manualmente via menu lateral. */}
      <OnboardingPopup
        forceOpen={onboardingOpen || undefined}
        onForceClose={() => setOnboardingOpen(false)}
      />

      {/* Pop-up "Confira o blog" — 1x por semana, 3.5s após abrir o app.
          Chama o usuário pra ler os 90+ artigos do blog do MeuCorre.
          Suprimido em modo demo. */}
      {!isDemoMode && <BlogPromoPopup />}

      {/* Pop-up "Siga nossas redes + compartilhe com amigos" — 1x por semana,
          6.5s após abrir o app. Instagram, TikTok, YouTube + share buttons.
          Suprimido em modo demo. */}
      {!isDemoMode && <SocialFollowPopup />}

      {/* Banner pop-up de patrocinadores — aparece 1x por dia, 5s após abrir o app.
          Mostra banners de marcas patrocinadas que pagaram para aparecer na dashboard.
          Admin configura em /admin/patrocinadores (showBanner = true). */}
      {!isDemoMode && <SponsorBannerPopup />}

      {/* Mapa de calor — áreas quentes onde o entregador mais faz corridas.
          Aberto via botão "Mapa de calor" no Corre do dia.
          Filtra por período, dia da semana ou data personalizada. */}
      <HeatmapMap
        open={heatmapOpen}
        onOpenChange={setHeatmapOpen}
        deliveries={allDeliveries}
      />

      {/* Nota: o pop-up "Baixar aplicativo" (InstallAppPopup) é renderizado
          dentro do Header, que controla tanto a abertura automática (após
          3.5s, se ainda não foi dismissado) quanto a abertura manual via
          item "Baixar aplicativo" no menu lateral. */}

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
