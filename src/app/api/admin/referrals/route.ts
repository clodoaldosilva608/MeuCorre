import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";

// GET /api/admin/referrals — lista todas as indicações
// Query: ?status=pending|converted|paid|rejected
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where = status && status !== "all" ? { status } : {};

  const referrals = await prisma.referral.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      referrerId: true,
      referrerCode: true,
      referredId: true,
      referredEmail: true,
      referredName: true,
      status: true,
      convertedAt: true,
      paidAt: true,
      payoutAmount: true,
      payoutPixKey: true,
      adminNotes: true,
      createdAt: true,
    },
  });

  // Busca nomes dos referrers
  const referrerIds = [...new Set(referrals.map((r) => r.referrerId))];
  const referrers = await prisma.user.findMany({
    where: { id: { in: referrerIds } },
    select: { id: true, name: true, email: true },
  });
  const referrerMap = new Map(referrers.map((r) => [r.id, r]));

  // Stats
  const allReferrals = await prisma.referral.groupBy({
    by: ["status"],
    _count: true,
    _sum: { payoutAmount: true },
  });

  const stats: Record<string, { count: number; total: number }> = {};
  for (const g of allReferrals) {
    stats[g.status] = {
      count: g._count,
      total: Number(g._sum.payoutAmount || 0),
    };
  }

  return NextResponse.json({
    referrals: referrals.map((r) => ({
      ...r,
      payoutAmount: Number(r.payoutAmount),
      referrerName: referrerMap.get(r.referrerId)?.name || "Unknown",
      referrerEmail: referrerMap.get(r.referrerId)?.email || "",
    })),
    stats,
  });
}

// PATCH /api/admin/referrals — atualiza status de uma indicação
// Body: { id, action: "pay" | "reject", pixKey?, notes? }
export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: { id?: string; action?: string; pixKey?: string; notes?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { id, action, pixKey, notes } = body;

  if (!id || !action) {
    return NextResponse.json({ error: "ID e action são obrigatórios" }, { status: 400 });
  }

  const referral = await prisma.referral.findUnique({ where: { id } });
  if (!referral) {
    return NextResponse.json({ error: "Indicação não encontrada" }, { status: 404 });
  }

  if (action === "pay") {
    if (referral.status !== "converted") {
      return NextResponse.json(
        { error: "Só pode pagar indicações convertidas" },
        { status: 400 },
      );
    }
    await prisma.referral.update({
      where: { id },
      data: {
        status: "paid",
        paidAt: new Date(),
        payoutPixKey: pixKey || referral.payoutPixKey,
        adminNotes: notes,
      },
    });
    logger.info("Referral paga", { id, amount: referral.payoutAmount });
  } else if (action === "reject") {
    await prisma.referral.update({
      where: { id },
      data: {
        status: "rejected",
        adminNotes: notes || "Rejeitada pelo admin",
      },
    });
    logger.info("Referral rejeitada", { id });
  } else {
    return NextResponse.json({ error: "Action inválido" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
