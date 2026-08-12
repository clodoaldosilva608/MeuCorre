import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";
import { sanitizeString } from "@/lib/validation";

// POST /api/app/radar/alerts/:id/dismiss
// Usuário descarta alerta (desliga). Body: { reason? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { reason?: string };

  // Verifica que o alerta pertence ao usuário
  const alert = await prisma.radarAlert.findUnique({ where: { id } });
  if (!alert) {
    return NextResponse.json({ error: "Alerta não encontrado" }, { status: 404 });
  }
  if (alert.userId !== session.sub) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const updated = await prisma.radarAlert.update({
    where: { id },
    data: {
      status: "dismissed",
      dismissedAt: new Date(),
      dismissedReason: sanitizeString(body.reason ?? "", 500) || null,
    },
  });

  return NextResponse.json({ alert: updated });
}
