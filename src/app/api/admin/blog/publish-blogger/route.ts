import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { z } from "zod";

// POST /api/admin/blog/publish-blogger
// Publica (ou atualiza) um post do blog interno no Blogger externo.
//
// Token OAuth2 é lido da tabela Setting (key="blogger_oauth_token") —
// funciona em serverless (Vercel) sem depender de filesystem.
// Se o token expirou, tenta refresh automático antes de publicar.

const BLOG_ID = process.env.BLOGGER_BLOG_ID || "4757545819072532942";
const CLIENT_ID = process.env.BLOGGER_CLIENT_ID || "";
const CLIENT_SECRET = process.env.BLOGGER_CLIENT_SECRET || "";
const REDIRECT_URI =
  process.env.BLOGGER_REDIRECT_URI ||
  "https://meucorre.vercel.app/api/blogger-callback";

const TOKEN_KEY = "blogger_oauth_token";

async function getValidTokens(): Promise<{
  tokens: {
    access_token?: string;
    refresh_token?: string;
    expiry_date?: number;
  } | null;
  needsAuth?: boolean;
  authUrl?: string;
  error?: string;
}> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return {
      tokens: null,
      error:
        "BLOGGER_CLIENT_ID e BLOGGER_CLIENT_SECRET não configurados na Vercel.",
    };
  }

  const setting = await prisma.setting.findUnique({
    where: { key: TOKEN_KEY },
  });
  if (!setting) {
    return {
      tokens: null,
      needsAuth: true,
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=${encodeURIComponent("https://www.googleapis.com/auth/blogger")}&prompt=consent&response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`,
    };
  }

  let tokens: {
    access_token?: string;
    refresh_token?: string;
    expiry_date?: number;
  };
  try {
    tokens = JSON.parse(setting.value);
  } catch {
    return {
      tokens: null,
      needsAuth: true,
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=${encodeURIComponent("https://www.googleapis.com/auth/blogger")}&prompt=consent&response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`,
    };
  }

  // Verifica expiração (5min de margem)
  const now = Date.now();
  const expired = !tokens.expiry_date || tokens.expiry_date < now + 5 * 60 * 1000;

  if (expired && tokens.refresh_token) {
    // Tenta refresh automático
    try {
      const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: tokens.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      if (refreshRes.ok) {
        const refreshed = await refreshRes.json();
        const newTokens = {
          ...tokens,
          access_token: refreshed.access_token,
          expiry_date: Date.now() + (refreshed.expires_in ?? 3600) * 1000,
          // mantém refresh_token original (Google não retorna um novo)
        };
        await prisma.setting.update({
          where: { key: TOKEN_KEY },
          data: { value: JSON.stringify(newTokens) },
        });
        return { tokens: newTokens };
      }
    } catch {
      // refresh falhou — cai no needsAuth abaixo
    }

    return {
      tokens: null,
      needsAuth: true,
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=${encodeURIComponent("https://www.googleapis.com/auth/blogger")}&prompt=consent&response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`,
    };
  }

  return { tokens };
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { postId } = (await req.json()) as { postId: string };

  const post = await prisma.blogPost.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  }

  // Carrega token do banco
  const { tokens, needsAuth, authUrl, error } = await getValidTokens();

  if (error) {
    return NextResponse.json({ error, needsEnvVars: true }, { status: 500 });
  }

  if (!tokens) {
    return NextResponse.json(
      {
        error: "Token do Blogger não configurado. Autorize o app primeiro.",
        needsAuth: true,
        authUrl,
      },
      { status: 403 },
    );
  }

  // Converte markdown → HTML simples (Blogger não aceita markdown)
  const htmlContent = markdownToHtml(post.content);

  // Adiciona capa no topo
  let content = htmlContent;
  if (post.coverUrl) {
    const coverUrl = post.coverUrl.startsWith("http")
      ? post.coverUrl
      : `https://meucorre.vercel.app${post.coverUrl}`;
    content = `<img src="${coverUrl}" alt="${post.title}" style="width:100%;border-radius:12px;margin-bottom:20px;"/>\n${content}`;
  }

  // Adiciona link para o app
  content += `\n<hr style="margin:30px 0;border:none;border-top:1px solid #ddd;"/>\n<p style="text-align:center;font-size:16px;">📱 Baixe o <strong>MeuCorre</strong> grátis — controle suas corridas e despesas: <a href="https://meucorre.vercel.app" style="color:#10B981;font-weight:bold;text-decoration:none;">meucorre.vercel.app</a></p>`;

  const labels =
    post.labels?.split(",").map((l) => l.trim()).filter(Boolean) || [];

  try {
    // Usa fetch direto (evita import dinâmico de googleapis que pode falhar em serverless)
    const bloggerApi = "https://www.googleapis.com/blogger/v3";
    const headers = {
      Authorization: `Bearer ${tokens.access_token}`,
      "Content-Type": "application/json",
    };

    let response: Response;

    if (post.bloggerPostId) {
      // Atualiza post existente
      response = await fetch(
        `${bloggerApi}/blogs/${BLOG_ID}/posts/${post.bloggerPostId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            title: post.title,
            content,
            labels,
          }),
        },
      );
    } else {
      // Cria novo post
      response = await fetch(`${bloggerApi}/blogs/${BLOG_ID}/posts`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: post.title,
          content,
          labels,
        }),
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = errText;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.error?.message || errText;
      } catch {
        // mantém errText
      }
      return NextResponse.json(
        {
          error: `Blogger API erro (${response.status}): ${errMsg}`,
          needsAuth: response.status === 401,
          authUrl:
            response.status === 401
              ? `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=${encodeURIComponent("https://www.googleapis.com/auth/blogger")}&prompt=consent&response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
              : undefined,
        },
        { status: 500 },
      );
    }

    const data = await response.json();

    // Salva IDs do Blogger no post interno
    const updated = await prisma.blogPost.update({
      where: { id: postId },
      data: {
        bloggerPostId: data.id,
        bloggerUrl: data.url,
      },
    });

    return NextResponse.json({
      ok: true,
      bloggerUrl: data.url,
      post: updated,
    });
  } catch (error) {
    const err = error as { message: string };
    return NextResponse.json(
      { error: err.message || "Erro desconhecido" },
      { status: 500 },
    );
  }
}

// ===== Conversão simples Markdown → HTML =====
// Blogger não aceita markdown, então convertemos os elementos básicos.
function markdownToHtml(md: string): string {
  let html = md;

  // Headers (deve vir antes de outras substituições)
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold e italic
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Links [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>',
  );

  // Listas não-ordenadas
  html = html.replace(/^(?:- (.+)(?:\n|$))+/gm, (match) => {
    const items = match
      .trim()
      .split("\n")
      .map((l) => l.replace(/^- /, "").trim())
      .map((l) => `<li>${l}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  });

  // Listas ordenadas
  html = html.replace(/^(?:\d+\. (.+)(?:\n|$))+/gm, (match) => {
    const items = match
      .trim()
      .split("\n")
      .map((l) => l.replace(/^\d+\. /, "").trim())
      .map((l) => `<li>${l}</li>`)
      .join("");
    return `<ol>${items}</ol>`;
  });

  // Blockquote
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

  // HR
  html = html.replace(/^---$/gm, "<hr/>");

  // Parágrafos: linhas em branco separam parágrafos
  html = html
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      // Se já começa com tag HTML, não envolve em <p>
      if (/^<(h[1-6]|ul|ol|li|blockquote|hr|img|pre)/.test(trimmed)) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .filter(Boolean)
    .join("\n");

  return html;
}
