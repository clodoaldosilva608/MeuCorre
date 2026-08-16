"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Play,
  Clock,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Bell,
  ChevronRight,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ===== Página Admin: Security Scanner =====

type Severity = "critical" | "high" | "medium" | "low";
type ScanCategory = "secrets" | "rls" | "auth" | "input" | "ratelimit";

interface Finding {
  id: string;
  category: ScanCategory;
  file: string;
  line: number;
  severity: Severity;
  rule: string;
  description: string;
  match?: string;
  recommendation: string;
}

interface ScanResult {
  category: ScanCategory;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  filesScanned: number;
  findings: Finding[];
  score: number;
  summary: string;
}

interface FullScanResult {
  id: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  results: Record<ScanCategory, ScanResult>;
  totalFindings: number;
  overallScore: number;
}

interface Schedule {
  enabled: boolean;
  dayOfWeek: number;
  hour: number;
  minute: number;
  notifyTelegram: boolean;
  lastRunAt: string | null;
  lastResult: { overallScore: number; totalFindings: number } | null;
}

const CATEGORIES: Array<{ id: ScanCategory; label: string; icon: string; description: string }> = [
  { id: "secrets", label: "Segredos & Chaves", icon: "🔑", description: "Tokens, API keys, senhas hardcoded" },
  { id: "rls", label: "RLS & Banco", icon: "🛡️", description: "Row Level Security, service_role" },
  { id: "auth", label: "Auth & IDOR", icon: "🔐", description: "Rotas sem auth, ID sem checar dono" },
  { id: "input", label: "Input & XSS", icon: "🧹", description: "Validação, XSS, upload" },
  { id: "ratelimit", label: "Rate Limiting", icon: "⚡", description: "Rotas sensíveis sem limite" },
];

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const SEVERITY_CONFIG: Record<Severity, { emoji: string; color: string; bg: string; label: string }> = {
  critical: { emoji: "🔴", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", label: "CRÍTICO" },
  high: { emoji: "🟠", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", label: "ALTO" },
  medium: { emoji: "🟡", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", label: "MÉDIO" },
  low: { emoji: "🟢", color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", label: "BAIXO" },
};

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState<ScanCategory | "overview" | "schedule">("overview");
  const [scanning, setScanning] = useState<ScanCategory | "full" | null>(null);
  const [fullResult, setFullResult] = useState<FullScanResult | null>(null);
  const [singleResults, setSingleResults] = useState<Partial<Record<ScanCategory, ScanResult>>>({});
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [logs, setLogs] = useState<Array<{ time: string; msg: string; type: "info" | "success" | "error" }>>([]);

  const addLog = (msg: string, type: "info" | "success" | "error" = "info") => {
    setLogs((prev) => [
      ...prev.slice(-50),
      { time: new Date().toLocaleTimeString("pt-BR"), msg, type },
    ]);
  };

  // Carrega agendamento
  const loadSchedule = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/security/schedule");
      if (res.ok) {
        const data = await res.json();
        setSchedule(data);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Executa scan único
  const runSingleScan = async (category: ScanCategory) => {
    setScanning(category);
    addLog(`Iniciando scan: ${CATEGORIES.find((c) => c.id === category)?.label}...`);
    try {
      const res = await fetch(`/api/admin/security/scan?category=${category}`);
      if (!res.ok) throw new Error("Falha no scan");
      const result: ScanResult = await res.json();
      setSingleResults((prev) => ({ ...prev, [category]: result }));
      addLog(`✅ ${CATEGORIES.find((c) => c.id === category)?.label}: ${result.findings.length} findings, score ${result.score}/100`, "success");
    } catch (err) {
      addLog(`❌ Erro: ${err instanceof Error ? err.message : "desconhecido"}`, "error");
    } finally {
      setScanning(null);
    }
  };

  // Executa scan completo
  const runFullScan = async () => {
    setScanning("full");
    setLogs([]);
    addLog("🚀 Iniciando scan COMPLETO de segurança...");
    addLog("Varrendo todas as categorias...");
    try {
      const res = await fetch(`/api/admin/security/scan?full=true`);
      if (!res.ok) throw new Error("Falha no scan completo");
      const result: FullScanResult = await res.json();
      setFullResult(result);
      setSingleResults(result.results);
      addLog(`✅ Scan completo finalizado em ${result.durationMs}ms`, "success");
      addLog(`Score geral: ${result.overallScore}/100 | ${result.totalFindings} findings`, "success");
      toast.success("Scan completo finalizado!", {
        description: `Score: ${result.overallScore}/100 | ${result.totalFindings} issues`,
      });
    } catch (err) {
      addLog(`❌ Erro: ${err instanceof Error ? err.message : "desconhecido"}`, "error");
      toast.error("Erro no scan completo");
    } finally {
      setScanning(null);
    }
  };

  // Salva agendamento
  const saveSchedule = async (updates: Partial<Schedule>) => {
    try {
      const res = await fetch("/api/admin/security/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Falha ao salvar");
      const data = await res.json();
      setSchedule(data.schedule);
      toast.success("Agendamento salvo!");
    } catch {
      toast.error("Erro ao salvar agendamento");
    }
  };

  const overallScore = fullResult?.overallScore ?? 0;
  const scoreColor = overallScore >= 80 ? "text-green-400" : overallScore >= 50 ? "text-yellow-400" : "text-red-400";
  const scoreBg = overallScore >= 80 ? "from-green-500 to-emerald-500" : overallScore >= 50 ? "from-yellow-500 to-orange-500" : "from-red-500 to-rose-500";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-emerald-400" />
              <div>
                <h1 className="text-xl font-bold">Security Scanner</h1>
                <p className="text-xs text-zinc-400">Varredura de segurança automatizada</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={runFullScan}
                disabled={scanning !== null}
                className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
              >
                {scanning === "full" ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scaneando...</>
                ) : (
                  <><Play className="h-4 w-4 mr-2" /> Scan Completo</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-zinc-800 pb-2">
          <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<Activity className="h-4 w-4" />}>
            Visão Geral
          </TabButton>
          {CATEGORIES.map((cat) => (
            <TabButton
              key={cat.id}
              active={activeTab === cat.id}
              onClick={() => setActiveTab(cat.id)}
              icon={<span>{cat.icon}</span>}
            >
              {cat.label}
            </TabButton>
          ))}
          <TabButton active={activeTab === "schedule"} onClick={() => setActiveTab("schedule")} icon={<Clock className="h-4 w-4" />}>
            Agendamento
          </TabButton>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview" && (
              <OverviewTab
                fullResult={fullResult}
                singleResults={singleResults}
                scanning={scanning}
                onRunFull={runFullScan}
                onRunSingle={runSingleScan}
                logs={logs}
                schedule={schedule}
              />
            )}

            {CATEGORIES.some((c) => c.id === activeTab) && (
              <CategoryTab
                category={activeTab as ScanCategory}
                result={singleResults[activeTab as ScanCategory]}
                scanning={scanning}
                onRun={() => runSingleScan(activeTab as ScanCategory)}
              />
            )}

            {activeTab === "schedule" && (
              <ScheduleTab schedule={schedule} onSave={saveSchedule} onReload={loadSchedule} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function ScoreCard({ score, title, subtitle }: { score: number; title: string; subtitle: string }) {
  const color = score >= 80 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-red-400";
  const bg = score >= 80 ? "from-green-500/20 to-emerald-500/10 border-green-500/30" : score >= 50 ? "from-yellow-500/20 to-orange-500/10 border-yellow-500/30" : "from-red-500/20 to-rose-500/10 border-red-500/30";
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${bg} p-5`}>
      <p className="text-xs text-zinc-400">{title}</p>
      <p className={`mt-1 text-3xl font-black ${color}`}>{score}<span className="text-lg text-zinc-500">/100</span></p>
      <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
    </div>
  );
}

function OverviewTab({ fullResult, singleResults, scanning, onRunFull, onRunSingle, logs, schedule }: {
  fullResult: FullScanResult | null;
  singleResults: Partial<Record<ScanCategory, ScanResult>>;
  scanning: ScanCategory | "full" | null;
  onRunFull: () => void;
  onRunSingle: (c: ScanCategory) => void;
  logs: Array<{ time: string; msg: string; type: string }>;
  schedule: Schedule | null;
}) {
  const overall = fullResult?.overallScore ?? 0;
  const total = fullResult?.totalFindings ?? 0;
  const color = overall >= 80 ? "text-green-400" : overall >= 50 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="space-y-6">
      {/* Score geral + Ações */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ScoreCard score={overall} title="SCORE GERAL" subtitle={fullResult ? `${total} findings total` : "Rode um scan para ver"} />
        <ScoreCard
          score={Object.values(singleResults).filter(Boolean).length}
          title="CATEGORIAS TESTADAS"
          subtitle={`de ${CATEGORIES.length} categorias`}
        />
        <ScoreCard
          score={schedule?.enabled ? 100 : 0}
          title="AGENDAMENTO"
          subtitle={schedule?.enabled ? `Todo ${DAYS[schedule.dayOfWeek]} às ${schedule.hour}:${String(schedule.minute).padStart(2, "0")}` : "Desabilitado"}
        />
      </div>

      {/* Cards por categoria */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-zinc-400">CATEGORIAS</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const result = singleResults[cat.id];
            const isScanning = scanning === cat.id;
            return (
              <div
                key={cat.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat.icon}</span>
                      <p className="text-sm font-bold">{cat.label}</p>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{cat.description}</p>
                  </div>
                  {result && (
                    <span className={`text-2xl font-black ${result.score >= 80 ? "text-green-400" : result.score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                      {result.score}
                    </span>
                  )}
                </div>
                {result && (
                  <p className="mt-2 text-xs text-zinc-400">{result.summary}</p>
                )}
                <button
                  onClick={() => onRunSingle(cat.id)}
                  disabled={scanning !== null}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isScanning ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> Scaneando...</>
                  ) : (
                    <><Play className="h-3 w-3" /> Executar</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Log ao vivo */}
      {logs.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-zinc-400">
            <Activity className="h-4 w-4" /> LOG AO VIVO
          </h2>
          <div className="rounded-2xl border border-zinc-800 bg-black/50 p-4 font-mono text-xs">
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-zinc-600">{log.time}</span>
                  <span className={log.type === "success" ? "text-green-400" : log.type === "error" ? "text-red-400" : "text-zinc-300"}>
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryTab({ category, result, scanning, onRun }: {
  category: ScanCategory;
  result?: ScanResult;
  scanning: ScanCategory | "full" | null;
  onRun: () => void;
}) {
  const cat = CATEGORIES.find((c) => c.id === category)!;
  const isScanning = scanning === category;

  return (
    <div className="space-y-6">
      {/* Header da categoria */}
      <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{cat.icon}</span>
          <div>
            <h2 className="text-lg font-bold">{cat.label}</h2>
            <p className="text-xs text-zinc-400">{cat.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {result && (
            <div className="text-right">
              <p className={`text-3xl font-black ${result.score >= 80 ? "text-green-400" : result.score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                {result.score}
              </p>
              <p className="text-xs text-zinc-500">/100</p>
            </div>
          )}
          <Button onClick={onRun} disabled={scanning !== null} variant="outline" className="border-zinc-700">
            {isScanning ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scaneando</> : <><RefreshCw className="h-4 w-4 mr-2" /> Executar</>}
          </Button>
        </div>
      </div>

      {/* Info do scan */}
      {result && (
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
            <p className="text-xs text-zinc-500">Arquivos</p>
            <p className="font-bold">{result.filesScanned}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
            <p className="text-xs text-zinc-500">Findings</p>
            <p className="font-bold">{result.findings.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
            <p className="text-xs text-zinc-500">Duração</p>
            <p className="font-bold">{result.durationMs}ms</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
            <p className="text-xs text-zinc-500">Status</p>
            <p className="font-bold">{result.findings.length === 0 ? "✅ Limpo" : "⚠️ Issues"}</p>
          </div>
        </div>
      )}

      {/* Lista de findings */}
      {result && result.findings.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-zinc-400">FINDINGS ({result.findings.length})</h3>
          {result.findings.map((f, i) => {
            const cfg = SEVERITY_CONFIG[f.severity];
            return (
              <motion.div
                key={f.id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`rounded-xl border p-4 ${cfg.bg}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{cfg.emoji}</span>
                      <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-xs text-zinc-500">•</span>
                      <span className="text-sm font-semibold">{f.rule}</span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-300">{f.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                      <span className="font-mono">{f.file}{f.line > 0 && `:${f.line}`}</span>
                      {f.match && <span className="font-mono text-zinc-600">match: {f.match}</span>}
                    </div>
                    <div className="mt-2 rounded-lg bg-black/30 p-2 text-xs text-zinc-400">
                      <span className="font-bold text-emerald-400">Fix: </span>
                      {f.recommendation}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {result && result.findings.length === 0 && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-400" />
          <p className="mt-2 text-lg font-bold text-green-400">Nenhum problema encontrado!</p>
          <p className="mt-1 text-sm text-zinc-400">{cat.label} está limpo.</p>
        </div>
      )}

      {!result && !isScanning && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 text-center">
          <Shield className="mx-auto h-12 w-12 text-zinc-600" />
          <p className="mt-2 text-sm text-zinc-400">Clique em "Executar" para rodar o scan.</p>
        </div>
      )}
    </div>
  );
}

function ScheduleTab({ schedule, onSave, onReload }: {
  schedule: Schedule | null;
  onSave: (updates: Partial<Schedule>) => void;
  onReload: () => void;
}) {
  const [dayOfWeek, setDayOfWeek] = useState(schedule?.dayOfWeek ?? 0);
  const [hour, setHour] = useState(schedule?.hour ?? 3);
  const [minute, setMinute] = useState(schedule?.minute ?? 0);
  const [notifyTelegram, setNotifyTelegram] = useState(schedule?.notifyTelegram ?? true);

  useEffect(() => {
    if (schedule) {
      setDayOfWeek(schedule.dayOfWeek);
      setHour(schedule.hour);
      setMinute(schedule.minute);
      setNotifyTelegram(schedule.notifyTelegram);
    }
  }, [schedule]);

  if (!schedule) return <div className="text-zinc-400">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Clock className="h-5 w-5 text-emerald-400" /> Agendamento Automático
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Configure para rodar scan completo automaticamente toda semana.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">{schedule.enabled ? "Ativo" : "Inativo"}</span>
            <button
              onClick={() => onSave({ enabled: !schedule.enabled })}
              className={`relative h-7 w-12 rounded-full transition-colors ${schedule.enabled ? "bg-emerald-500" : "bg-zinc-700"}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${schedule.enabled ? "left-6" : "left-1"}`} />
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label className="text-xs text-zinc-400">Dia da semana</Label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            >
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Hora</Label>
            <Input type="number" min={0} max={23} value={hour} onChange={(e) => setHour(Number(e.target.value))} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Minuto</Label>
            <Input type="number" min={0} max={59} value={minute} onChange={(e) => setMinute(Number(e.target.value))} className="mt-1" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setNotifyTelegram(!notifyTelegram)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${notifyTelegram ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-zinc-700 text-zinc-400"}`}
          >
            <Bell className="h-4 w-4" />
            Notificar no Telegram
          </button>
          <p className="text-xs text-zinc-500">Relatório enviado direto no seu chat privado (não no grupo público)</p>
        </div>

        <div className="mt-6 flex gap-2">
          <Button onClick={() => onSave({ dayOfWeek, hour, minute, notifyTelegram })} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400">
            Salvar Agendamento
          </Button>
          <Button onClick={onReload} variant="outline" className="border-zinc-700">
            <RefreshCw className="h-4 w-4 mr-2" /> Recarregar
          </Button>
        </div>
      </div>

      {/* Histórico */}
      {schedule.lastRunAt && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="mb-3 text-sm font-bold text-zinc-400">ÚLTIMA EXECUÇÃO</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs text-zinc-500">Data</p>
              <p className="text-sm font-bold">{new Date(schedule.lastRunAt).toLocaleString("pt-BR")}</p>
            </div>
            {schedule.lastResult && (
              <>
                <div>
                  <p className="text-xs text-zinc-500">Score</p>
                  <p className={`text-sm font-bold ${schedule.lastResult.overallScore >= 80 ? "text-green-400" : schedule.lastResult.overallScore >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                    {schedule.lastResult.overallScore}/100
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Findings</p>
                  <p className="text-sm font-bold">{schedule.lastResult.totalFindings}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">
        <CheckCircle2 className="mb-1 h-4 w-4" />
        <strong>Configurado:</strong> Cron job ativo em <code className="rounded bg-black/30 px-1">vercel.json</code> — roda diariamente às 03:00 BRT. O scan só executa no dia/hora configurado acima. O relatório vai direto pro seu chat privado no Telegram.
      </div>
    </div>
  );
}
