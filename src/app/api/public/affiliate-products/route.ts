import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/affiliate-products
// Lista produtos ativos para exibição pública (landing page, dashboard)
// Não requer auth — apenas produtos marcados como active=true

export async function GET() {
  try {
    const products = await prisma.affiliateProduct.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        type: true,
        name: true,
        description: true,
        url: true,
        imageUrl: true,
        price: true,
        category: true,
        featured: true,
      },
    });
    return NextResponse.json({ products });
  } catch (err) {
    const error = err as { message?: string };
    console.error("[public/affiliate-products] GET falhou:", err);
    return NextResponse.json({
      products: [],
      error: "Banco indisponível",
      details: error.message,
    });
  }
}
