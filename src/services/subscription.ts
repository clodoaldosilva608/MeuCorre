// ===== Service: Subscription =====
//
// P2-10: Service layer — extrai lógica de negócio das rotas API.
//
// Antes: route handlers (route.ts) misturavam:
// - HTTP parsing (req.json())
// - Validação (Zod)
// - Regras de negócio (validar ownership, gerar licença, etc.)
// - DB queries (prisma.*)
// - Response shaping (NextResponse.json)
//
// Agora: route.ts faz apenas HTTP parsing + chama service.
// Service faz validação + regras + DB.
// Benefícios:
// - Reutilização: service pode ser chamado de outras rotas/admin/cron
// - Testabilidade: service é função pura (sem req/res)
// - Manutenção: mudança de regra em um lugar

import { prisma } from "@/lib/prisma";

export interface Subscription {
  id: string;
  buyerName: string;
  buyerEmail: string;
  amount: number;
  status: string;
  licenseKey: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  createdAt: Date;
}

// Busca subscription por ID com verificação de ownership.
// Lança erros específicos para a rota tratar.
//
// Uso:
//   try {
//     const sub = await getSubscriptionForUser(id, userEmail);
//   } catch (err) {
//     if (err instanceof NotFoundError) return 404;
//     if (err instanceof ForbiddenError) return 403;
//   }
export async function getSubscriptionForUser(
  id: string,
  userEmail: string,
): Promise<Subscription | null> {
  const sub = await prisma.subscription.findUnique({
    where: { id },
    select: {
      id: true,
      buyerName: true,
      buyerEmail: true,
      amount: true,
      status: true,
      licenseKey: true,
      reviewedAt: true,
      reviewNotes: true,
      createdAt: true,
    },
  });

  if (!sub) {
    return null;
  }

  // Verifica ownership — proteção IDOR (P0-4)
  if (sub.buyerEmail.toLowerCase().trim() !== userEmail.toLowerCase().trim()) {
    throw new ForbiddenError("Compra não pertence a este usuário");
  }

  return sub;
}

// Cria nova subscription pending.
// Usado pelo /api/subscription POST (landing page checkout).
export async function createPendingSubscription(params: {
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  buyerCity?: string;
  receiptNotes?: string;
}): Promise<{ id: string; pixKey: string; amount: number }> {
  const price = Number(process.env.PLAN_PRICE ?? 18.9);
  const pixKey = process.env.PIX_KEY ?? "meucorre@pix.com.br";

  const sub = await prisma.subscription.create({
    data: {
      buyerName: params.buyerName,
      buyerEmail: params.buyerEmail,
      buyerPhone: params.buyerPhone,
      buyerCity: params.buyerCity,
      amount: price,
      pixKey,
      receiptNotes: params.receiptNotes,
      status: "pending",
    },
  });

  return { id: sub.id, pixKey, amount: price };
}

// Verifica se já existe subscription aprovada para o email.
// Usado para impedir pagamento duplo.
export async function hasApprovedSubscription(email: string): Promise<boolean> {
  const existing = await prisma.subscription.findFirst({
    where: { buyerEmail: email.toLowerCase(), status: "approved" },
    select: { id: true },
  });
  return !!existing;
}

// Erros customizados para a service layer
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}
