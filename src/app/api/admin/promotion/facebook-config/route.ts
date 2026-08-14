import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// ===== Configuração do Facebook/Instagram Graph API =====
//
// GET  /api/admin/promotion/facebook-config — status da configuração
// POST /api/admin/promotion/facebook-config — troca code OAuth por token
// DELETE /api/admin/promotion/facebook-config — remove token
//
// O token é salvo na tabela Setting (key="facebook_page_token").
// Funciona em serverless (Vercel) sem depender de filesystem.
//
// COMO CONFIGURAR:
// 1. Criar app em https://developers.facebook.com/apps/
// 2. Adicionar produto "Facebook Login"
// 3. Configurar OAuth redirect URI: https://meucorre.vercel.app/api/facebook-callback
// 4. Solicitar permissões: pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish
// 5. App Review: necessário para publicação pública (pode levar semanas)
// 6. Para Instagram: precisa de conta Business conectada a uma Página do Facebook
//
// Env vars necessárias:
//   FACEBOOK_APP_ID — App ID do Facebook
//   FACEBOOK_APP_SECRET — App Secret do Facebook
//   FACEBOOK_REDIRECT_URI — https://meucorre.vercel.app/api/facebook-callback

const APP_ID = process.env.FACEBOOK_APP_ID || "";
const APP_SECRET = process.env.FACEBOOK_APP_SECRET || "";
const REDIRECT_URI =
  process.env.FACEBOOK_REDIRECT_URI ||
  "https://meucorre.vercel.app/api/facebook-callback";

const TOKEN_KEY = "facebook_page_token";
const PAGE_INFO_KEY = "facebook_page_info";
const IG_USER_KEY = "instagram_business_user";

const SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "pages_read_user_content",
  "instagram_basic",
  "instagram_content_publish",
].join(",");

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!APP_ID || !APP_SECRET) {
    return NextResponse.json({
      configured: false,
      needsEnvVars: true,
      message:
        "FACEBOOK_APP_ID e FACEBOOK_APP_SECRET precisam ser configurados nas variáveis de ambiente da Vercel.",
      steps: [
        "1. Acesse https://developers.facebook.com/apps/ e crie um app",
        "2. Adicione o produto 'Facebook Login'",
        "3. Configure a OAuth redirect URI: " + REDIRECT_URI,
        "4. Solicite as permissões: " + SCOPES,
        "5. Copie App ID e App Secret",
        "6. Configure nas env vars da Vercel",
        "7. Para Instagram: conecte uma conta Business a uma Página do Facebook",
      ],
    });
  }

  const tokenSetting = await prisma.setting.findUnique({
    where: { key: TOKEN_KEY },
  });
  const pageInfoSetting = await prisma.setting.findUnique({
    where: { key: PAGE_INFO_KEY },
  });
  const igUserSetting = await prisma.setting.findUnique({
    where: { key: IG_USER_KEY },
  });

  if (!tokenSetting) {
    return NextResponse.json({
      configured: true,
      hasToken: false,
      authUrl: `https://www.facebook.com/v19.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&response_type=code`,
    });
  }

  let tokenData: { access_token?: string; expires_in?: number };
  try {
    tokenData = JSON.parse(tokenSetting.value);
  } catch {
    return NextResponse.json({
      configured: true,
      hasToken: false,
      error: "Token armazenado é inválido. Reautorize.",
      authUrl: `https://www.facebook.com/v19.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&response_type=code`,
    });
  }

  let pageInfo: { id?: string; name?: string; access_token?: string } | null = null;
  if (pageInfoSetting) {
    try {
      pageInfo = JSON.parse(pageInfoSetting.value);
    } catch {}
  }

  let igUser: { id?: string; username?: string } | null = null;
  if (igUserSetting) {
    try {
      igUser = JSON.parse(igUserSetting.value);
    } catch {}
  }

  // Verifica se o token ainda é válido
  try {
    const verifyRes = await fetch(
      `https://graph.facebook.com/v19.0/me?access_token=${tokenData.access_token}`,
    );
    const verifyData = await verifyRes.json();

    if (verifyData.error) {
      return NextResponse.json({
        configured: true,
        hasToken: true,
        valid: false,
        error: verifyData.error.message,
        authUrl: `https://www.facebook.com/v19.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&response_type=code`,
      });
    }

    return NextResponse.json({
      configured: true,
      hasToken: true,
      valid: true,
      userInfo: {
        id: verifyData.id,
        name: verifyData.name,
      },
      page: pageInfo,
      instagram: igUser,
    });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({
      configured: true,
      hasToken: true,
      valid: false,
      error: `Erro ao verificar token: ${err.message}`,
    });
  }
}

