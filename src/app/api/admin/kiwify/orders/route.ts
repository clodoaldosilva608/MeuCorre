import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { kiwifyFetch } from "@/lib/kiwify-client";

// GET /api/admin/kiwify/orders?days=30
// Lista pedidos (vendas) da Kiwify via API oficial (com cache de 5 minutos)
// Documentação: https://docs.kiwify.com.br/api-reference/sales/list-sales

let ordersCache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get("days") ?? "30");

  // Verificar cache
  if (ordersCache && Date.now() - ordersCache.timestamp < CACHE_TTL) {
    return NextResponse.json({ orders: ordersCache.data, cached: true });
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0]; // YYYY-MM-DD

    // Endpoint: /v1/sales (não /orders)
    // Documentação: https://docs.kiwify.com.br/api-reference/sales/list-sales
    // Kiwify exige: start_date + end_date (ambos obrigatórios), sem per_page
    const endDateStr = new Date().toISOString().split("T")[0];
    const res = await kiwifyFetch(
      `/sales?start_date=${startDateStr}&end_date=${endDateStr}`
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[kiwify/orders] List falhou:", err);
      return NextResponse.json({
        error: "Falha ao listar vendas",
        details: err,
        orders: [],
      }, { status: 502 });
    }

    const data = await res.json();
    const orders = data.data || [];

    // Atualizar cache
    ordersCache = { data: orders, timestamp: Date.now() };

    return NextResponse.json({ orders, cached: false });
  } catch (error) {
    console.error("[kiwify/orders] Erro:", error);
    return NextResponse.json({
      error: "Erro interno",
      orders: [],
    }, { status: 500 });
  }
}
