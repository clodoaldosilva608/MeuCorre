import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";

// GET /api/referral/stats — estatísticas detalhadas das indicações do usuário
export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Busca código
  const referralCode = await prisma.referralCode.findUnique({
    where: { userId: session.sub },
  });

  if (!referralCode) {
    return NextResponse.json({
      code: null,
      referrals: [],
      summary: {
        total: 0,
        pending: 0,
        converted: 0,
        paid: 0,
        rejected: 0,
        totalEarned: 0,
      },
    });
  }

  // Busca todas as indicações
  const referrals = await prisma.referral.findMany({
    where: { referrerId: session.sub },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      referredName: true,
      referredEmail: true,
      status: true,
      payoutAmount: true,
      convertedAt: true,
      paidAt: true,
      createdAt: true,
    },
  });

  // Calcula resumo
  const summary = {
    total: referrals.length,
    pending: referrals.filter((r) => r.status === "pending").length,
    converted: referrals.filter((r) => r.status === "converted").length,
    paid: referrals.filter((r) => r.status === "paid").length,
    rejected: referrals.filter((r) => r.status === "rejected").length,
    totalEarned: referrals
      .filter((r) => r.status === "paid" || r.status === "converted")
      .reduce((sum, r) => sum + Number(r.payoutAmount), 0),
  };

  // Mascarar email para privacidade: c***@meucorre.com
  const maskedReferrals = referrals.map((r) => ({
    ...r,
    referredEmail: maskEmail(r.referredEmail),
    payoutAmount: Number(r.payoutAmount),
  }));

  return NextResponse.json({
    code: referralCode.code,
    link: `${process.env.NEXT_PUBLIC_APP_URL || "https://meucorre.vercel.app"}?ref=${referralCode.code}`,
    clicks: referralCode.clicks,
    referrals: maskedReferrals,
    summary,
  });
}

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const maskedName = name.length > 2
    ? name[0] + "***" + name[name.length - 1]
    : name[0] + "***";
  return `${maskedName}@${domain}`;
}
