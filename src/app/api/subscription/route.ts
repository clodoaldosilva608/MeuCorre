import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ===== Tipos =====

interface CreateSubscriptionBody {
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  buyerCity?: string;
  receiptNotes?: string;
}

// POST /api/subscription
// Cria uma nova compra do plano vitalício (status: pending).
// O cliente recebe a chave Pix para pagar e o ID para acompanhar.
export async function POST(req: NextRequest) {
  const body = (await req.json()) as CreateSubscriptionBody;

  if (!body.buyerName?.trim() || !body.buyerEmail?.trim()) {
    return NextResponse.json(
      { error: "Nome e email são obrigatórios" },
      { status: 400 },
    );
  }

  const email = body.buyerEmail.trim().toLowerCase();
  const name = body.buyerName.trim();

  // Verifica se já existe uma compra aprovada para este email (não deixa pagar 2x)
  const existing = await prisma.subscription.findFirst({
    where: { buyerEmail: email, status: "approved" },
  });
  if (existing) {
    return NextResponse.json(
      {
        error: "Você já tem o plano vitalício ativado",
        licenseKey: existing.licenseKey,
      },
      { status: 409 },
    );
  }

  const price = Number(process.env.PLAN_PRICE ?? 97);
  const pixKey = process.env.PIX_KEY ?? "meucorre@pix.com.br";

  const sub = await prisma.subscription.create({
    data: {
      buyerName: name,
      buyerEmail: email,
      buyerPhone: body.buyerPhone?.trim(),
      buyerCity: body.buyerCity?.trim(),
      amount: price,
      pixKey,
      receiptNotes: body.receiptNotes?.trim(),
      status: "pending",
    },
  });

  return NextResponse.json({
    id: sub.id,
    pixKey,
    pixMerchantName: process.env.PIX_MERCHANT_NAME ?? "MeuCorre",
    amount: price,
    status: "pending",
    instructions:
      "Pague via Pix usando a chave acima e envie o comprovante para validação. Você receberá a licença PRO por email assim que o admin aprovar.",
  });
}

// GET /api/subscription?id=xxx
// Consulta status de uma compra pelo ID (para o cliente acompanhar).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  }

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
    return NextResponse.json({ error: "Compra não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ subscription: sub });
}
