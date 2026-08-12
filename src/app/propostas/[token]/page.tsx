"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, FileText, Calendar, Building2, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PublicProposal {
  id: string;
  number: string;
  title: string;
  body: string;
  summary: string | null;
  billingModel: string | null;
  campaignPrice: number | null;
  leadPrice: number | null;
  validUntil: string | null;
  sentAt: string | null;
  status: string;
  version: number;
  partner: {
    companyName: string;
    city: string | null;
    state: string | null;
  };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-zinc-700 text-zinc-300" },
  sent: { label: "Enviada", color: "bg-blue-500/20 text-blue-400" },
  approved: { label: "Aprovada", color: "bg-emerald-500/20 text-emerald-400" },
  rejected: { label: "Rejeitada", color: "bg-red-500/20 text-red-400" },
  expired: { label: "Expirada", color: "bg-amber-500/20 text-amber-400" },
  canceled: { label: "Cancelada", color: "bg-zinc-700 text-zinc-500" },
};

const BILLING_LABELS: Record<string, string> = {
  campaign: "Por Campanha",
  lead: "Por Lead",
  both: "Campanha + Lead (Duplo)",
};

function formatBRL(v: number | null): string {
  if (v === null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Renderizador Markdown simples (apenas headings, parágrafos, listas, bold)
function renderMarkdown(md: string): React.ReactNode {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listKey = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${listKey++}`} className="my-2 list-disc space-y-1 pl-6">
          {listItems}
        </ul>,
      );
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      flushList();
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={i} className="mt-4 mb-2 text-base font-semibold text-zinc-100">
          {trimmed.slice(4)}
        </h3>,
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={i} className="mt-5 mb-2 text-lg font-bold text-zinc-100">
          {trimmed.slice(3)}
        </h2>,
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={i} className="mb-3 text-xl font-bold text-zinc-100">
          {trimmed.slice(2)}
        </h1>,
      );
      continue;
    }

    // List items
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listItems.push(
        <li key={`li-${i}`} className="text-sm text-zinc-300">
          {renderInline(trimmed.slice(2))}
        </li>,
      );
      continue;
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      listItems.push(
        <li key={`li-${i}`} className="text-sm text-zinc-300">
          {renderInline(numMatch[2])}
        </li>,
      );
      continue;
    }

    // HR
    if (trimmed === "---") {
      flushList();
      elements.push(<hr key={i} className="my-4 border-zinc-800" />);
      continue;
    }

    // Parágrafo
    flushList();
    elements.push(
      <p key={i} className="my-2 text-sm text-zinc-300 leading-relaxed">
        {renderInline(trimmed)}
      </p>,
    );
  }

  flushList();
  return elements;
}

function renderInline(text: string): React.ReactNode {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-zinc-100">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

export default function PublicProposalPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const [proposal, setProposal] = useState<PublicProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/public/proposals/${token}`)
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          throw new Error(data.error ?? "Erro ao carregar proposta");
        }
        return r.json();
      })
      .then((data) => setProposal(data.proposal))
      .catch((e) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 text-zinc-500">
        <div className="text-center">
          <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
          <p className="text-sm">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 p-6 text-zinc-300">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
          <h1 className="mb-2 text-xl font-bold">Proposta não disponível</h1>
          <p className="text-sm text-zinc-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!proposal) return null;

  const statusInfo = STATUS_LABELS[proposal.status] ?? {
    label: proposal.status,
    color: "bg-zinc-700 text-zinc-300",
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-zinc-500">Proposta {proposal.number}</p>
              <h1 className="mt-1 text-xl font-bold text-zinc-100 sm:text-2xl">
                {proposal.title}
              </h1>
              <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                <Building2 className="h-3 w-3" />
                <span>{proposal.partner.companyName}</span>
                {proposal.partner.city && (
                  <span>
                    · {proposal.partner.city}
                    {proposal.partner.state ? `/${proposal.partner.state}` : ""}
                  </span>
                )}
              </div>
            </div>
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
          </div>

          {proposal.summary && (
            <p className="mt-3 rounded bg-zinc-950/50 p-3 text-sm italic text-zinc-400">
              {proposal.summary}
            </p>
          )}

          {/* Metadados de cobrança */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {proposal.billingModel && (
              <div>
                <p className="text-[10px] uppercase text-zinc-500">Modelo</p>
                <p className="text-sm font-medium text-zinc-300">
                  {BILLING_LABELS[proposal.billingModel] ?? proposal.billingModel}
                </p>
              </div>
            )}
            {(proposal.billingModel === "campaign" || proposal.billingModel === "both") && (
              <div>
                <p className="text-[10px] uppercase text-zinc-500">Campanha/mês</p>
                <p className="text-sm font-medium text-emerald-400">
                  {formatBRL(proposal.campaignPrice)}
                </p>
              </div>
            )}
            {(proposal.billingModel === "lead" || proposal.billingModel === "both") && (
              <div>
                <p className="text-[10px] uppercase text-zinc-500">Por lead</p>
                <p className="text-sm font-medium text-emerald-400">
                  {formatBRL(proposal.leadPrice)}
                </p>
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase text-zinc-500">Válida até</p>
              <p className="flex items-center gap-1 text-sm font-medium text-zinc-300">
                <Calendar className="h-3 w-3" />
                {formatDate(proposal.validUntil)}
              </p>
            </div>
          </div>

          {proposal.status === "sent" && (
            <div className="mt-4 flex items-center gap-2 rounded border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-amber-300">
              <AlertCircle className="h-3 w-3" />
              <span>
                Esta proposta está aguardando sua análise. Entre em contato com o MeuCorre para aprovar ou tirar dúvidas.
              </span>
            </div>
          )}

          {proposal.status === "approved" && (
            <div className="mt-4 flex items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/5 p-2 text-xs text-emerald-300">
              <Check className="h-3 w-3" />
              <span>Proposta aprovada! Em breve entraremos em contato para os próximos passos.</span>
            </div>
          )}

          {proposal.status === "rejected" && (
            <div className="mt-4 flex items-center gap-2 rounded border border-red-500/30 bg-red-500/5 p-2 text-xs text-red-300">
              <X className="h-3 w-3" />
              <span>Proposta rejeitada. Caso queira renegociar, entre em contato.</span>
            </div>
          )}
        </div>

        {/* Corpo da proposta */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <FileText className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Detalhes da Proposta</h2>
          </div>
          <div className="mt-4">{renderMarkdown(proposal.body)}</div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-zinc-600">
          <p>
            MeuCorre · Centralizar, registrar e visualizar o lucro real do entregador
          </p>
          <p className="mt-1">
            <a
              href="https://meucorre.vercel.app/"
              className="text-emerald-500 hover:underline"
            >
              meucorre.vercel.app
            </a>
            {" · "}
            <a
              href="mailto:contato@meucorre.com.br"
              className="text-emerald-500 hover:underline"
            >
              contato@meucorre.com.br
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
