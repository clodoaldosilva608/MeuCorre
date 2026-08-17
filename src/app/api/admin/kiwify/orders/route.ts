import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/admin/kiwify/orders?days=30
// Lista pedidos da Kiwify via API (com cache de 5 minutos)

const KIWIFY_API_BASE = "https://api.kiwify.com.br/v1";
let ordersCache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const apiToken = process.env.KIWIFY_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json({
      error: "KIWIFY_API_TOKEN não configurado",
      orders: [],
    });
  }

  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get("days") ?? "30");

  // Verificar cache
  if (ordersCache && Date.now() - ordersCache.timestamp < CACHE_TTL) {
    return NextResponse.json({ orders: ordersCache.data, cached: true });
  }

  try {
    // OAuth token
    const tokenRes = await fetch(`${KIWIFY_API_BASE}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiToken,
        grant_type: "client_credentials",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.json({
        error: "Falha na autenticação Kiwify",
        orders: [],
      }, { status: 502 });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Listar orders dos últimos N dias
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const ordersRes = await fetch(
      `${KIWIFY_API_BASE}/orders?start_date=${startDate.toISOString()}&per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!ordersRes.ok) {
      const err = await ordersRes.text();
      console.error("[kiwify/orders] List falhou:", err);
      return NextResponse.json({
        error: "Falha ao listar pedidos",
        details: err,
        orders: [],
      }, { status: 502 });
    }

    const ordersData = await ordersRes.json();
    const orders = ordersData.data || ordersData.orders || [];

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
