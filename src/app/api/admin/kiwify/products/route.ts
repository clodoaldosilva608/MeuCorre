import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { kiwifyFetch, getKiwifyAccessToken } from "@/lib/kiwify-client";

// GET /api/admin/kiwify/products
// Lista produtos da Kiwify via API oficial (com cache de 1 hora)
// Documentação: https://docs.kiwify.com.br/api-reference/products/list

let productsCache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const clientId = process.env.KIWIFY_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json({
      error: "KIWIFY_CLIENT_ID não configurado",
      products: [],
    });
  }

  // Verificar cache de produtos
  if (productsCache && Date.now() - productsCache.timestamp < CACHE_TTL) {
    return NextResponse.json({ products: productsCache.data, cached: true });
  }

  try {
    // Testar se OAuth funciona
    const token = await getKiwifyAccessToken();
    if (!token) {
      return NextResponse.json({
        error: "Falha na autenticação Kiwify (OAuth). Verifique KIWIFY_CLIENT_ID e KIWIFY_CLIENT_SECRET.",
        products: [],
      }, { status: 502 });
    }

    const res = await kiwifyFetch("/products");

    if (!res.ok) {
      const err = await res.text();
      console.error("[kiwify/products] List falhou:", err);
      return NextResponse.json({
        error: "Falha ao listar produtos",
        details: err,
        products: [],
      }, { status: 502 });
    }

    const data = await res.json();
    const products = data.data || [];

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
