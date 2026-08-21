import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { timingSafeEqual } from "crypto";
import { enqueue } from "@/lib/queue";

// POST /api/webhooks/kiwify
// Recebe notificações de venda da Kiwify.
//
// FLUXO (P2-1 corrigido):
// 1. Valida assinatura HMAC (síncrono — fail closed se inválida)
// 2. Verifica idempotência básica (síncrono — query rápida)
// 3. Enfileira processamento para /api/queue/process-kiwify
// 4. Retorna 200 imediato — Kiwify não dá timeout
//
// Em produção com QStash: o processamento pesado (create RevenueEntry)
// acontece em função separada, com retries automáticos e DLQ.
// Em dev sem QStash: fallback síncrono (mesma função, mas self-invocation).
//
// SEGURANÇA:
// - HMAC validado com timingSafeEqual (P0-9, mantido)
// - Fail closed se KIWIFY_WEBHOOK_SECRET ausente (P0-9, mantido)
// - Idempotência: checa orderId existente antes de enfileirar
//   (evita reprocessar eventos já concluídos)

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
    // 1. Ler body raw para validar assinatura
    const bodyText = await req.text();

    // 2. Validar assinatura HMAC — fail closed
    const webhookSecret = process.env.KIWIFY_WEBHOOK_SECRET;
    const signature = req.headers.get("x-kiwify-signature") || "";

    if (!webhookSecret) {
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

    const event = payload.event;
    const order = payload.order;

    if (!event || !order || !order.order_id) {
      return NextResponse.json(
        { error: "Missing event or order" },
        { status: 400 },
      );
    }

    console.log(`[kiwify-webhook] Evento: ${event}, Order: ${order.order_id}`);

    // 4. Idempotência básica (síncrono, query rápida)
    // Checa se já existe RevenueEntry com este orderId.
    // Se existe, retorna 200 sem enfileirar de novo.
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
        console.log(
          `[kiwify-webhook] Evento já processado: ${event}/${order.order_id} — idempotência`,
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

    // 5. Enfileira processamento assíncrono
    // Em produção: QStash assume (retries + DLQ)
    // Em dev: fallback síncrono (self-invocation)
    const result = await enqueue({
      url: "/api/queue/process-kiwify",
      body: payload,
    });

    if (!result.ok) {
      console.error("[kiwify-webhook] Falha ao enfileirar", {
        error: result.error,
        sync: result.sync,
      });
      // Mesmo com falha no enqueue, retorna 200 — Kiwify faria retry
      // mas o evento já está no log. QStash em produção evita isso.
      // Em dev (sync), se falhou, é erro real — retorna 500.
      if (result.sync) {
        return NextResponse.json(
          { error: "Processing failed" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      ok: true,
      event,
      orderId: order.order_id,
      queued: !result.sync,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("[kiwify-webhook] Erro:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 },
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
