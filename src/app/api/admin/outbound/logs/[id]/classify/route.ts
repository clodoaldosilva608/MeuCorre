import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { z } from "zod";

const VALID_CLASSIFICATIONS = new Set([
  "permission_to_send", "interessado", "pricing_question", "meeting_ready",
  "opt_out", "nurture_future", "ambiguous", "risk",
]);

const CLASSIFICATION_LABELS: Record<string, string> = {
  permission_to_send: "Permissão para enviar",
  interessado: "Interessado",
  pricing_question: "Pergunta de preço",
  meeting_ready: "Pronto para reunião",
  opt_out: "Opt-out (não contactar mais)",
  nurture_future: "Cultivar para futuro",
  ambiguous: "Ambígua",
  risk: "Risco / Reclamação",
};

const CLASSIFICATION_NEXT_ACTIONS: Record<string, string> = {
  permission_to_send: "Enviar resumo curto com a proposta",
  interessado: "Perguntar objetivo, região, capacidade",
  pricing_question: "Explicar formato e oferecer conversa",
  meeting_ready: "Oferecer dois horários para reunião",
  opt_out: "Confirmar respeito ao opt-out. Bloquear follow-up. NUNCA mais contactar.",
  nurture_future: "Perguntar quando retomar o contato",
  ambiguous: "Fazer pergunta curta para esclarecer ou escalar para humano",
  risk: "PARAR contato imediatamente. Registrar, revisar, escalar se necessário.",
};

// POST /api/admin/outbound/logs/:id/classify
// Classifica a resposta recebida. Suporta 2 modos:
//   { "method": "manual", "classification": "interessado" }  — admin classifica
//   { "method": "ai" }                                         — IA classifica via z-ai-web-dev-sdk
//   { "method": "ai", "responseText": "texto da resposta" }    — IA classifica texto informado
//
// Em modo AI, usa o z-ai-web-dev-sdk para classificar a resposta em uma das 8 categorias.
// Sempre registra method (manual | ai) e classificado por (adminEmail).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const adminEmail = await getAdminEmail();
  const body = (await req.json().catch(() => ({}))) as {
    method?: "manual" | "ai";
    classification?: string;
    responseText?: string;
  };

  const method = body.method ?? "manual";
  if (method !== "manual" && method !== "ai") {
    return NextResponse.json(
      { error: "method deve ser 'manual' ou 'ai'" },
      { status: 400 },
    );
  }

  const log = await prisma.outboundLog.findUnique({
    where: { id },
    include: {
      contact: { select: { name: true } },
      partner: { select: { companyName: true, city: true, category: true } },
      template: { select: { name: true, objective: true } },
    },
  });

  if (!log) {
    return NextResponse.json({ error: "Log não encontrado" }, { status: 404 });
  }

  // Se log ainda não tem status "enviado" ou posterior, não pode classificar
  const classifiableStatuses = new Set([
    "enviado", "respondeu", "interessado", "reuniao_marcada",
    "proposta_enviada", "negociacao",
  ]);
  if (!classifiableStatuses.has(log.status)) {
    return NextResponse.json(
      { error: `Log com status "${log.status}" não pode ser classificado. Envie a mensagem primeiro.` },
      { status: 400 },
    );
  }

  let classification: string;
  let responseText = body.responseText ?? log.responseText ?? "";

  if (method === "manual") {
    if (!body.classification || !VALID_CLASSIFICATIONS.has(body.classification)) {
      return NextResponse.json(
        {
          error: "classification inválido",
          valid: Array.from(VALID_CLASSIFICATIONS),
        },
        { status: 400 },
      );
    }
    classification = body.classification;
  } else {
    // Modo IA — usa z-ai-web-dev-sdk
    if (!responseText.trim()) {
      return NextResponse.json(
        { error: "responseText é obrigatório para classificação por IA (forneça no body ou no log)" },
        { status: 400 },
      );
    }

    try {
      classification = await classifyWithAI(responseText, {
        contactName: log.contact.name,
        companyName: log.partner.companyName,
        templateObjective: log.template?.objective ?? "",
      });
    } catch (err) {
      return NextResponse.json(
        {
          error: "Erro na classificação por IA",
          detail: err instanceof Error ? err.message : String(err),
        },
        { status: 500 },
      );
    }
  }

  // Atualiza log com classificação
  const newStatus = classificationToStatus(classification);
  const updated = await prisma.outboundLog.update({
    where: { id },
    data: {
      responseText: responseText ? sanitizeString(responseText, 5000) : log.responseText,
      responseClassification: classification,
      responseClassifiedAt: new Date(),
      responseClassifiedBy: adminEmail ?? "admin",
      responseClassifiedByEmail: adminEmail,
      responseClassifiedByMethod: method,
      status: newStatus,
    },
  });

  // Se classificação for opt_out → marca contato como optOut=true (PERMANENTE)
  if (classification === "opt_out") {
    await prisma.partnerContact.update({
      where: { id: log.contactId },
      data: { optOut: true },
    });

    await prisma.partnerLog.create({
      data: {
        partnerId: log.partnerId,
        action: "contact_opt_out",
        details: JSON.stringify({
          contactId: log.contactId,
          contactName: log.contact.name,
          source: `outbound_classify_${method}`,
          outboundLogId: id,
        }),
        adminEmail,
        ipAddress: req.headers.get("x-forwarded-for") ?? null,
      },
    });
  }

  // Se classificação for risk → registra alerta no PartnerLog
  if (classification === "risk") {
    await prisma.partnerLog.create({
      data: {
        partnerId: log.partnerId,
        action: "outbound_risk_detected",
        details: JSON.stringify({
          contactId: log.contactId,
          contactName: log.contact.name,
          outboundLogId: id,
          responseText: responseText.slice(0, 500),
          method,
        }),
        adminEmail,
        ipAddress: req.headers.get("x-forwarded-for") ?? null,
      },
    });
  }

  return NextResponse.json({
    log: updated,
    classification,
    classificationLabel: CLASSIFICATION_LABELS[classification],
    nextAction: CLASSIFICATION_NEXT_ACTIONS[classification],
    contactMarkedOptOut: classification === "opt_out",
    riskAlerted: classification === "risk",
  });
}

