import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";

// POST /api/admin/outbound/logs/:id/approve
// Aprova o dry-run (preparado → aguardando_aprovacao)
// NÃO ENVIA — apenas marca que o admin revisou e autorizou o envio manual.
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
    include: { contact: { select: { optOut: true, name: true } } },
  });

  if (!log) {
    return NextResponse.json({ error: "Log não encontrado" }, { status: 404 });
  }

  // Revalida optOut (caso tenha mudado desde o prepare)
  if (log.contact.optOut) {
    return NextResponse.json(
      {
        error: "OPT_OUT_BLOCKED",
        message: `Contato ${log.contact.name} marcou opt-out — aprovação negada`,
      },
      { status: 403 },
    );
  }

  if (log.status !== "preparado") {
    return NextResponse.json(
      { error: `Log com status "${log.status}" não pode ser aprovado` },
      { status: 400 },
    );
  }

  const updated = await prisma.outboundLog.update({
    where: { id },
    data: {
      status: "aguardando_aprovacao",
      approvedAt: new Date(),
      approvedBy: adminEmail ?? "admin",
      approvedByEmail: adminEmail,
    },
  });

  return NextResponse.json({ log: updated });
}
