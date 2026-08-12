import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";

// POST /api/admin/outbound/logs/:id/send
// Registra que o admin enviou a mensagem MANUALMENTE pelo canal escolhido.
//
// CRÍTICO: Este endpoint NÃO envia nada automaticamente.
// O admin deve:
//   1. Copiar o conteúdo de renderedBody
//   2. Colar no WhatsApp/email/etc
//   3. Enviar manualmente
//   4. Chamar este endpoint para registrar que enviou
//
// Requer feature flag: partner_outbound_send_enabled = true
// Se a flag estiver OFF, retorna 403 (só permite preparar e aprovar, não registrar envio).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Verifica feature flag
  const sendFlag = await prisma.setting.findUnique({
    where: { key: "partner_outbound_send_enabled" },
  });
  if (!sendFlag || sendFlag.value !== "true") {
    return NextResponse.json(
      {
        error: "FEATURE_FLAG_OFF",
        message:
          "Feature flag partner_outbound_send_enabled está OFF. Ative em /admin/flags para registrar envios manuais.",
      },
      { status: 403 },
    );
  }

  const { id } = await params;
  const adminEmail = await getAdminEmail();

  const log = await prisma.outboundLog.findUnique({
    where: { id },
    include: { contact: { select: { optOut: true, name: true } } },
  });

  if (!log) {
    return NextResponse.json({ error: "Log não encontrado" }, { status: 404 });
  }

  // Revalida optOut
  if (log.contact.optOut) {
    return NextResponse.json(
      {
        error: "OPT_OUT_BLOCKED",
        message: `Contato ${log.contact.name} marcou opt-out — envio bloqueado`,
      },
      { status: 403 },
    );
  }

  // Só permite enviar se status = aguardando_aprovacao (aprovado pelo dry-run)
  if (log.status !== "aguardando_aprovacao") {
    return NextResponse.json(
      {
        error: `Log com status "${log.status}" não pode ser enviado. Aprove o dry-run primeiro.`,
      },
      { status: 400 },
    );
  }

  const updated = await prisma.outboundLog.update({
    where: { id },
    data: {
      status: "enviado",
      sentAt: new Date(),
      sentBy: adminEmail ?? "admin",
      sentByEmail: adminEmail,
      sentManuallyAt: new Date(),
    },
  });

  // Log no Partner
  await prisma.partnerLog.create({
    data: {
      partnerId: log.partnerId,
      action: "outbound_sent",
      details: JSON.stringify({
        outboundLogId: id,
        channel: log.channel,
        contactId: log.contactId,
        contactName: log.contact.name,
      }),
      adminEmail,
      ipAddress: req.headers.get("x-forwarded-for") ?? null,
    },
  });

  return NextResponse.json({ log: updated });
}
