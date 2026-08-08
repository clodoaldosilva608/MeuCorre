import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/login
// Auth simples por senha única (env var ADMIN_PASSWORD).
// Seta cookie httpOnly com token opaco.
export async function POST(req: NextRequest) {
  const { password } = (await req.json()) as { password?: string };

  if (!password) {
    return NextResponse.json({ error: "Senha obrigatória" }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "Servidor sem ADMIN_PASSWORD configurado" },
      { status: 500 },
    );
  }

  if (password !== expected) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  // Token opaco = hash simples da senha + timestamp (MVP — para prod use JWT ou session server)
  const token = Buffer.from(`${expected}:${Date.now()}`).toString("base64");

  const res = NextResponse.json({ ok: true });
  res.cookies.set("meucorre_admin", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
  return res;
}
