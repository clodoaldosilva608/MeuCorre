import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/license/by-order?order=xxx
// GET /api/license/by-order?email=xxx
// Busca a licença PRO gerada para um pedido Kiwify ou email.
// Usado pela página /obrigado pra mostrar a licença ao cliente.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("order") || searchParams.get("order_id") || searchParams.get("order_ref") || searchParams.get("id");
  const email = searchParams.get("email");

  // Busca por order_id (preferencial)
  if (orderId) {
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
    if (sub) {
      return NextResponse.json({ found: true, subscription: sub });
    }
  }

  // Fallback: busca por email (licença aprovada mais recente)
  if (email) {
    const sub = await prisma.subscription.findFirst({
      where: {
        buyerEmail: email.trim().toLowerCase(),
        status: "approved",
      },
      orderBy: { createdAt: "desc" },
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
    if (sub) {
      return NextResponse.json({ found: true, subscription: sub });
    }
  }

  // Não encontrado — pode ser race condition (webhook ainda não chegou)
  return NextResponse.json(
    { found: false, status: "pending", message: "Pagamento ainda não confirmado ou webhook em processamento" },
    { status: 202 },
  );
}