// ===== Mapeamento classificação → status do log =====
function classificationToStatus(classification: string): string {
  const map: Record<string, string> = {
    permission_to_send: "respondeu",
    interessado: "interessado",
    pricing_question: "respondeu",
    meeting_ready: "reuniao_marcada",
    opt_out: "opt_out",
    nurture_future: "respondeu",
    ambiguous: "respondeu",
    risk: "erro",
  };
  return map[classification] ?? "respondeu";
}

// ===== Classificação via z-ai-web-dev-sdk =====
// Usa o modelo de chat para classificar a resposta em uma das 8 categorias.
async function classifyWithAI(
  responseText: string,
  context: { contactName: string; companyName: string; templateObjective: string },
): Promise<string> {
  // Import dinâmico para evitar carregar SDK em endpoints que não usam
  const ZAIModule = await import("z-ai-web-dev-sdk");
  const ZAI = ZAIModule.default;

  const zai = await ZAI.create();

  const systemPrompt = `Você é um assistente especializado em classificar respostas de prospecção B2B para o MeuCorre (app para entregadores).

Sua tarefa: classificar a resposta do contato em EXATAMENTE uma das 8 categorias abaixo.

Categorias:
1. permission_to_send — Contato autoriza enviar mais informações ("pode mandar", "manda", "me mostra")
2. interessado — Contato demonstra interesse ("tenho interesse", "quero saber mais")
3. pricing_question — Contato pergunta sobre preço ("quanto custa?", "qual o valor?")
4. meeting_ready — Contato quer marcar reunião ("vamos marcar", "pode amanhã")
5. opt_out — Contato pede para parar ("não tenho interesse", "não precisa", "pare de enviar")
6. nurture_future — Contato não é agora mas pode ser no futuro ("agora não", "talvez mais tarde")
7. ambiguous — Resposta ambígua, não clara
8. risk — Reclamação ou situação de risco

Contexto da prospecção:
- Contato: ${context.contactName}
- Empresa: ${context.companyName}
- Objetivo do template: ${context.templateObjective}

Responda APENAS com o nome da categoria (uma das 8 acima), sem explicações.`;

  const messages = [
    { role: "assistant" as const, content: systemPrompt },
    { role: "user" as const, content: `Resposta do contato para classificar:\n\n"${responseText}"` },
  ];

  const response = await zai.chat.completions.create({
    messages,
    stream: false,
    thinking: { type: "disabled" as const },
  });

  const reply = response.choices?.[0]?.message?.content?.trim().toLowerCase() ?? "";

  // Normaliza a resposta para uma das 8 categorias
  const normalized = reply.replace(/[^a-z_]/g, "");
  if (VALID_CLASSIFICATIONS.has(normalized)) {
    return normalized;
  }

  // Tenta casar parcialmente
  for (const valid of VALID_CLASSIFICATIONS) {
    if (normalized.includes(valid) || reply.includes(valid.replace(/_/g, " "))) {
      return valid;
    }
  }

  // Fallback: ambiguous
  return "ambiguous";
}

// Export para reuso
export { CLASSIFICATION_LABELS, CLASSIFICATION_NEXT_ACTIONS, VALID_CLASSIFICATIONS };
