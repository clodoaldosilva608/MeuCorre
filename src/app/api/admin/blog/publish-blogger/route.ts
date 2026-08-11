import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// POST /api/admin/blog/publish-blogger
// Publica (ou atualiza) um post do blog interno no Blogger externo.
// Usa o token OAuth2 salvo em scripts/blogger-token.json.

const BLOG_ID = process.env.BLOGGER_BLOG_ID || "4757545819072532942";
const CLIENT_ID = process.env.BLOGGER_CLIENT_ID || "";
const CLIENT_SECRET = process.env.BLOGGER_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.BLOGGER_REDIRECT_URI || "https://meucorre.vercel.app/api/blogger-callback";

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { postId } = (await req.json()) as { postId: string };

  const post = await prisma.blogPost.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  }

  // Carrega token
  const fs = await import("fs");
  const path = await import("path");
  const tokenPath = path.join(process.cwd(), "scripts", "blogger-token.json");

  if (!fs.existsSync(tokenPath)) {
    return NextResponse.json({
      error: "Token do Blogger não encontrado. Autorize o app primeiro.",
      needsAuth: true,
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fblogger&prompt=consent&response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`,
    }, { status: 403 });
  }

  const tokens = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));

  // Usa googleapis dinamicamente
  const { google } = await import("googleapis");
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  oauth2Client.setCredentials(tokens);

  const blogger = google.blogger({ version: "v3", auth: oauth2Client });

  // Prepara conteúdo
  let content = post.content;
  if (post.coverUrl) {
    content = `<img src="${post.coverUrl}" alt="${post.title}" style="width:100%;border-radius:12px;margin-bottom:20px;"/>\n${content}`;
  }

  // Adiciona link para o app
  content += `\n<hr style="margin:30px 0;border:none;border-top:1px solid #ddd;"/>\n<p style="text-align:center;"><a href="https://meucorre.vercel.app" style="color:#10B981;font-weight:bold;">Baixe o MeuCorre grátis →</a></p>`;

  const labels = post.labels?.split(",").map(l => l.trim()).filter(Boolean) || [];

  try {
    let response;

    if (post.bloggerPostId) {
      // Atualiza post existente no Blogger
      response = await blogger.posts.update({
        blogId: BLOG_ID,
        postId: post.bloggerPostId,
        requestBody: {
          title: post.title,
          content: content,
          labels: labels,
        },
      });
    } else {
      // Cria novo post no Blogger
      response = await blogger.posts.insert({
        blogId: BLOG_ID,
        requestBody: {
          title: post.title,
          content: content,
          labels: labels,
        },
      });
    }

    // Salva IDs do Blogger no post interno
    const updated = await prisma.blogPost.update({
      where: { id: postId },
      data: {
        bloggerPostId: response.data.id,
        bloggerUrl: response.data.url,
      },
    });

    return NextResponse.json({
      ok: true,
      bloggerUrl: response.data.url,
      post: updated,
    });
  } catch (error) {
    const err = error as { message: string; response?: { data?: { error?: { message?: string } } } };
    return NextResponse.json({
      error: err.response?.data?.error?.message || err.message,
    }, { status: 500 });
  }
}
