import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/subscription/[id]/receipt
// Faz upload do comprovante Pix (base64 data URL).
// Limite de 2MB para manter o DB enxuto.
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub) {
    return NextResponse.json({ error: "Compra não encontrada" }, { status: 404 });
  }
  if (sub.status === "approved") {
    return NextResponse.json({ error: "Compra já aprovada" }, { status: 400 });
  }

  const body = (await req.json()) as { receipt: string };
  if (!body.receipt?.startsWith("data:image/")) {
    return NextResponse.json(
      { error: "Comprovante inválido (esperado imagem)" },
      { status: 400 },
    );
  }
  if (body.receipt.length > MAX_SIZE) {
    return NextResponse.json(
      { error: "Comprovante muito grande (máx 2MB)" },
      { status: 413 },
    );
  }

  await prisma.subscription.update({
    where: { id },
    data: { receiptUrl: body.receipt },
  });

  return NextResponse.json({ ok: true, status: "pending_review" });
}
