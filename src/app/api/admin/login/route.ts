import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/login
// Auth por email + senha (env vars ADMIN_EMAIL e ADMIN_PASSWORD).
// Seta cookie httpOnly com token base64.
export async function POST(req: NextRequest) {
  const { email, password } = (await req.json()) as {
    email?: string;
    password?: string;
  };

  if (!email?.trim() || !password) {
    return NextResponse.json(
      { error: "Email e senha são obrigatórios" },
      { status: 400 },
    );
  }

  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedEmail || !expectedPassword) {
    return NextResponse.json(
      { error: "Servidor sem ADMIN_EMAIL/ADMIN_PASSWORD configurado" },
      { status: 500 },
    );
  }

  if (
    email.trim().toLowerCase() !== expectedEmail.toLowerCase() ||
    password !== expectedPassword
  ) {
    return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 });
  }

  // Token opaco = base64(`${email}:${password}:${timestamp}`)
  const token = Buffer.from(
    `${expectedEmail}:${expectedPassword}:${Date.now()}`,
  ).toString("base64");

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