// POST — troca code OAuth por token de longa duração
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!APP_ID || !APP_SECRET) {
    return NextResponse.json(
      { error: "FACEBOOK_APP_ID e FACEBOOK_APP_SECRET não configurados." },
      { status: 500 },
    );
  }

  const { code } = (await req.json()) as { code?: string };
  if (!code) {
    return NextResponse.json({ error: "Código OAuth não fornecido" }, { status: 400 });
  }

  // 1. Troca code por token de curta duração
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${APP_SECRET}&code=${code}`,
  );
  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return NextResponse.json(
      { error: tokenData.error.message },
      { status: 400 },
    );
  }

  const shortLivedToken = tokenData.access_token;

  // 2. Troca por token de longa duração (60 dias)
  const longLivedRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortLivedToken}`,
  );
  const longLivedData = await longLivedRes.json();

  if (longLivedData.error) {
    return NextResponse.json(
      { error: longLivedData.error.message },
      { status: 400 },
    );
  }

  const longLivedToken = longLivedData.access_token;
  const expiresAt = Date.now() + (longLivedData.expires_in || 5184000) * 1000;

  // 3. Salva o token de longa duração
  await prisma.setting.upsert({
    where: { key: TOKEN_KEY },
    update: { value: JSON.stringify({ access_token: longLivedToken, expires_at: expiresAt }) },
    create: { key: TOKEN_KEY, value: JSON.stringify({ access_token: longLivedToken, expires_at: expiresAt }) },
  });

  // 4. Lista as Páginas do usuário (para selecionar qual usar)
  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${longLivedToken}`,
  );
  const pagesData = await pagesRes.json();

  if (pagesData.data && pagesData.data.length > 0) {
    // Pega a primeira página (ou pode ser selecionada via UI depois)
    const page = pagesData.data[0];

    await prisma.setting.upsert({
      where: { key: PAGE_INFO_KEY },
      update: { value: JSON.stringify({ id: page.id, name: page.name, access_token: page.access_token }) },
      create: { key: PAGE_INFO_KEY, value: JSON.stringify({ id: page.id, name: page.name, access_token: page.access_token }) },
    });

    // 5. Tenta buscar a conta de Instagram Business associada à Página
    try {
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
      );
      const igData = await igRes.json();

      if (igData.instagram_business_account?.id) {
        const igId = igData.instagram_business_account.id;

        // Busca username do Instagram
        const igUserRes = await fetch(
          `https://graph.facebook.com/v19.0/${igId}?fields=username,profile_picture_url&access_token=${page.access_token}`,
        );
        const igUserData = await igUserRes.json();

        await prisma.setting.upsert({
          where: { key: IG_USER_KEY },
          update: { value: JSON.stringify({ id: igId, username: igUserData.username }) },
          create: { key: IG_USER_KEY, value: JSON.stringify({ id: igId, username: igUserData.username }) },
        });
      }
    } catch {
      // Instagram não configurado — tudo bem, só Facebook
    }

    return NextResponse.json({
      ok: true,
      page: { id: page.id, name: page.name },
    });
  }

  return NextResponse.json({
    ok: true,
    message: "Token salvo, mas nenhuma Página do Facebook encontrada.",
  });
}

// DELETE — remove token
export async function DELETE() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await prisma.setting.deleteMany({
    where: { key: { in: [TOKEN_KEY, PAGE_INFO_KEY, IG_USER_KEY] } },
  });

  return NextResponse.json({ ok: true });
}
