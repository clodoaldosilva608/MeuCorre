import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { canExecute, recordSuccess, recordFailure } from "@/lib/circuit-breaker";
import { logger } from "@/lib/logger";

// ===== Webhook Kiwify — evento "compra_aprovada" =====
//
// Fluxo:
// 1. Usuário clica em "Comprar PRO" na landing page
// 2. Redireciona pra https://pay.kiwify.com.br/{PRODUCT_SLUG}?email=...&name=...
// 3. Paga via Pix ou cartão na Kiwify
// 4. Kiwify dispara POST pra esta rota com o payload da compra aprovada
// 5. Validamos o token, criamos a assinatura no DB (status: approved),
//    geramos uma licença crypto 32-hex
// 6. Kiwify redireciona o usuário pra /obrigado?order=XXX onde mostramos a licença
//
// Validação: a Kiwify envia o token configurado no dashboard no header
// `X-Kiwify-Signature` (ou query ?token=...). Validamos ambos.

interface KiwifyWebhookPayload {
  order_id: string;
  order_ref?: string;
  order_status: string; // "paid" | "waiting_payment" | "refunded" | "rejected" | "chargedback"
  payment_method?: string;
  created_at?: string;
  approved_date?: string;
  Product?: {
    product_id: string;
    product_name: string;
  };
  Customer?: {
    full_name: string;
    email: string;
    mobile?: string;
    CPF?: string;
  };
  Commissions?: {
    charge_amount?: string; // em centavos, em string
    product_base_price?: string;
  };
  TrackingParameters?: {
    src?: string | null;
    sck?: string | null;
    [k: string]: unknown;
  };
  Subscription?: unknown;
}

function isValidStatus(s?: string): s is "paid" | "waiting_payment" | "refunded" | "rejected" | "chargedback" {
  return !!s && ["paid", "waiting_payment", "refunded", "rejected", "chargedback"].includes(s);
}

// Extrai o token APENAS do header X-Kiwify-Signature (nunca da query string).
// Tokens na query string vazam em logs de proxy/CDN e são vulneráveis a CSRF.
function extractToken(req: NextRequest): string | null {
  return req.headers.get("x-kiwify-signature");
}

