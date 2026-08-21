import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// POST /api/queue/process-kiwify
// Rota invocada pela fila (QStash em prod, síncrono em dev) para processar
// webhook do Kiwify de forma assíncrona.
//
// Em produção:
// 1. Webhook Kiwify → /api/webhooks/kiwify (valida HMAC + enfileira)
// 2. QStash chama /api/queue/process-kiwify com o payload
// 3. Esta rota faz upsert no DB (não bloqueia resposta do webhook)
//
// Benefícios:
// - Kiwify recebe 200 rápido (não dá timeout em DB lento)
// - QStash faz retries automáticos se esta rota falhar
// - DLQ integrado (após N retries, vai pra dead letter)
// - Não conta no timeout de 60s da function original

interface KiwifyWebhookPayload {
  event: string;
  order: {
    order_id: string;
    product_id?: string;
    product_name?: string;
    price?: number;
    payment_method?: string;
    customer?: {
      name?: string;
      email?: string;
      phone?: string;
      document?: string;
    };
    affiliate?: {
      id?: string;
      name?: string;
      commission?: number;
    } | null;
  };
}

export async function POST(req: NextRequest) {
  let payload: KiwifyWebhookPayload;
  try {
    payload = (await req.json()) as KiwifyWebhookPayload;
  } catch {
    logger.error("[queue/process-kiwify] JSON inválido");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event;
  const order = payload.order;

  if (!event || !order || !order.order_id) {
    return NextResponse.json({ error: "Missing event or order" }, { status: 400 });
  }

  logger.info("[queue/process-kiwify] Processando", {
    event,
    orderId: order.order_id,
  });

  // IDEMPOTÊNCIA — checa se já processamos este orderId+event
  // (mantém mesma lógica do webhook original)
  const existingEntry = await prisma.revenueEntry.findFirst({
    where: {
      productId: order.product_id ?? undefined,
      metadata: {
        path: ["orderId"],
        equals: order.order_id,
      },
    },
    select: { id: true, metadata: true },
  });

  if (existingEntry) {
    const existingMeta = existingEntry.metadata as {
      event?: string;
      orderId?: string;
    } | null;
    if (existingMeta?.event === event) {
      logger.info("[queue/process-kiwify] Evento já processado", {
        event,
        orderId: order.order_id,
      });
      return NextResponse.json({
        ok: true,
        idempotent: true,
        message: "Event already processed",
      });
    }
  }

  let source = "products";
  let amount = order.price || 0;
  let description = order.product_name || "Venda Kiwify";

  switch (event) {
    case "order_approved":
    case "subscription_created": {
      if (order.product_name?.toLowerCase().includes("curso premium")) {
        source = "course";
      } else if (order.product_name?.toLowerCase().includes("e-book") ||
                 order.product_name?.toLowerCase().includes("ebook")) {
        source = "ebook";
      } else if (order.product_name?.toLowerCase().includes("toolkit")) {
        source = "toolkit";
      } else if (order.product_name?.toLowerCase().includes("live") ||
                 order.product_name?.toLowerCase().includes("mentoria")) {
        source = "live";
      } else if (order.product_name?.toLowerCase().includes("vip") ||
                 order.product_name?.toLowerCase().includes("whatsapp")) {
        source = "subscription";
      }

      const commission = order.affiliate?.commission || 0;
      const netAmount = amount - commission;

      await prisma.revenueEntry.create({
        data: {
          date: new Date(),
          source,
          description: `${description} — ${order.customer?.name || "Cliente"} (${order.customer?.email || "sem email"})`,
          amount,
          cost: commission,
          productId: order.product_id,
          metadata: {
            orderId: order.order_id,
            paymentMethod: order.payment_method,
            customer: order.customer,
            affiliate: order.affiliate,
            event,
            processedAt: new Date().toISOString(),
            processedBy: "queue",
          },
        },
      });

      logger.info("[queue/process-kiwify] Receita registrada", {
        amount,
        netAmount,
        orderId: order.order_id,
      });
      break;
    }

    case "order_refunded":
    case "order_canceled": {
      await prisma.revenueEntry.create({
        data: {
          date: new Date(),
          source,
          description: `REEMBOLSO: ${description} — ${order.customer?.name || "Cliente"}`,
          amount: 0,
          cost: order.price || 0,
          productId: order.product_id,
          metadata: {
            orderId: order.order_id,
            event,
            reason: event,
            processedAt: new Date().toISOString(),
            processedBy: "queue",
          },
        },
      });
      logger.info("[queue/process-kiwify] Reembolso registrado", {
        amount: order.price,
        orderId: order.order_id,
      });
      break;
    }

    case "subscription_canceled":
      logger.info("[queue/process-kiwify] Assinatura cancelada", {
        orderId: order.order_id,
      });
      break;

    default:
      logger.info("[queue/process-kiwify] Evento não processado", { event });
  }

  return NextResponse.json({ ok: true, event, orderId: order.order_id });
}
