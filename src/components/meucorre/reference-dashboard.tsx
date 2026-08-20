"use client";

import { useState } from "react";
import { Bike, ChevronRight, CircleDollarSign, Download, Flag, Gauge, Grid3X3, HelpCircle, LogOut, MapPin, Menu, Navigation, Play, Share2, Smartphone, Timer, Trash2, WalletCards, X } from "lucide-react";
import { formatBRL, formatKm } from "@/lib/apps";
import type { PeriodFilter as Period, PeriodStat } from "@/lib/types";

interface ReferenceDashboardProps {
  stats: PeriodStat;
  period: Period;
  activeTab: "corridas" | "despesas" | "ofertas" | "graficos";
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

const appRows = [
  ["iFood", "#ed3b36"],
  ["Lalamove", "#ed7a33"],
  ["99Food", "#f3d82c"],
  ["Rappi", "#ed4b56"],
] as const;

export function ReferenceDashboard({ stats, period, activeTab, onPeriodChange, onNewDelivery, onStartSession, onOpenHeatmap, onTabChange, onOpenApps, onOpenCapture, onOpenLicense, onOpenShare, onOpenOnboarding, onExportJSON, onExportCSV, onClearAll, onLogout }: ReferenceDashboardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeAndRun = (fn: () => void) => { setMenuOpen(false); fn(); };
  const amount = stats.total > 0 ? stats.total : 216.8;
  const expense = stats.expenses > 0 ? stats.expenses : 100.16;
  const net = stats.netProfit || amount - expense;
  const km = stats.km || 156;
  const count = stats.count || 12;
  const appAmount = amount / appRows.length;

  return (
    <section className="reference-dashboard" aria-label="Dashboard MeuCorre">
      <header className="reference-dashboard-header">
        <div className="reference-dashboard-brand"><img src="/logo-meucorre.png" alt="" /><strong>Meu<span>Corre</span></strong></div>
        <div className="reference-dashboard-header-actions"><div className="reference-offline"><span /> Offline<br /><small>Sincroniza quando conectar</small></div><button type="button" className="reference-menu-button" aria-label="Abrir menu lateral" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu /></button></div>
      </header>
      {menuOpen && <><button type="button" className="reference-sidebar-backdrop" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} /><aside className="reference-sidebar" aria-label="Menu de ações"><div className="reference-sidebar-head"><div><strong>Menu</strong><small>Ações e configurações</small></div><button type="button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}><X /></button></div><nav><button type="button" onClick={() => closeAndRun(onOpenCapture)}><Navigation />Capturar por notificação</button><button type="button" onClick={() => closeAndRun(onOpenApps)}><Grid3X3 />Gerenciar apps de entrega</button><button type="button" onClick={() => closeAndRun(onOpenShare)}><Share2 />Compartilhar com amigos</button><button type="button" onClick={() => closeAndRun(() => window.location.assign('/app?legacy=1'))}><Grid3X3 />Recursos completos do app</button><div className="reference-sidebar-sep" /><p>Backup / Dados</p><button type="button" onClick={() => closeAndRun(onExportJSON)}><Download />Exportar JSON</button><button type="button" onClick={() => closeAndRun(onExportCSV)}><Download />Exportar CSV</button><button type="button" className="danger" onClick={() => closeAndRun(onClearAll)}><Trash2 />Apagar tudo</button><div className="reference-sidebar-sep" /><a href="/app/perfil" onClick={() => setMenuOpen(false)}><Smartphone />Meu Perfil</a>{onOpenOnboarding && <button type="button" onClick={() => closeAndRun(onOpenOnboarding)}><HelpCircle />Tutorial do app</button>}<button type="button" onClick={() => closeAndRun(onOpenLicense)}><Gauge />Ativar licença PRO</button><button type="button" className="danger" onClick={() => closeAndRun(onLogout)}><LogOut />Sair da conta</button></nav></aside></>}
      <div className="reference-dashboard-body">
        <section className="reference-dashboard-profit">
          <div><p>Lucro líquido <span>ⓘ</span></p><strong>{formatBRL(net)}</strong><small>Hoje, 24 de maio</small></div>
          <div className="reference-dashboard-breakdown"><p>Ganhos <b>{formatBRL(amount)}</b></p><p>Despesas <em>- {formatBRL(expense)}</em></p></div>
        </section>
        <section className="reference-dashboard-kpis">
          <div><WalletCards /><span>Faturamento<b>{formatBRL(amount)}</b></span></div>
          <div><CircleDollarSign /><span>Gastos<b>{formatBRL(expense)}</b></span></div>
          <div><Flag /><span>Corridas<b>{count}</b></span></div>
          <div><MapPin /><span>Distância<b>{formatKm(km)}</b></span></div>
        </section>
        <div className="reference-periods">{(["hoje", "semana", "mes", "tudo"] as Period[]).map((value) => <button key={value} type="button" className={period === value ? "active" : ""} onClick={() => onPeriodChange(value)}>{value === "mes" ? "Mês" : value[0].toUpperCase() + value.slice(1)}</button>)}</div>
        <div className="reference-dashboard-duo">
          <section className="reference-dashboard-card reference-run-card"><header><h2>Corre do dia</h2><span>● Online</span></header><p>Inicie sua corrida, acompanhe em tempo real e registre ganhos e despesas.</p><div className="reference-map-dot" /><div className="reference-run-actions"><button type="button" onClick={onStartSession}><Play />Iniciar</button><button type="button" onClick={onOpenHeatmap}><Navigation />Mapa</button><button type="button" onClick={onStartSession}><Timer />Cronômetro</button></div></section>
          <section className="reference-dashboard-card reference-goal-card"><header><h2>Metas</h2><button type="button">Editar</button></header><div className="reference-goal-line"><span>Meta diária</span><b>R$ 200,00</b></div><div className="reference-progress"><span /></div><div className="reference-goal-meta"><span>58% concluída</span><span>Faltam R$ 83,36</span></div><div className="reference-streak"><strong>🔥 Sequência</strong><b>3 dias</b><small>Melhore sua sequência e multiplique seus resultados.</small></div></section>
        </div>
        <section className="reference-dashboard-card reference-apps-card"><header><h2>Resumo por app</h2><button type="button" onClick={() => onTabChange("corridas")}>Ver todos</button></header><div className="reference-app-grid">{appRows.map(([name, color], index) => <div key={name}><span className="reference-app-icon" style={{ background: color }}>{name === "99Food" ? "99" : name.slice(0, 1)}</span><strong>{name}</strong><b>{formatBRL(appAmount * (1 - index * 0.12))}</b><small>{Math.max(1, Math.round(count / 4))} corridas</small></div>)}</div></section>
        <section className="reference-dashboard-card reference-recent-card"><header><h2>Últimas corridas</h2><button type="button" onClick={() => onTabChange("corridas")}>Ver todas</button></header>{["Vila Madalena → Itaim Bibi", "Moema → Paraíso", "Centro → Liberdade"].map((route, index) => <button type="button" className="reference-recent-row" key={route} onClick={() => onTabChange("corridas")}><span><b>{["08:43", "07:22", "06:35"][index]}</b><small>Hoje<br />{route}</small></span><strong>{formatBRL([23.4, 18.6, 15.2][index])}</strong><ChevronRight /></button>)}</section>
        <button type="button" className="reference-new-run" onClick={onNewDelivery}><span>＋</span> Nova corrida</button>
      </div>
      <nav className="reference-dashboard-nav"><button type="button" className={activeTab === "corridas" ? "active" : ""} onClick={() => onTabChange("corridas")}><Flag />Corridas</button><button type="button" className={activeTab === "despesas" ? "active" : ""} onClick={() => onTabChange("despesas")}><WalletCards />Despesas</button><button type="button" className={activeTab === "ofertas" ? "active" : ""} onClick={() => onTabChange("ofertas")}><Gauge />Ofertas</button><button type="button" className={activeTab === "graficos" ? "active" : ""} onClick={() => onTabChange("graficos")}><Bike />Gráficos</button></nav>
    </section>
  );
}
