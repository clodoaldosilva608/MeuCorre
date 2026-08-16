import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { z } from "zod";
// ===== Publicação automática no Facebook e Instagram =====
//
// POST /api/admin/promotion/publish-facebook
// Body: {
//   postId: string,
//   platform: "facebook" | "instagram" | "both",
//   message?: string,  // texto customizado (opcional)
//   imageUrl?: string, // URL da imagem (opcional)
//   link?: string,     // link anexo (opcional, só Facebook)
// }
//
// Fluxo:
// 1. Carrega token da Página do Facebook (Setting)
// 2. Se platform=facebook ou both: publica na Página do Facebook
// 3. Se platform=instagram ou both: publica no Instagram Business
//    - Instagram exige mídia (imagem ou vídeo)
//    - Usa container API: cria container → publica
//
// Requisitos:
// - App Review do Facebook aprovado (para uso público)
// - Conta Instagram Business conectada à Página
// - Permissões: pages_manage_posts, instagram_content_publish

const PAGE_INFO_KEY = "facebook_page_info";
const IG_USER_KEY = "instagram_business_user";

async function getStoredSettings() {
  const [pageSetting, igSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { key: PAGE_INFO_KEY } }),
    prisma.setting.findUnique({ where: { key: IG_USER_KEY } }),
  ]);

  let pageInfo: { id?: string; name?: string; access_token?: string } | null = null;
  let igUser: { id?: string; username?: string } | null = null;

  if (pageSetting) {
    try {
      pageInfo = JSON.parse(pageSetting.value);
    } catch {}
  }

  if (igSetting) {
    try {
      igUser = JSON.parse(igSetting.value);
    } catch {}
  }

  return { pageInfo, igUser };
}

function buildMessage(post: {
  title: string;
  description: string;
  hashtags: string | null;
  cta: string | null;
  destinationUrl: string | null;
}, customMessage?: string): string {
  if (customMessage) return customMessage;

  const parts: string[] = [];
  parts.push(post.title);
  parts.push("");
  parts.push(post.description);

  if (post.hashtags) {
    parts.push("");
    parts.push(post.hashtags);
  }

  if (post.cta) {
    parts.push("");
    parts.push(post.cta);
  }

  if (post.destinationUrl) {
    parts.push("");
    parts.push(post.destinationUrl);
  }

  return parts.filter(Boolean).join("\n");
}

// Publica no Facebook (Página)
async function publishToFacebook(
  pageAccessToken: string,
  pageId: string,
  message: string,
  imageUrl?: string,
  link?: string,
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const body: Record<string, string> = {
      message,
      access_token: pageAccessToken,
    };

    if (imageUrl) body.url = imageUrl;
    if (link) body.link = link;

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    const data = await res.json();

    if (data.error) {
      return { success: false, error: data.error.message };
    }

    return { success: true, postId: data.id };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

// Publica no Instagram Business (exige imagem)
async function publishToInstagram(
  igUserId: string,
  pageAccessToken: string,
  message: string,
  imageUrl: string,
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // 1. Cria container de mídia
    const containerRes = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: message,
          access_token: pageAccessToken,
        }),
      },
    );

    const containerData = await containerRes.json();

    if (containerData.error) {
      return { success: false, error: containerData.error.message };
    }

    const creationId = containerData.id;

    // 2. Aguarda 3 segundos (recomendado pelo Facebook)
    await new Promise((r) => setTimeout(r, 3000));

    // 3. Publica o container
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: pageAccessToken,
        }),
      },
    );

    const publishData = await publishRes.json();

    if (publishData.error) {
      return { success: false, error: publishData.error.message };
    }

    return { success: true, postId: publishData.id };
  } catch (e: unknown) {
    const err = e as Error;
    return { success: false, error: err.message };
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as {
    postId?: string;
    platform?: "facebook" | "instagram" | "both";
    message?: string;
    imageUrl?: string;
    link?: string;
  };

  if (!body.postId) {
    return NextResponse.json({ error: "postId é obrigatório" }, { status: 400 });
  }

  const platform = body.platform || "both";

  // Carrega configurações
  const { pageInfo, igUser } = await getStoredSettings();

  if (!pageInfo?.access_token) {
    return NextResponse.json(
      {
        error: "Facebook não configurado. Autorize via POST /api/admin/promotion/facebook-config",
        needsConfig: true,
      },
      { status: 403 },
    );
  }

  if ((platform === "instagram" || platform === "both") && !igUser?.id) {
    return NextResponse.json(
      {
        error: "Instagram Business não configurado. Conecte uma conta Business à Página do Facebook.",
      },
      { status: 400 },
    );
  }

  // Carrega o post
  const post = await prisma.promotionPost.findUnique({
    where: { id: body.postId },
    include: {
      asset: true,
      postAssets: { include: { asset: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  }

  const message = buildMessage(post, body.message);
  const imageUrl =
    body.imageUrl ||
    post.asset?.publicUrl ||
    post.postAssets?.[0]?.asset?.publicUrl ||
    undefined;

  // Converte URL relativa em absoluta
  const absoluteImageUrl = imageUrl?.startsWith("/")
    ? `https://meucorre.vercel.app${imageUrl}`
    : imageUrl;

  const results: Array<{ platform: string; success: boolean; postId?: string; error?: string }> = [];

  // 1. Publica no Facebook
  if (platform === "facebook" || platform === "both") {
    const fbResult = await publishToFacebook(
      pageInfo.access_token!,
      pageInfo.id!,
      message,
      absoluteImageUrl,
      body.link || post.destinationUrl || undefined,
    );
    results.push({ platform: "facebook", ...fbResult });
  }

  // 2. Publica no Instagram (exige imagem)
  if (platform === "instagram" || platform === "both") {
    if (!absoluteImageUrl) {
      results.push({
        platform: "instagram",
        success: false,
        error: "Instagram exige pelo menos uma imagem. Adicione mídia ao post.",
      });
    } else {
      const igResult = await publishToInstagram(
        igUser!.id!,
        pageInfo.access_token!,
        message,
        absoluteImageUrl,
      );
      results.push({ platform: "instagram", ...igResult });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;

  // Atualiza status do post se ambas publicaram
  if (successCount > 0) {
    await prisma.promotionPost.update({
      where: { id: body.postId },
      data: {
        status: "published",
        publishedAt: new Date(),
      },
    });
  }

  return NextResponse.json({
    ok: failureCount === 0,
    results,
    successCount,
    failureCount,
  });
}
