import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";

// ===== GET /api/offers — lista ofertas ativas para o usuário =====
//
// Retorna ofertas com:
//   - active = true
//   - dentro do período de vigência (startsAt <= now <= endsAt OU endsAt null)
//   - se usuário NÃO for PRO: exclui ofertas proOnly=true
//
// Não requer autenticação (usuário em trial/guest também vê ofertas não-PRO).
// Usuário PRO vê todas as ofertas (inclusive proOnly).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category"); // opcional filtro

  // Verifica se usuário está logado e é PRO
  const session = await getUserSession();
  let isPro = false;
  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { isPro: true },
    });
    isPro = user?.isPro ?? false;
  }

  const now = new Date();
  const where = {
    active: true,
    startsAt: { lte: now },
    OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    // Se não for PRO, exclui ofertas exclusivas PRO
    ...( !isPro ? { proOnly: false } : {}),
    ...(category && category !== "all" ? { category } : {}),
  };

  const offers = await prisma.offer.findMany({
    where,
    orderBy: [{ proOnly: "asc" }, { createdAt: "desc" }],
    take: 50,
  });

  return NextResponse.json({
    offers: offers.map((o) => ({
      ...o,
      price: Number(o.price),
      originalPrice: o.originalPrice ? Number(o.originalPrice) : null,
      discountPercent:
        o.originalPrice && Number(o.originalPrice) > Number(o.price)
          ? Math.round(
              ((Number(o.originalPrice) - Number(o.price)) /
                Number(o.originalPrice)) *
                100,
            )
          : null,
    })),
    isPro,
  });
}
