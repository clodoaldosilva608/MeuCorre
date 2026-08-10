import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";

// PATCH /api/referral/pix — cadastra/atualiza chave PIX do usuário
// Salva no ReferralCode (sempre existe) e propaga para Referrals converted
// Body: { pixKey: "email@exemplo.com" | "(11) 99999-9999" | "chave-aleatoria" }
export async function PATCH(req: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: { pixKey?: string };
  try {
    body = (await req.json()) as { pixKey?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const pixKey = body.pixKey?.trim();
  if (!pixKey || pixKey.length < 3) {
    return NextResponse.json({ error: "Chave PIX inválida (mínimo 3 caracteres)" }, { status: 400 });
  }
  if (pixKey.length > 140) {
    return NextResponse.json({ error: "Chave PIX muito longa (máximo 140 caracteres)" }, { status: 400 });
  }

  // 1. Salva no ReferralCode (persiste mesmo sem referrals convertidas)
  await prisma.referralCode.upsert({
    where: { userId: session.sub },
    create: {
      userId: session.sub,
      code: `MEUCORRE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      pixKey,
    },
    update: { pixKey },
  });

  // 2. Propaga para Referrals converted (para admin ver a PIX ao pagar)
  const result = await prisma.referral.updateMany({
    where: {
      referrerId: session.sub,
      status: "converted",
    },
    data: { payoutPixKey: pixKey },
  });

  return NextResponse.json({
    ok: true,
    updated: result.count,
    pixKey,
  });
}

// GET /api/referral/pix — retorna a chave PIX cadastrada
export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Busca do ReferralCode (onde persiste)
  const referralCode = await prisma.referralCode.findUnique({
    where: { userId: session.sub },
    select: { pixKey: true },
  });

  return NextResponse.json({
    pixKey: referralCode?.pixKey || null,
  });
}
