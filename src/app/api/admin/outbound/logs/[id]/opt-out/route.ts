import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";

// POST /api/admin/outbound/logs/:id/opt-out
// Marca o contato como opt-out PERMANENTE e atualiza o log.
// Use quando o contato pedir para não receber mais mensagens.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const adminEmail = await getAdminEmail();

  const log = await prisma.outboundLog.findUnique({
    where: { id },
    include: { contact: { select: { id: true, name: true, optOut: true } } },
  });

  if (!log) {
    return NextResponse.json({ error: "Log não encontrado" }, { status: 404 });
  }

  // Marca contato como optOut=true (PERMANENTE)
  await prisma.partnerContact.update({
    where: { id: log.contactId },
    data: { optOut: true },
  });

  // Atualiza log
  const updated = await prisma.outboundLog.update({
    where: { id },
    data: {
      status: "opt_out",
      responseClassification: "opt_out",
      responseClassifiedAt: new Date(),
      responseClassifiedBy: adminEmail ?? "admin",
      responseClassifiedByEmail: adminEmail,
      responseClassifiedByMethod: "manual",
    },
  });

  // Log no Partner
  await prisma.partnerLog.create({
    data: {
      partnerId: log.partnerId,
      action: "contact_opt_out",
      details: JSON.stringify({
        contactId: log.contactId,
        contactName: log.contact.name,
        source: "manual_outbound_action",
        outboundLogId: id,
        previousOptOut: log.contact.optOut,
      }),
      adminEmail,
      ipAddress: req.headers.get("x-forwarded-for") ?? null,
    },
  });

  return NextResponse.json({
    log: updated,
    contactOptOut: true,
    permanent: true,
  });
}
