import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { randomBytes } from "node:crypto";

// GET /api/admin/proposals — lista propostas
// Query: partnerId, opportunityId, status, search, limit, offset
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const partnerId = searchParams.get("partnerId") ?? undefined;
  const opportunityId = searchParams.get("opportunityId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);
  const offset = Number(searchParams.get("offset") ?? 0);

  const where: Record<string, unknown> = {};
  if (partnerId) where.partnerId = partnerId;
  if (opportunityId) where.opportunityId = opportunityId;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { number: { contains: search, mode: "insensitive" } },
      { summary: { contains: search, mode: "insensitive" } },
    ];
  }

  const [proposals, total] = await Promise.all([
    prisma.proposal.findMany({
      where,
      include: {
        partner: { select: { id: true, companyName: true, city: true, state: true } },
        opportunity: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.proposal.count({ where }),
  ]);

  return NextResponse.json({ proposals, total, limit, offset });
}

// POST /api/admin/proposals — cria proposta
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const adminEmail = await getAdminEmail();
  const body = (await req.json()) as {
    partnerId?: string;
    opportunityId?: string;
    title?: string;
    body?: string;
    summary?: string;
    billingModel?: string;
    campaignPrice?: number;
    leadPrice?: number;
    validUntil?: string;
    notes?: string;
    fromTemplate?: string; // template name to prefill body
  };

  if (!body.partnerId?.trim() || !body.title?.trim()) {
    return NextResponse.json(
      { error: "partnerId e title são obrigatórios" },
      { status: 400 },
    );
  }

  // Valida partner existe
  const partner = await prisma.partner.findUnique({ where: { id: body.partnerId } });
  if (!partner) {
    return NextResponse.json({ error: "Parceiro não encontrado" }, { status: 404 });
  }

  // Valida opportunity se informada
  if (body.opportunityId) {
    const opp = await prisma.opportunity.findFirst({
      where: { id: body.opportunityId, partnerId: body.partnerId },
    });
    if (!opp) {
      return NextResponse.json(
        { error: "Oportunidade não pertence a este parceiro" },
        { status: 400 },
      );
    }
  }

  // Gera número único: PROP-AAAA-NNN
  const year = new Date().getFullYear();
  const count = await prisma.proposal.count({
    where: { number: { startsWith: `PROP-${year}-` } },
  });
  const number = `PROP-${year}-${String(count + 1).padStart(3, "0")}`;

  // Valida billingModel (decisão #7)
  const validBilling = new Set(["campaign", "lead", "both"]);
  const billingModel = validBilling.has(body.billingModel ?? "")
    ? body.billingModel!
    : null;

  // Aplica template se informado
  let bodyContent = body.body ?? "";
  let summary = body.summary ?? null;
  if (body.fromTemplate) {
    const template = PROPOSAL_TEMPLATES[body.fromTemplate];
    if (template) {
      bodyContent = template.body
        .replace(/\{EMPRESA\}/g, partner.companyName)
        .replace(/\{CIDADE\}/g, partner.city ?? "")
        .replace(/\{ESTADO\}/g, partner.state ?? "")
        .replace(/\{CATEGORIA\}/g, partner.category ?? "");
      if (!summary) summary = template.summary.replace(/\{EMPRESA\}/g, partner.companyName);
      if (!billingModel && template.billingModel) {
        // template pode sugerir billingModel
      }
    }
  }

  if (!bodyContent.trim()) {
    return NextResponse.json(
      { error: "Corpo da proposta é obrigatório (body ou fromTemplate)" },
      { status: 400 },
    );
  }

  // Gera publicToken (16 bytes hex = 32 chars)
  const publicToken = randomBytes(16).toString("hex");

  try {
    const proposal = await prisma.proposal.create({
      data: {
        partnerId: body.partnerId,
        opportunityId: body.opportunityId || null,
        number,
        title: sanitizeString(body.title, 200),
        body: bodyContent,
        summary: sanitizeString(summary ?? "", 1000) || null,
        billingModel,
        campaignPrice: typeof body.campaignPrice === "number" ? body.campaignPrice : null,
        leadPrice: typeof body.leadPrice === "number" ? body.leadPrice : null,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        status: "draft",
        version: 1,
        publicToken,
        notes: sanitizeString(body.notes ?? "", 2000) || null,
        createdBy: adminEmail ?? "admin",
        createdByEmail: adminEmail,
      },
      include: {
        partner: { select: { id: true, companyName: true } },
      },
    });

    // Log no Partner
    await prisma.partnerLog.create({
      data: {
        partnerId: body.partnerId,
        action: "proposal_created",
        details: JSON.stringify({
          proposalId: proposal.id,
          number: proposal.number,
          title: proposal.title,
          billingModel: proposal.billingModel,
        }),
        adminEmail,
        ipAddress: req.headers.get("x-forwarded-for") ?? null,
      },
    });

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Erro ao criar proposta", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// ===== Templates de proposta (definidos no código) =====
// Cada template suporta variáveis: {EMPRESA}, {CIDADE}, {ESTADO}, {CATEGORIA}
export const PROPOSAL_TEMPLATES: Record<string, {
  name: string;
  description: string;
  billingModel?: "campaign" | "lead" | "both";
  summary: string;
  body: string;
}> = {
  standard_both: {
    name: "Padrão — Modelo Duplo (campanha + lead)",
    description: "Proposta padrão com cobrança por campanha mensal + por lead gerado",
    billingModel: "both",
    summary: "Proposta de parceria comercial MeuCorre × {EMPRESA} — modelo duplo de cobrança.",
    body: `# Proposta de Parceria Comercial — MeuCorre × {EMPRESA}

## Resumo

A **{EMPRESA}** (${`{CIDADE}`}/${`{ESTADO}`}) e o **MeuCorre** estabelecem uma parceria comercial para oferecer benefícios exclusivos aos entregadores de app da região, com modelo de cobrança duplo: por campanha mensal e por lead gerado.

## Sobre o MeuCorre

O MeuCorre é um PWA (Progressive Web App) instalável que ajuda entregadores a centralizar corridas, registrar despesas e visualizar o lucro líquido — inclusive sem conexão. Atualmente atendemos entregadores em toda a Região Metropolitana do Recife.

## Modelo de Cobrança (Duplo)

### 1. Por Campanha (mensal)
- **Valor:** R$ XXXX,XX/mês
- Inclui: anúncio destacado no app, postagem em redes sociais (Instagram, TikTok, YouTube, Facebook), relatório mensal de performance

### 2. Por Lead Gerado
- **Valor:** R$ XX,XX por lead qualificado
- Lead = entregador que clica no anúncio e completa o cadastro na plataforma da {EMPRESA}
- Relatório quinzenal com detalhamento

## Benefícios para a {EMPRESA}

1. **Exposição direta** para milhares de entregadores ativos na região
2. **Geração de leads qualificados** — entregadores são público de alto interesse
3. **Associação de marca** com ferramenta de produtividade financeira
4. **Métricas transparentes** — relatórios detalhados de cliques, conversões e ROI

## Vigência

- Início: a definir
- Duração: 90 dias (renovável)
- Cancelamento: 30 dias de aviso prévio

## Próximos Passos

1. Aprovação desta proposta pela {EMPRESA}
2. Configuração técnica da campanha (criação do anúncio, UTM, destino)
3. Ativação e monitoramento

---

**MeuCorre** — Centralizar, registrar e visualizar o lucro real do entregador.
contato@meucorre.com.br · https://meucorre.vercel.app`,
  },
  campaign_only: {
    name: "Simples — Por Campanha (mensal)",
    description: "Modelo simples com cobrança mensal fixa por campanha",
    billingModel: "campaign",
    summary: "Proposta de parceria MeuCorre × {EMPRESA} — cobrança mensal por campanha.",
    body: `# Proposta de Parceria — MeuCorre × {EMPRESA}

## Resumo

Parceria comercial para exposição da **{EMPRESA}** no app MeuCorre e redes sociais, com cobrança mensal fixa por campanha.

## Modelo

- **Valor mensal:** R$ XXXX,XX
- **Inclui:**
  - Anúncio destacado no app (banner + card)
  - 1 postagem por semana em redes sociais
  - Relatório mensal de cliques e conversões
  - Suporte dedicado

## Vigência

90 dias, renovável automaticamente.

**MeuCorre** — contato@meucorre.com.br`,
  },
  lead_only: {
    name: "Performance — Por Lead",
    description: "Modelo de performance — paga apenas por lead gerado",
    billingModel: "lead",
    summary: "Proposta de parceria MeuCorre × {EMPRESA} — cobrança por lead qualificado.",
    body: `# Proposta de Parceria Performance — MeuCorre × {EMPRESA}

## Resumo

Modelo de performance: a **{EMPRESA}** paga apenas por leads qualificados gerados através do MeuCorre.

## Modelo

- **Valor por lead:** R$ XX,XX
- **Lead qualificado:** entregador que clica no anúncio e completa cadastro
- **Volume estimado:** XXX leads/mês
- **Custo mensal estimado:** R$ XXXX,XX

## Vantagens

- Sem custo fixo — pague só por resultado
- Relatório quinzenal detalhado
- Cancelamento a qualquer momento (sem multa)

**MeuCorre** — contato@meucorre.com.br`,
  },
};
