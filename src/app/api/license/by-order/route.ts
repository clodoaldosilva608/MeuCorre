import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/license/by-order?order=xxx
// Busca a licença PRO gerada para um pedido Kiwify.
// Usado pela página /obrigado pra mostrar a licença ao cliente.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("order");

  if (!orderId) {
    return NextResponse.json({ error: "order obrigatório" }, { status: 400 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { kiwifyOrderId: orderId },
    select: {
      id: true,
      buyerName: true,
      buyerEmail: true,
      status: true,
      licenseKey: true,
      paymentMethod: true,
      amount: true,
      createdAt: true,
    },
  });

  if (!sub) {
    // Pode acontecer se o webhook ainda não chegou — retornamos pending
    return NextResponse.json(
      { found: false, status: "pending", message: "Pagamento ainda não confirmado" },
      { status: 202 },
    );
  }

  return NextResponse.json({ found: true, subscription: sub });
}