// Comparação constante-tempo pra evitar timing attacks.
function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function POST(req: NextRequest) {
  // ===== 0. Circuit breaker — falha rápido se DB estiver down =====
  // Previne thundering herd: se DB caiu, Kiwify retenta múltiplas vezes.
  // Sem circuit breaker, cada retentativa ocupa uma conexão e agrava a queda.
  const CIRCUIT_NAME = "kiwify-webhook-db";
  if (!canExecute(CIRCUIT_NAME)) {
    logger.warn("Webhook rejeitado: circuit breaker aberto (DB down)", {
      orderId: "unknown",
    });
    return NextResponse.json(
      { error: "Serviço temporariamente indisponível", retry: true },
      { status: 503 },
    );
  }

  // ===== 1. Validar token (timing-safe + header only) =====
  const expectedToken = process.env.KIWIFY_WEBHOOK_SECRET;
  if (!expectedToken) {
    logger.error("KIWIFY_WEBHOOK_SECRET não configurado");
    return NextResponse.json(
      { error: "Webhook não configurado" },
      { status: 503 },
    );
  }
  const receivedToken = extractToken(req);
  if (!receivedToken || !safeEqual(receivedToken, expectedToken)) {
    logger.warn("Token inválido ou ausente", { hasToken: !!receivedToken });
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // ===== 2. Parse do payload =====
  let payload: KiwifyWebhookPayload;
  try {
    payload = (await req.json()) as KiwifyWebhookPayload;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!payload.order_id || !isValidStatus(payload.order_status)) {
    logger.warn("Payload inválido", {
      orderId: payload.order_id,
      status: payload.order_status,
    });
    return NextResponse.json(
      { error: "Payload inválido (order_id ou order_status faltando)" },
      { status: 400 },
    );
  }

  logger.info("Webhook recebido", {
    orderId: payload.order_id,
    status: payload.order_status,
    email: payload.Customer?.email,
  });

  // ===== 3. Validar product_id (opcional, se KIWIFY_PRODUCT_ID estiver setado) =====
  const expectedProductId = process.env.KIWIFY_PRODUCT_ID;
  if (
    expectedProductId &&
    payload.Product?.product_id &&
    payload.Product.product_id !== expectedProductId
  ) {
    console.warn(
      `[kiwify-webhook] product_id não bate: esperado=${expectedProductId} recebido=${payload.Product.product_id}`,
    );
    // Não falhamos o webhook (Kiwify esperaria retry), só ignoramos.
    return NextResponse.json({ ok: true, ignored: "wrong_product" });
  }

  // ===== 4-5. Processar evento (com circuit breaker + error handling) =====
  try {
    // ===== 4. Idempotência: se já existe assinatura com este order_id, só retorna OK =====
    const existing = await prisma.subscription.findUnique({
      where: { kiwifyOrderId: payload.order_id },
    });
    if (existing) {
      // Se já existe e status mudou (ex: refund), atualiza
      if (payload.order_status === "refunded" && existing.status === "approved") {
        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            status: "rejected",
            reviewNotes: "Reembolsado via Kiwify",
            reviewedAt: new Date(),
          },
        });
        logger.info("Assinatura reembolsada", { subId: existing.id, orderId: payload.order_id });
      }
      recordSuccess(CIRCUIT_NAME);
      return NextResponse.json({ ok: true, idempotent: true });
    }

    // ===== 5. Processar evento =====
    const customer = payload.Customer;
    if (!customer?.email || !customer?.full_name) {
      return NextResponse.json(
        { error: "Customer sem email/nome" },
        { status: 400 },
      );
    }

    const email = customer.email.trim().toLowerCase();
    const name = customer.full_name.trim();

    if (payload.order_status === "paid") {
      // ===== APROVAR =====
      // Verifica se já existe assinatura aprovada pra este email
      const alreadyPro = await prisma.subscription.findFirst({
        where: { buyerEmail: email, status: "approved" },
      });
      if (alreadyPro) {
        // Vincula o order_id pra auditoria, mas não gera nova licença
        await prisma.subscription.update({
          where: { id: alreadyPro.id },
          data: {
            kiwifyOrderId: payload.order_id,
            paymentMethod: "kiwify",
          },
        });
        recordSuccess(CIRCUIT_NAME);
        return NextResponse.json({
          ok: true,
          message: "Cliente já PRO — order_id vinculado",
          licenseKey: alreadyPro.licenseKey,
        });
      }

      // Amount em reais (payload vem em centavos como string)
      const amountBRL =
        payload.Commissions?.charge_amount
          ? Number(payload.Commissions.charge_amount) / 100
          : Number(process.env.PLAN_PRICE ?? 18.9);

      const licenseKey = crypto.randomBytes(16).toString("hex");

      const sub = await prisma.subscription.create({
        data: {
          buyerName: name,
          buyerEmail: email,
          buyerPhone: customer.mobile,
          amount: amountBRL,
          paymentMethod: "kiwify",
          kiwifyOrderId: payload.order_id,
          status: "approved",
          reviewedAt: new Date(),
          reviewedBy: "kiwify-webhook",
          reviewNotes: `Auto-aprovado via webhook Kiwify — order ${payload.order_id}`,
          licenseKey,
        },
      });

      logger.info("Assinatura aprovada", {
        subId: sub.id,
        licenseKey: licenseKey.slice(0, 8) + "...",
        email,
        orderId: payload.order_id,
      });

      recordSuccess(CIRCUIT_NAME);
      return NextResponse.json({
        ok: true,
        subscriptionId: sub.id,
        licenseKey,
        orderId: payload.order_id,
      });
    }

    // Para outros status (waiting_payment, rejected, chargeback), apenas registra
    // uma assinatura pendente pra histórico.
    await prisma.subscription.create({
      data: {
        buyerName: name,
        buyerEmail: email,
        buyerPhone: customer.mobile,
        amount: Number(process.env.PLAN_PRICE ?? 18.9),
        paymentMethod: "kiwify",
        kiwifyOrderId: payload.order_id,
        status: payload.order_status === "waiting_payment" ? "pending" : "rejected",
        reviewNotes: `Evento Kiwify: ${payload.order_status}`,
      },
    });

    recordSuccess(CIRCUIT_NAME);
    return NextResponse.json({ ok: true, status: payload.order_status });
  } catch (error) {
    // Erro de banco — registra falha no circuit breaker
    recordFailure(CIRCUIT_NAME);
    logger.error("Erro ao processar webhook", {
      orderId: payload.order_id,
      error: error instanceof Error ? error.message : "unknown",
    });
    // Retorna 500 — Kiwify vai retentar, mas circuit breaker vai falhar rápido
    // se o erro persistir (após 5 falhas, circuito abre)
    return NextResponse.json(
      { error: "Erro interno", retry: true },
      { status: 500 },
    );
  }
}

// GET só pra health check
export async function GET() {
  return NextResponse.json({
    ok: true,
    webhook: "kiwify",
    timestamp: new Date().toISOString(),
  });
}
