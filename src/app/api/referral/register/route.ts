import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/referral/register
// Chamada durante o registro de usuário: vincula código de referral ao novo usuário.
// Body: { userId, email, name, code }
// Não requer auth (chamado pelo fluxo de registro).
export async function POST(req: NextRequest) {
  let body: { userId?: string; email?: string; name?: string; code?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { userId, email, name, code } = body;

  if (!userId || !email || !code) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const normalizedCode = code.trim().toUpperCase();

  // Busca o código de referral
  const referralCode = await prisma.referralCode.findUnique({
    where: { code: normalizedCode },
  });

  if (!referralCode || !referralCode.active) {
    return NextResponse.json({ ok: false, reason: "invalid_code" });
  }

  // Não pode indicar a si mesmo
  if (referralCode.userId === userId) {
    return NextResponse.json({ ok: false, reason: "self_referral" });
  }

  // Verifica se o usuário já foi indicado por alguém (referredId @unique)
  const existingReferral = await prisma.referral.findUnique({
    where: { referredId: userId },
  });

  if (existingReferral) {
    // Já foi indicado — não faz nada
    return NextResponse.json({ ok: false, reason: "already_referred" });
  }

  // Verifica se a campanha está ativa
  const campaign = await prisma.referralCampaign.findFirst({
    orderBy: { createdAt: "desc" },
  });

  const rewardAmount = campaign?.active
    ? Number(campaign.rewardAmount)
    : 0; // Se campanha inativa, registra mas sem recompensa

  // Cria o referral
  await prisma.referral.create({
    data: {
      referrerId: referralCode.userId,
      referrerCode: normalizedCode,
      referredId: userId,
      referredEmail: email.trim().toLowerCase(),
      referredName: name?.trim() || "",
      status: "pending",
      payoutAmount: rewardAmount,
    },
  });

  return NextResponse.json({ ok: true, rewardAmount });
}
