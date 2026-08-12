"use client";

import { useState } from "react";
import {
  Download,
  FileText,
  Users,
  DollarSign,
  Tag,
  Loader2,
  Filter,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type ReportType = "partners" | "users" | "financial" | "campaigns";

const REPORTS: Array<{
  id: ReportType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    id: "partners",
    label: "Parceiros",
    description: "Empresas, contatos, estágios, scores, valores potenciais",
    icon: <HandshakeIcon />,
    color: "text-purple-400",
  },
  {
    id: "users",
    label: "Usuários",
    description: "Usuários do app, planos, status de assinatura, último login",
    icon: <Users className="h-5 w-5" />,
    color: "text-blue-400",
  },
  {
    id: "financial",
    label: "Financeiro",
    description: "Assinaturas, pagamentos, status, valores, datas de revisão",
    icon: <DollarSign className="h-5 w-5" />,
    color: "text-emerald-400",
  },
  {
    id: "campaigns",
    label: "Campanhas",
    description: "Campanhas de parceiros, métricas (views/clicks/leads), status",
    icon: <Tag className="h-5 w-5" />,
    color: "text-amber-400",
  },
];

function HandshakeIcon() {
  return <span className="text-lg">🤝</span>;
}

export function ReportsView() {
  const [downloading, setDownloading] = useState<ReportType | null>(null);

  // Filtros
  const [partnersStage, setPartnersStage] = useState("all");
  const [partnersStatus, setPartnersStatus] = useState("all");
  const [partnersCity, setPartnersCity] = useState("");
  const [partnersCategory, setPartnersCategory] = useState("all");

  const [usersIsPro, setUsersIsPro] = useState("all");
  const [usersSubStatus, setUsersSubStatus] = useState("all");

  const [finStatus, setFinStatus] = useState("all");
  const [finPayment, setFinPayment] = useState("all");
  const [finStart, setFinStart] = useState("");
  const [finEnd, setFinEnd] = useState("");

  const [campStatus, setCampStatus] = useState("all");

  const handleDownload = async (type: ReportType) => {
    setDownloading(type);
    try {
      const params = new URLSearchParams();
      params.set("format", "csv");

      if (type === "partners") {
        if (partnersStage !== "all") params.set("stage", partnersStage);
        if (partnersStatus !== "all") params.set("status", partnersStatus);
        if (partnersCity) params.set("city", partnersCity);
        if (partnersCategory !== "all") params.set("category", partnersCategory);
      } else if (type === "users") {
        if (usersIsPro !== "all") params.set("isPro", usersIsPro);
        if (usersSubStatus !== "all") params.set("subscriptionStatus", usersSubStatus);
      } else if (type === "financial") {
        if (finStatus !== "all") params.set("status", finStatus);
        if (finPayment !== "all") params.set("paymentMethod", finPayment);
        if (finStart) params.set("startDate", finStart);
        if (finEnd) params.set("endDate", finEnd);
      } else if (type === "campaigns") {
        if (campStatus !== "all") params.set("status", campStatus);
      }

      const res = await fetch(`/api/admin/metrics/reports/${type}?${params}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        // Tenta extrair filename do header
        const disposition = res.headers.get("Content-Disposition") ?? "";
        const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
        a.download = filenameMatch?.[1] ?? `${type}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Relatório de ${type} baixado`);
      } else {
        toast.error("Erro ao gerar relatório");
      }
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-xs text-blue-300">
        <div className="flex items-start gap-2">
          <FileText className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Relatórios exportáveis</p>
            <p className="mt-1 text-blue-400/80">
              Exportação CSV com BOM UTF-8 (compatível com Excel).
              Use os filtros para refinar o resultado. Máximo 5.000-10.000 registros por exportação.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Parceiros */}
        <ReportCard
          report={REPORTS[0]}
          downloading={downloading === "partners"}
          onDownload={() => handleDownload("partners")}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Estágio</Label>
              <Select value={partnersStage} onValueChange={setPartnersStage}>
                <SelectTrigger className="mt-0.5 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="novo_lead">Novo Lead</SelectItem>
                  <SelectItem value="qualificando">Qualificando</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Status</Label>
              <Select value={partnersStatus} onValueChange={setPartnersStatus}>
                <SelectTrigger className="mt-0.5 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Cidade</Label>
              <Input
                value={partnersCity}
                onChange={(e) => setPartnersCity(e.target.value)}
                placeholder="Recife"
                className="mt-0.5 h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px]">Categoria</Label>
              <Select value={partnersCategory} onValueChange={setPartnersCategory}>
                <SelectTrigger className="mt-0.5 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="oficina">Oficina</SelectItem>
                  <SelectItem value="alimentacao">Alimentação</SelectItem>
                  <SelectItem value="servicos">Serviços</SelectItem>
                  <SelectItem value="acessorios">Acessórios</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </ReportCard>

        {/* Usuários */}
        <ReportCard
          report={REPORTS[1]}
          downloading={downloading === "users"}
          onDownload={() => handleDownload("users")}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">PRO</Label>
              <Select value={usersIsPro} onValueChange={setUsersIsPro}>
                <SelectTrigger className="mt-0.5 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Apenas PRO</SelectItem>
                  <SelectItem value="false">Apenas Free</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Status assinatura</Label>
              <Select value={usersSubStatus} onValueChange={setUsersSubStatus}>
                <SelectTrigger className="mt-0.5 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="trialing">Trial</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </ReportCard>

        {/* Financeiro */}
        <ReportCard
          report={REPORTS[2]}
          downloading={downloading === "financial"}
          onDownload={() => handleDownload("financial")}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Status</Label>
              <Select value={finStatus} onValueChange={setFinStatus}>
                <SelectTrigger className="mt-0.5 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Método</Label>
              <Select value={finPayment} onValueChange={setFinPayment}>
                <SelectTrigger className="mt-0.5 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pix_manual">Pix Manual</SelectItem>
                  <SelectItem value="kiwify">Kiwify</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px]">Início</Label>
              <Input
                type="date"
                value={finStart}
                onChange={(e) => setFinStart(e.target.value)}
                className="mt-0.5 h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px]">Fim</Label>
              <Input
                type="date"
                value={finEnd}
                onChange={(e) => setFinEnd(e.target.value)}
                className="mt-0.5 h-7 text-xs"
              />
            </div>
          </div>
        </ReportCard>

        {/* Campanhas */}
        <ReportCard
          report={REPORTS[3]}
          downloading={downloading === "campaigns"}
          onDownload={() => handleDownload("campaigns")}
        >
          <div>
            <Label className="text-[10px]">Status</Label>
            <Select value={campStatus} onValueChange={setCampStatus}>
              <SelectTrigger className="mt-0.5 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="approved">Aprovada</SelectItem>
                <SelectItem value="published">Publicada</SelectItem>
                <SelectItem value="paused">Pausada</SelectItem>
                <SelectItem value="expired">Expirada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ReportCard>
      </div>
    </div>
  );
}

function ReportCard({
  report,
  downloading,
  onDownload,
  children,
}: {
  report: typeof REPORTS[0];
  downloading: boolean;
  onDownload: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start gap-3">
        <div className={`shrink-0 ${report.color}`}>{report.icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-100">{report.label}</p>
          <p className="mt-0.5 text-[10px] text-zinc-500">{report.description}</p>
        </div>
      </div>

      {children && (
        <div className="mt-3 border-t border-zinc-800 pt-3">
          <div className="mb-2 flex items-center gap-1 text-[10px] text-zinc-500">
            <Filter className="h-2.5 w-2.5" />
            Filtros
          </div>
          {children}
        </div>
      )}

      <Button
        onClick={onDownload}
        disabled={downloading}
        size="sm"
        className="mt-3 w-full gap-1.5 text-xs"
      >
        {downloading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        Baixar CSV
      </Button>
    </div>
  );
}
