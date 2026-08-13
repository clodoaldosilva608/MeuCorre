import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// ===== Gerenciamento do token OAuth2 do Blogger =====
//
// 3 endpoints nesta rota:
//   GET  /api/admin/blog/blogger-token   → status do token (configurado? expirado?)
//   POST /api/admin/blog/blogger-token   → troca code OAuth por token e salva no DB
//   DELETE /api/admin/blog/blogger-token → revoga/remove token
//
// O token é salvo na tabela Setting (key="blogger_oauth_token") — funciona em
// serverless (Vercel) porque NÃO depende de filesystem.
//
// Env vars necessárias (Vercel → Settings → Environment Variables):
//   BLOGGER_CLIENT_ID      — Google OAuth Client ID
//   BLOGGER_CLIENT_SECRET  — Google OAuth Client Secret
//   BLOGGER_REDIRECT_URI   — https://meucorre.vercel.app/api/blogger-callback
//   BLOGGER_BLOG_ID        — ID do blog no Blogger

const BLOG_ID = process.env.BLOGGER_BLOG_ID || "4757545819072532942";
const CLIENT_ID = process.env.BLOGGER_CLIENT_ID || "";
const CLIENT_SECRET = process.env.BLOGGER_CLIENT_SECRET || "";
const REDIRECT_URI =
  process.env.BLOGGER_REDIRECT_URI ||
  "https://meucorre.vercel.app/api/blogger-callback";

const TOKEN_KEY = "blogger_oauth_token";

// ===== GET: status do token =====
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Verifica se as env vars estão configuradas
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json({
      configured: false,
      needsEnvVars: true,
      message:
        "BLOGGER_CLIENT_ID e BLOGGER_CLIENT_SECRET precisam ser configurados nas variáveis de ambiente da Vercel.",
    });
  }

  // Busca token no banco
  const setting = await prisma.setting.findUnique({
    where: { key: TOKEN_KEY },
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=${encodeURIComponent("https://www.googleapis.com/auth/blogger")}&prompt=consent&response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  if (!setting) {
    return NextResponse.json({
      configured: true,
      hasToken: false,
      authUrl,
    });
  }

  let tokens: {
    access_token?: string;
    refresh_token?: string;
    expiry_date?: number;
  };
  try {
    tokens = JSON.parse(setting.value);
  } catch {
    return NextResponse.json({
      configured: true,
      hasToken: false,
      error: "Token armazenado é inválido. Reautorize.",
      authUrl,
    });
  }

  // Verifica se expirou (com 5min de margem)
  const now = Date.now();
  const expired =
    !tokens.expiry_date || tokens.expiry_date < now + 5 * 60 * 1000;

  return NextResponse.json({
    configured: true,
    hasToken: true,
    expired,
    hasRefreshToken: !!tokens.refresh_token,
    authUrl: expired ? authUrl : undefined,
  });
}

// ===== POST: troca code OAuth por token =====
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json(
      {
        error:
          "BLOGGER_CLIENT_ID e BLOGGER_CLIENT_SECRET não configurados. Configure nas variáveis de ambiente da Vercel.",
      },
      { status: 500 },
    );
  }

  const { code } = (await req.json()) as { code?: string };
  if (!code) {
    return NextResponse.json({ error: "Código OAuth não fornecido" }, { status: 400 });
  }

  // Troca code por tokens no endpoint do Google
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    return NextResponse.json(
      { error: `Erro ao trocar código por token: ${err}` },
      { status: 400 },
    );
  }

  const tokens = await tokenRes.json();

  // Salva no banco (Setting) — preserva refresh_token existente se o novo não trouxer
  const existing = await prisma.setting.findUnique({
    where: { key: TOKEN_KEY },
  });
  let finalTokens = tokens;
  if (existing) {
    try {
      const prev = JSON.parse(existing.value);
      // Se o novo não tem refresh_token (reautorização sem prompt=consent),
      // mantém o anterior
      if (!tokens.refresh_token && prev.refresh_token) {
        finalTokens = { ...tokens, refresh_token: prev.refresh_token };
      }
    } catch {
      // ignore parse errors
    }
  }

  await prisma.setting.upsert({
    where: { key: TOKEN_KEY },
    update: { value: JSON.stringify(finalTokens) },
    create: { key: TOKEN_KEY, value: JSON.stringify(finalTokens) },
  });

  return NextResponse.json({ ok: true });
}

// ===== DELETE: remove token =====
export async function DELETE() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await prisma.setting.deleteMany({ where: { key: TOKEN_KEY } });
  return NextResponse.json({ ok: true });
}
