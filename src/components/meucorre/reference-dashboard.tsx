"use client";

import { useState } from "react";
import { Bike, ChevronRight, CircleDollarSign, Download, Flag, Gauge, Grid3X3, HelpCircle, LogOut, MapPin, Menu, Navigation, Play, Share2, Smartphone, Timer, Trash2, WalletCards, X } from "lucide-react";
import { formatBRL, formatKm } from "@/lib/apps";
import type { Delivery, DeliveryApp, PeriodFilter as Period, PeriodStat } from "@/lib/types";
import type { GoalWithProgress } from "@/hooks/use-goals";

interface ReferenceDashboardProps {
  stats: PeriodStat;
  period: Period;
  activeTab: "corridas" | "despesas" | "ofertas" | "graficos";
  goal?: GoalWithProgress;
  recentDeliveries: Delivery[];
  /** Lista de apps cadastrados (para exibir logos reais em vez de iniciais). */
  apps?: DeliveryApp[];
  onPeriodChange: (period: Period) => void;
  onNewDelivery: () => void;
  onStartSession: () => void;
  onOpenHeatmap: () => void;
  onTabChange: (tab: "corridas" | "despesas" | "ofertas" | "graficos") => void;
  onOpenApps: () => void;
  onOpenCapture: () => void;
  onOpenLicense: () => void;
  onOpenShare: () => void;
  onOpenOnboarding?: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onClearAll: () => void;
  onLogout: () => void;
}

// Helper: encontra app por nome (case-insensitive) e retorna label/image
function findApp(name: string, apps?: DeliveryApp[]): DeliveryApp | undefined {
  if (!apps?.length) return undefined;
  return apps.find(a => a.name.toLowerCase() === name.toLowerCase());
}

