import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { z } from "zod";

// ===== PATCH /api/admin/parceiros/[id]/stage =====
//
// Atualiza o stage de um partner no kanban.
// Quando o stage muda para "contato_iniciado", envia pergunta "Como foi?"
// via Telegram para o admin.
//
// Stages do kanban:
// - novo_lead
// - qualificando
// - contato_iniciado  → dispara Telegram "Como foi o contato?"
// - descoberta
// - proposta_enviada
// - negociacao
// - aguardando_aprovacao
// - ativacao
// - ativo (FECHADO! 🎉)
// - renovacao
// - perdido
// - desqualificado

const stageSchema = z.object({
  stage: z.enum([
    "novo_lead", "qualificando", "contato_iniciado", "descoberta",
    "proposta_enviada", "negociacao", "aguardando_aprovacao",
    "ativacao", "ativo", "renovacao", "perdido", "desqualificado",
  ]),
});

const STAGE_LABELS: Record<string, string> = {
  novo_lead: "Novo Lead",
  qualificando: "Qualificando",
  contato_iniciado: "Contato Iniciado",
  descoberta: "Descoberta",
  proposta_enviada: "Proposta Enviada",
  negociacao: "Negociação",
  aguardando_aprovacao: "Aguardando Aprovação",
  ativacao: "Ativação",
  ativo: "Ativo (Fechado!)",
  renovacao: "Renovação",
  perdido: "Perdido",
  desqualificado: "Desqualificado",
};

async function sendTelegramStageUpdate(partnerName: string, oldStage: string, newStage: string, phone: string | null) {
  try {
    const tokenSetting = await prisma.setting.findUnique({ where: { key: "telegram_bot_token" } });
    if (!tokenSetting?.value) return;

    const ADMIN_CHAT_ID = "802516531";
    let message = "";

    if (newStage === "contato_iniciado") {
      message = `📞 *Contato iniciado!*

Você moveu *${partnerName}* para "Contato Iniciado".

*Como foi o contato?* Responda:
✅ Bem — lead interessado (mova para "Descoberta")
❌ Ruim — sem interesse (mova para "Perdido")
⏳ Sem resposta — tentar novamente (mantenha aqui)

${phone ? `📞 Telefone do lead: ${phone}` : "ℹ️ Sem telefone cadastrado"}`;
    } else if (newStage === "ativo") {
      message = `🎉 *PARABÉNS! FECHOU!*

${partnerName} acabou de virar parceiro MeuCorre! 🚀

Stage: ${STAGE_LABELS[newStage]}

Agora é hora de:
1. Enviar boas-vindas oficial
2. Configurar materiais de divulgação
3. Agendar follow-up em 30 dias`;
    } else if (newStage === "perdido") {
      message = `❌ *Lead perdido*

${partnerName} foi movido para "Perdido".

Não desanime! Cada não te aproxima do sim. 🏍️`;
    } else {
      message = `📋 *${partnerName}*

Stage atualizado: ${STAGE_LABELS[oldStage]} → ${STAGE_LABELS[newStage]}`;
    }

    await fetch(`https://api.telegram.org/bot${tokenSetting.value}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error("[stage] Erro Telegram:", err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const parsed = stageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  try {
    // Busca o partner atual
    const partner = await prisma.partner.findUnique({ where: { id } });
    if (!partner) {
      return NextResponse.json({ error: "Parceiro não encontrado" }, { status: 404 });
    }

    const oldStage = partner.stage;

    // Atualiza o stage
    await prisma.partner.update({
      where: { id },
      data: { stage: parsed.data.stage },
    });

    // Registra atividade
    await prisma.partnerActivity.create({
      data: {
        partnerId: id,
        type: "stage_change",
        description: `Stage alterado: ${STAGE_LABELS[oldStage] || oldStage} → ${STAGE_LABELS[parsed.data.stage]}`,
        performedBy: "admin",
      },
    });

    // Envia notificação Telegram
    await sendTelegramStageUpdate(
      partner.companyName,
      oldStage,
      parsed.data.stage,
      partner.phone,
    );

    return NextResponse.json({
      ok: true,
      partnerId: id,
      oldStage,
      newStage: parsed.data.stage,
      telegramSent: true,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro" }, { status: 500 });
  }
}
