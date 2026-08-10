import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";
import crypto from "crypto";

// GET /api/referral/code — retorna o código de referral do usuário logado
// (cria automaticamente se não existir, apenas para usuários PRO)
export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Verifica se a campanha está ativa
  const campaign = await prisma.referralCampaign.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!campaign || !campaign.active) {
    return NextResponse.json({
      active: false,
      message: "Campanha de indicação não está ativa",
    });
  }

  // Busca ou cria código de referral (apenas PRO)
  let referralCode = await prisma.referralCode.findUnique({
    where: { userId: session.sub },
  });

  if (!referralCode) {
    // Gera código único: MEUCORRE-XXXXXX (6 chars alfanuméricos)
    const shortCode = crypto.randomBytes(3).toString("hex").toUpperCase();
    const code = `MEUCORRE-${shortCode}`;

    referralCode = await prisma.referralCode.create({
      data: {
        userId: session.sub,
        code,
      },
    });
  }

  // Busca estatísticas
  const stats = await prisma.referral.aggregate({
    where: { referrerId: session.sub },
    _count: true,
    _sum: { payoutAmount: true },
  });

  const byStatus = await prisma.referral.groupBy({
    by: ["status"],
    where: { referrerId: session.sub },
    _count: true,
  });

  const statusCounts: Record<string, number> = {};
  for (const g of byStatus) {
    statusCounts[g.status] = g._count;
  }

  return NextResponse.json({
    active: true,
    code: referralCode.code,
    link: `${process.env.NEXT_PUBLIC_APP_URL || "https://meucorre.vercel.app"}?ref=${referralCode.code}`,
    clicks: referralCode.clicks,
    rewardAmount: Number(campaign.rewardAmount),
    maxReferrals: campaign.maxReferrals,
    stats: {
      total: stats._count,
      pending: statusCounts.pending || 0,
      converted: statusCounts.converted || 0,
      paid: statusCounts.paid || 0,
      rejected: statusCounts.rejected || 0,
      totalEarned: Number(stats._sum.payoutAmount || 0),
    },
  });
}

// POST /api/referral/code — registra clique no link de referral
// Body: { code: "MEUCORRE-XXXXXX" }
export async function POST(req: NextRequest) {
  let body: { code?: string };
  try {
    body = (await req.json()) as { code?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const code = body.code?.trim().toUpperCase();
  if (!code || !code.startsWith("MEUCORRE-")) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  // Incrementa contador de cliques
  try {
    await prisma.referralCode.update({
      where: { code },
      data: { clicks: { increment: 1 } },
    });
  } catch {
    // Código não existe — ignora silenciosamente
  }

  return NextResponse.json({ ok: true });
}
