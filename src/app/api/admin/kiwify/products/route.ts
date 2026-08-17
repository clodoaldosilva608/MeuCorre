import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/admin/kiwify/products
// Lista produtos da Kiwify via API (com cache de 1 hora)
// Documentação: https://docs.kiwify.com.br/api-reference/products/list

const KIWIFY_API_BASE = "https://api.kiwify.com.br/v1";

// Cache em memória (renova a cada 1 hora)
let productsCache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const apiToken = process.env.KIWIFY_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json({
      error: "KIWIFY_API_TOKEN não configurado",
      products: [],
    });
  }

  // Verificar cache
  if (productsCache && Date.now() - productsCache.timestamp < CACHE_TTL) {
    return NextResponse.json({ products: productsCache.data, cached: true });
  }

  try {
    // A Kiwify usa OAuth: primeiro gera bearer token com api_key
    // Documentação: https://docs.kiwify.com.br/api-reference/general
    const tokenRes = await fetch(`${KIWIFY_API_BASE}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiToken,
        grant_type: "client_credentials",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("[kiwify/products] OAuth falhou:", err);
      return NextResponse.json({
        error: "Falha na autenticação Kiwify",
        details: err,
        products: [],
      }, { status: 502 });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json({
        error: "Token Kiwify não retornado",
        products: [],
      }, { status: 502 });
    }

    // Listar produtos
    const productsRes = await fetch(`${KIWIFY_API_BASE}/products`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!productsRes.ok) {
      const err = await productsRes.text();
      console.error("[kiwify/products] List falhou:", err);
      return NextResponse.json({
        error: "Falha ao listar produtos",
        details: err,
        products: [],
      }, { status: 502 });
    }

    const productsData = await productsRes.json();
    const products = productsData.data || productsData.products || [];

    // Atualizar cache
    productsCache = { data: products, timestamp: Date.now() };

    return NextResponse.json({ products, cached: false });
  } catch (error) {
    console.error("[kiwify/products] Erro:", error);
    return NextResponse.json({
      error: "Erro interno",
      products: [],
    }, { status: 500 });
  }
}
