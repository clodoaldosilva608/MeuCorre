import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

// POST /api/referral/register
// Chamada durante o registro de usuário: vincula código de referral ao novo usuário.
// Body: { userId, email, name, code }
// Não requer auth (chamado pelo fluxo de registro).
// Rate limited: 10 registros por IP a cada 15 min (anti-abuso)

const registerSchema = z.object({
  userId: z.string().min(1, "userId é obrigatório"),
  email: z.string().email("Email inválido"),
  name: z.string().max(100).optional(),
  code: z.string().min(1, "Código é obrigatório").max(50, "Código muito longo"),
});

// PUBLIC ROUTE — Esta rota é intencionalmente pública (não requer admin auth)
export async function POST(req: NextRequest) {
  // Rate limit: 10 por IP a cada 15 min
  const limited = await applyRateLimit(
    req,
    { windowMs: 15 * 60 * 1000, maxRequests: 10 },
    "referral-register",
  );
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Validação Zod
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  const { userId, email, name, code } = parsed.data;
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