export function ReferenceDashboard({ stats, period, activeTab, goal, recentDeliveries, apps, onPeriodChange, onNewDelivery, onStartSession, onOpenHeatmap, onTabChange, onOpenApps, onOpenCapture, onOpenLicense, onOpenShare, onOpenOnboarding, onExportJSON, onExportCSV, onClearAll, onLogout }: ReferenceDashboardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeAndRun = (fn: () => void) => { setMenuOpen(false); fn(); };
  const amount = stats.total;
  const expense = stats.expenses;
  const net = stats.netProfit;
  const km = stats.km;
  const count = stats.count;
  const goalProgress = goal?.progressPct ?? 0;
  const goalRemaining = goal?.remaining ?? 0;
  const dateLabel = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" }).format(new Date());

  return (
    <section className="reference-dashboard" aria-label="Dashboard MeuCorre">
      <header className="reference-dashboard-header">
        <div className="reference-dashboard-brand"><img src="/logo-meucorre.png" alt="" /><strong>Meu<span>Corre</span></strong></div>
        <div className="reference-dashboard-header-actions"><div className="reference-offline"><span /> Offline<br /><small>Sincroniza quando conectar</small></div><button type="button" className="reference-menu-button" aria-label="Abrir menu lateral" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu /></button></div>
      </header>
      {menuOpen && <><button type="button" className="reference-sidebar-backdrop" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} /><aside className="reference-sidebar" aria-label="Menu de ações"><div className="reference-sidebar-head"><div><strong>Menu</strong><small>Ações e configurações</small></div><button type="button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}><X /></button></div><nav><button type="button" onClick={() => closeAndRun(onOpenCapture)}><Navigation />Capturar por notificação</button><button type="button" onClick={() => closeAndRun(onOpenApps)}><Grid3X3 />Gerenciar apps de entrega</button><button type="button" onClick={() => closeAndRun(onOpenShare)}><Share2 />Compartilhar com amigos</button><div className="reference-sidebar-sep" /><p>Backup / Dados</p><button type="button" onClick={() => closeAndRun(onExportJSON)}><Download />Exportar JSON</button><button type="button" onClick={() => closeAndRun(onExportCSV)}><Download />Exportar CSV</button><button type="button" className="danger" onClick={() => closeAndRun(onClearAll)}><Trash2 />Apagar tudo</button><div className="reference-sidebar-sep" /><a href="/app/perfil" onClick={() => setMenuOpen(false)}><Smartphone />Meu Perfil</a>{onOpenOnboarding && <button type="button" onClick={() => closeAndRun(onOpenOnboarding)}><HelpCircle />Tutorial do app</button>}<button type="button" onClick={() => closeAndRun(onOpenLicense)}><Gauge />Ativar licença PRO</button><button type="button" className="danger" onClick={() => closeAndRun(onLogout)}><LogOut />Sair da conta</button></nav></aside></>}
      <div className="reference-dashboard-body">
        <section className="reference-dashboard-profit">
          <div><p>Lucro líquido <span>ⓘ</span></p><strong>{formatBRL(net)}</strong><small>Hoje, {dateLabel}</small></div>
          <div className="reference-dashboard-breakdown"><p>Ganhos <b>{formatBRL(amount)}</b></p><p>Despesas <em>- {formatBRL(expense)}</em></p></div>
        </section>
        <section className="reference-dashboard-kpis">
          <div><WalletCards /><span>Faturamento<b>{formatBRL(amount)}</b></span></div>
          <div><CircleDollarSign /><span>Gastos<b>{formatBRL(expense)}</b></span></div>
          <div><Flag /><span>Corridas<b>{count}</b></span></div>
          <div><MapPin /><span>Distância<b>{formatKm(km)}</b></span></div>
        </section>
        <div className="reference-periods">{(["hoje", "semana", "mes", "tudo"] as Period[]).map((value) => <button key={value} type="button" className={period === value ? "active" : ""} onClick={() => onPeriodChange(value)}>{value === "mes" ? "Mês" : value[0].toUpperCase() + value.slice(1)}</button>)}</div>
        {/* ===== Seções abaixo SÓ aparecem na aba 'corridas' =====
            Antes eram sempre exibidas, fazendo o conteúdo de outras abas
            (Despesas/Ofertas/Gráficos) aparecerem DEPOIS delas — dando a
            impressão de página duplicada. */}
        {activeTab === "corridas" && (
          <>
            <div className="reference-dashboard-duo">
              <section className="reference-dashboard-card reference-run-card"><header><h2>Corre do dia</h2><span>● Online</span></header><p>Inicie sua corrida, acompanhe em tempo real e registre ganhos e despesas.</p><div className="reference-map-dot" /><div className="reference-run-actions"><button type="button" onClick={onStartSession}><Play />Iniciar</button><button type="button" onClick={onOpenHeatmap}><Navigation />Mapa</button><button type="button" onClick={onStartSession}><Timer />Cronômetro</button></div></section>
              <section className="reference-dashboard-card reference-goal-card"><header><h2>Metas</h2><span>{goal ? goal.periodLabel : "Sem meta ativa"}</span></header><div className="reference-goal-line"><span>{goal?.label || "Meta de ganhos"}</span><b>{formatBRL(goal?.targetValue ?? 0)}</b></div><div className="reference-progress"><span style={{ width: `${Math.min(100, goalProgress)}%` }} /></div><div className="reference-goal-meta"><span>{goal ? `${Math.round(goalProgress)}% concluída` : "Crie uma meta para acompanhar"}</span><span>{goal ? `Faltam ${formatBRL(goalRemaining)}` : ""}</span></div><div className="reference-streak"><strong>Progresso atual</strong><b>{formatBRL(goal?.currentValue ?? 0)}</b><small>Valores calculados a partir das corridas registradas.</small></div></section>
            </div>
            <section className="reference-dashboard-card reference-apps-card"><header><h2>Resumo por app</h2><button type="button" onClick={() => onTabChange("corridas")}>Ver todos</button></header><div className="reference-app-grid">{stats.byApp.length === 0 ? <p className="text-xs text-zinc-500">Nenhum app com corridas neste período.</p> : stats.byApp.map((app) => {
              const appMeta = findApp(app.app, apps);
              return (
                <div key={app.app}>
                  {appMeta?.image ? (
                    <img src={appMeta.image} alt={app.label} className="reference-app-logo" />
                  ) : (
                    <span className="reference-app-icon" style={{ background: app.color }}>{app.label.slice(0, 2)}</span>
                  )}
                  <strong>{app.label}</strong>
                  <b>{formatBRL(app.total)}</b>
                  <small>{app.count} {app.count === 1 ? "corrida" : "corridas"}</small>
                </div>
              );
            })}</div></section>
            <section className="reference-dashboard-card reference-recent-card"><header><h2>Últimas corridas</h2><button type="button" onClick={() => onTabChange("corridas")}>Ver todas</button></header>{recentDeliveries.length === 0 ? <p className="text-xs text-zinc-500">Nenhuma corrida registrada neste período.</p> : recentDeliveries.slice(0, 5).map((delivery) => {
              const appMeta = findApp(delivery.app, apps);
              return (
                <button type="button" className="reference-recent-row" key={delivery.id} onClick={() => onTabChange("corridas")}>
                  <span className="reference-recent-app">
                    {appMeta?.image ? (
                      <img src={appMeta.image} alt={appMeta.label} className="reference-recent-logo" />
                    ) : null}
                    <b>{new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(delivery.timestamp))}</b>
                    <small>{delivery.date}<br />{delivery.address || delivery.app}</small>
                  </span>
                  <strong>{formatBRL(delivery.value)}</strong>
                  <ChevronRight />
                </button>
              );
            })}</section>
          </>
        )}
        {/* Botão "Nova corrida" removido daqui — o FAB (botão flutuante fixo
            no rodapé) já cumpre essa função. Ter 2 botões "Nova corrida"
            visíveis causava confusão e duplicação visual. */}
      </div>
      {/* Barra de navegação inferior removida daqui — o componente BottomNav
          (classe 'bottom-nav-premium' com glassmorphism) já é renderizado em
          page.tsx fora do ReferenceDashboard. Ter 2 barras inferiores
          causava duplicação visual. */}
    </section>
  );
}
