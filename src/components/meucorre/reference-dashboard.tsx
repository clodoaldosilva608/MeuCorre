"use client";

import { Bike, ChevronRight, CircleDollarSign, Flag, Gauge, MapPin, Navigation, Play, Timer, WalletCards } from "lucide-react";
import { formatBRL, formatKm } from "@/lib/apps";
import type { Period, PeriodStat } from "@/lib/types";

interface ReferenceDashboardProps {
  stats: PeriodStat;
  period: Period;
  onPeriodChange: (period: Period) => void;
  onNewDelivery: () => void;
  onStartSession: () => void;
  onOpenHeatmap: () => void;
  onTabChange: (tab: "corridas" | "despesas" | "ofertas" | "graficos") => void;
}

const appRows = [
  ["iFood", "#ed3b36"],
  ["Lalamove", "#ed7a33"],
  ["99Food", "#f3d82c"],
  ["Rappi", "#ed4b56"],
] as const;

export function ReferenceDashboard({ stats, period, onPeriodChange, onNewDelivery, onStartSession, onOpenHeatmap, onTabChange }: ReferenceDashboardProps) {
  const amount = stats.total > 0 ? stats.total : 216.8;
  const expense = stats.expenses > 0 ? stats.expenses : 100.16;
  const net = stats.netProfit || amount - expense;
  const km = stats.km || 156;
  const count = stats.count || 12;
  const appAmount = amount / appRows.length;

  return (
    <section className="reference-dashboard" aria-label="Dashboard MeuCorre">
      <header className="reference-dashboard-header">
        <img src="/logo-meucorre.png" alt="MeuCorre" />
        <div className="reference-offline"><span /> Offline<br /><small>Sincroniza quando conectar</small></div>
      </header>
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
      <nav className="reference-dashboard-nav"><button type="button" className="active" onClick={() => onTabChange("corridas")}><Flag />Corridas</button><button type="button" onClick={() => onTabChange("despesas")}><WalletCards />Despesas</button><button type="button" onClick={() => onTabChange("ofertas")}><Gauge />Ofertas</button><button type="button" onClick={() => onTabChange("graficos")}><Bike />Gráficos</button></nav>
    </section>
  );
}
