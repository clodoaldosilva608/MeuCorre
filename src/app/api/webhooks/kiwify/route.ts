import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { timingSafeEqual } from "crypto";

// POST /api/webhooks/kiwify
// Recebe notificações de venda da Kiwify e registra no banco.
//
// A Kiwify envia POST com JSON no formato:
// {
//   "event": "order_approved" | "order_refunded" | "order_canceled" |
//            "subscription_created" | "subscription_canceled",
//   "order": {
//     "order_id": "uuid",
//     "product_id": "uuid",
//     "product_name": "Curso Premium...",
//     "price": 247.00,
//     "payment_method": "credit_card" | "pix" | "boleto",
//     "customer": {
//       "name": "João Silva",
//       "email": "joao@email.com",
//       "phone": "11999999999"
//     },
//     "affiliate": {
//       "id": "uuid",
//       "commission": 74.10
//     } | null
//   }
// }
//
// Segurança: a Kiwify envia header "x-kiwify-signature" com HMAC-SHA256
// do body usando o WEBHOOK_SECRET. Verificamos antes de processar.
//
// IDEMPOTÊNCIA (P0-9 corrigido):
// A Kiwify faz retries automáticos se receber != 2xx. Antes, cada retry
// criava uma nova RevenueEntry — receita duplicada em relatórios financeiros.
// Agora checamos se já existe RevenueEntry com mesmo orderId+event antes
// de criar nova. Se existe, retornamos 200 sem criar nova.

// Helper: comparação constant-time para HMAC (previne timing attack)
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Ler body raw (não parsed) para validar assinatura
    const bodyText = await req.text();

    // 2. Validar assinatura HMAC — fail closed se secret ausente
    const webhookSecret = process.env.KIWIFY_WEBHOOK_SECRET;
    const signature = req.headers.get("x-kiwify-signature") || "";

    if (!webhookSecret) {
      // Sem secret configurado — não conseguimos validar autenticidade
      // Fail closed: recusa o webhook (Kiwify vai tentar de novo quando
      // configurarmos o secret corretamente)
      console.error("[kiwify-webhook] KIWIFY_WEBHOOK_SECRET não configurado");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 503 },
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(bodyText)
      .digest("hex");

    if (!safeCompare(signature, expectedSignature)) {
      console.warn("[kiwify-webhook] Assinatura inválida");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 3. Parse JSON
    let payload: KiwifyWebhookPayload;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      console.error("[kiwify-webhook] JSON inválido");
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // 4. Processar evento
    const event = payload.event;
    const order = payload.order;

    if (!event || !order || !order.order_id) {
      return NextResponse.json({ error: "Missing event or order" }, { status: 400 });
    }

    console.log(`[kiwify-webhook] Evento: ${event}, Order: ${order.order_id}`);

    // 5. IDEMPOTÊNCIA — checa se já processamos este orderId+event
    // Kiwify faz retries; sem isso, cada retry criaria receita duplicada.
    // Procura em RevenueEntry.metadata.orderId e event.
    // Usa findFirst com filtro em JSONB (Postgres suporta path ->>).
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
      // Verifica se é o mesmo evento (orderId + event)
      const existingMeta = existingEntry.metadata as {
        event?: string;
        orderId?: string;
      } | null;
      if (existingMeta?.event === event) {
        console.log(
          `[kiwify-webhook] Evento já processado: ${event}/${order.order_id} — ignorando (idempotência)`,
        );
        return NextResponse.json({
          ok: true,
          event,
          orderId: order.order_id,
          idempotent: true,
          message: "Event already processed",
        });
      }
    }

    // 6. Mapear evento para source de receita
    let source = "products";
    let amount = order.price || 0;
    let description = order.product_name || "Venda Kiwify";

    switch (event) {
      case "order_approved":
      case "subscription_created":
        // Venda confirmada — registrar receita
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

        // Deduz comissão de afiliado (se houver) do lucro
        const commission = order.affiliate?.commission || 0;
        const netAmount = amount - commission;

        // 7. Criar entrada de receita
        await prisma.revenueEntry.create({
          data: {
            date: new Date(),
            source,
            description: `${description} — ${order.customer?.name || "Cliente"} (${order.customer?.email || "sem email"})`,
            amount,
            cost: commission, // comissão de afiliado é "custo"
            productId: order.product_id,
            metadata: {
              orderId: order.order_id,
              paymentMethod: order.payment_method,
              customer: order.customer,
              affiliate: order.affiliate,
              event,
              processedAt: new Date().toISOString(),
              raw: JSON.parse(JSON.stringify(payload)),
            },
          },
        });

        console.log(`[kiwify-webhook] Receita registrada: R$ ${amount} (líquido R$ ${netAmount})`);
        break;

      case "order_refunded":
      case "order_canceled":
        // Reembolso — registrar como custo (despesa)
        await prisma.revenueEntry.create({
          data: {
            date: new Date(),
            source,
            description: `REEMBOLSO: ${description} — ${order.customer?.name || "Cliente"}`,
            amount: 0,
            cost: order.price || 0, // valor reembolsado
            productId: order.product_id,
            metadata: {
              orderId: order.order_id,
              event,
              reason: event,
              processedAt: new Date().toISOString(),
              raw: JSON.parse(JSON.stringify(payload)),
            },
          },
        });

        console.log(`[kiwify-webhook] Reembolso registrado: R$ ${order.price}`);
        break;

      case "subscription_canceled":
        // Assinatura cancelada — apenas log (sem impacto financeiro imediato)
        console.log(`[kiwify-webhook] Assinatura cancelada: ${order.order_id}`);
        break;

      default:
        console.log(`[kiwify-webhook] Evento não processado: ${event}`);
    }

    // 8. Responder 200 (Kiwify espera 200 para confirmar recebimento)
    return NextResponse.json({ ok: true, event, orderId: order.order_id });
  } catch (error) {
    console.error("[kiwify-webhook] Erro:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}

// GET — para verificar se endpoint está online
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Kiwify webhook endpoint ativo",
    timestamp: new Date().toISOString(),
  });
}

// Interface do payload (baseado na documentação Kiwify)
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
