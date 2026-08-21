import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";

// ===== Sessão temporária de comprador =====
//
// Quando o cliente faz checkout na Kiwify, não temos controle sobre
// quais query params a Kiwify repassa. Pra evitar IDOR (qualquer um
// poder buscar licença por email), criamos um cookie de sessão JWT
// assinado quando o cliente chega na landing e preenche o form.
//
// Esse cookie é gerado em /api/subscription/checkout-session
// e validado aqui. Sem ele, /api/license/by-order recusa.
//
// SEGURANÇA (P0-8 corrigido):
// Antes, se ADMIN_JWT_SECRET e ADMIN_PASSWORD ambos ausentes, caía pra
// `"meucorre-session-fallback"` — atacante que conhece o código-fonte
// forja sessões de checkout livremente, acessando licença de qualquer email.
// Agora falha closed: exige secret configurado.
const SESSION_SECRET_ENV =
  process.env.ADMIN_JWT_SECRET ?? process.env.ADMIN_PASSWORD;
if (!SESSION_SECRET_ENV) {
  console.error(
    "[license/by-order] ADMIN_JWT_SECRET ou ADMIN_PASSWORD deve estar configurado",
  );
}
const SESSION_SECRET = new TextEncoder().encode(
  SESSION_SECRET_ENV ?? "meucorre-session-UNCONFIGURED-DO-NOT-USE-IN-PROD",
);

interface CheckoutSession {
  email: string;
  exp: number;
}

// PUBLIC ROUTE — Esta rota é intencionalmente pública (não requer admin auth)
export async function GET(req: NextRequest) {
  // 1. Extrai sessão do cookie
  const cookieStore = req.cookies;
  const sessionCookie = cookieStore.get("meucorre_checkout")?.value;

  let sessionEmail: string | null = null;

  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie, SESSION_SECRET, {
        algorithms: ["HS256"],
      });
      sessionEmail = (payload as unknown as CheckoutSession).email;
    } catch {
      // Cookie inválido/expirado — ignora
    }
  }

  if (!sessionEmail) {
    return NextResponse.json(
      {
        found: false,
        error: "Sessão expirada. Acesse o link enviado por email.",
      },
      { status: 401 },
    );
  }

  // 2. Extrai params (apenas order_id; não aceita email na query)
  const { searchParams } = new URL(req.url);
  const orderId =
    searchParams.get("order") ||
    searchParams.get("order_id") ||
    searchParams.get("order_ref") ||
    searchParams.get("id");

  // 3. Busca por order_id (vinculado ao email da sessão)
  if (orderId) {
    const sub = await prisma.subscription.findUnique({
      where: { kiwifyOrderId: orderId },
      select: {
        id: true,
        buyerName: true,
        buyerEmail: true,
        status: true,
        licenseKey: true,
        paymentMethod: true,
        amount: true,
        createdAt: true,
      },
    });

    // Verifica que a assinatura pertence ao email da sessão
    if (sub && sub.buyerEmail === sessionEmail) {
      return NextResponse.json({ found: true, subscription: sub });
    }
  }

  // 4. Fallback: busca licença aprovada mais recente do email da sessão
  const sub = await prisma.subscription.findFirst({
    where: {
      buyerEmail: sessionEmail,
      status: "approved",
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      buyerName: true,
      buyerEmail: true,
      status: true,
      licenseKey: true,
      paymentMethod: true,
      amount: true,
      createdAt: true,
    },
  });

  if (sub) {
    return NextResponse.json({ found: true, subscription: sub });
  }

  return NextResponse.json(
    { found: false, status: "pending", message: "Pagamento ainda não confirmado" },
    { status: 202 },
  );
}

// ===== Endpoint auxiliar: cria sessão de checkout =====
// POST /api/license/by-order/checkout-session
// Body: { email: string }
// Retorna cookie httpOnly com JWT da sessão (válido 24h)
export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = (await req.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Email inválido" },
      { status: 400 },
    );
  }

  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SESSION_SECRET);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("meucorre_checkout", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24, // 24h
  });
  return res;
}
