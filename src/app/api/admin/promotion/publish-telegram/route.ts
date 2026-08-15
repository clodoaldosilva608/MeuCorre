import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// ===== Publicação automática no Telegram =====
//
// POST /api/admin/promotion/publish-telegram
// Body: {
//   postId: string,           // ID do post a publicar
//   groupIds?: string[],      // IDs dos SocialGroups (Telegram) — se omitido, publica em todos ativos
//   chatIds?: string[],       // Chat IDs diretos (alternativa a groupIds)
//   text?: string,            // Texto customizado (opcional — usa post.title+description se omitido)
//   imageUrl?: string,        // URL da imagem (opcional — usa post.asset.publicUrl se omitido)
//   disableNotification?: boolean,
// }
//
// Retorna: {
//   ok: boolean,
//   results: Array<{ chatId, success, messageId?, error? }>,
//   successCount: number,
//   failureCount: number,
// }

const TOKEN_KEY = "telegram_bot_token";

interface TelegramResponse {
  ok: boolean;
  result?: { message_id: number };
  description?: string;
  error_code?: number;
}

async function getBotToken(): Promise<string | null> {
  const setting = await prisma.setting.findUnique({
    where: { key: TOKEN_KEY },
  });
  return setting?.value ?? null;
}

function buildMessageText(
  post: {
    title: string;
    description: string;
    hashtags: string | null;
    engagementText: string | null;
    cta: string | null;
    destinationUrl: string | null;
  },
  customText?: string,
): string {
  // Se texto customizado fornecido, escapa caracteres especiais do MarkdownV2
  // (senão o Telegram rejeita com "can't parse entities")
  if (customText) return escapeMarkdown(customText);

  const parts: string[] = [];
  parts.push(`*${escapeMarkdown(post.title)}*`);
  parts.push("");
  parts.push(escapeMarkdown(post.description));

  if (post.hashtags) {
    parts.push("");
    // Hashtags também precisam escape (o # é reservado no MarkdownV2)
    parts.push(escapeMarkdown(post.hashtags));
  }

  if (post.engagementText) {
    parts.push("");
    parts.push(escapeMarkdown(post.engagementText));
  }

  if (post.cta) {
    parts.push("");
    parts.push(`*${escapeMarkdown(post.cta)}*`);
  }

  if (post.destinationUrl) {
    parts.push("");
    // URL como link Markdown: [texto](url) — o texto precisa escape, a URL não
    parts.push(`[${escapeMarkdown(post.destinationUrl)}](${post.destinationUrl})`);
  }

  return parts.join("\n");
}

function escapeMarkdown(text: string): string {
  // Escape caracteres especiais do Markdown V2
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

// Extrai o chat_id de um inviteUrl do Telegram
// Formatos suportados:
// - https://t.me/c/1234567890/123 (supergrupo)
// - https://t.me/+abc123 (link de convite — bot precisa ser admin do grupo)
// - -1001234567890 (chat ID numérico direto)
//
// Para links de convite privado (t.me/+hash), o chat_id NÃO pode ser extraído
// da URL. Nesse caso, tentamos ler do campo `notes` do grupo (formato:
// "chat_id=-1001234567890") ou do campo `inviteUrl` se for um ID numérico.
function extractChatId(inviteUrl: string, notes?: string | null): string | null {
  // Chat ID numérico direto
  if (/^-?\d+$/.test(inviteUrl)) return inviteUrl;

  // Supergrupo: https://t.me/c/1234567890/123
  const superGroupMatch = inviteUrl.match(/t\.me\/c\/(\d+)/);
  if (superGroupMatch) {
    return `-100${superGroupMatch[1]}`;
  }

  // Link de convite privado (t.me/+hash): tenta extrair chat_id das notes
  // Formato esperado nas notes: "chat_id=-1001234567890"
  if (notes) {
    const notesMatch = notes.match(/chat_id=(-?\d+)/);
    if (notesMatch) {
      return notesMatch[1];
    }
  }

  // Link de convite (não dá pra enviar direto — bot precisa ser membro)
  // Retorna null — bot deve ser adicionado ao grupo manualmente
  return null;
}

async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
  imageUrl?: string,
  disableNotification = false,
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const baseParams = new URLSearchParams({
    chat_id: chatId,
    disable_notification: String(disableNotification),
  });

  try {
    let res: Response;

    if (imageUrl) {
      // Envia foto com legenda
      const formData = new FormData();
      formData.append("chat_id", chatId);
      formData.append("photo", imageUrl);
      formData.append("caption", text);
      formData.append("parse_mode", "MarkdownV2");
      formData.append("disable_notification", String(disableNotification));

      res = await fetch(
        `https://api.telegram.org/bot${botToken}/sendPhoto`,
        { method: "POST", body: formData },
      );
    } else {
      // Envia só texto
      res = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage?${new URLSearchParams({
          chat_id: chatId,
          text,
          parse_mode: "MarkdownV2",
          disable_web_page_preview: "true",
          disable_notification: String(disableNotification),
        })}`,
        { method: "POST" },
      );
    }

    const data: TelegramResponse = await res.json();

    if (data.ok && data.result?.message_id) {
      return { success: true, messageId: data.result.message_id };
    }

    return {
      success: false,
      error: data.description || `HTTP ${res.status}`,
    };
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
    groupIds?: string[];
    chatIds?: string[];
    text?: string;
    imageUrl?: string;
    disableNotification?: boolean;
  };

  if (!body.postId) {
    return NextResponse.json({ error: "postId é obrigatório" }, { status: 400 });
  }

  // Carrega bot token
  const botToken = await getBotToken();
  if (!botToken) {
    return NextResponse.json(
      {
        error: "Bot do Telegram não configurado. Configure via POST /api/admin/promotion/telegram-config",
        needsConfig: true,
      },
      { status: 403 },
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

  // Constrói o texto da mensagem
  const messageText = buildMessageText(post, body.text);

  // Imagem: usa a fornecida ou a do post
  const imageUrl = body.imageUrl || post.asset?.publicUrl || undefined;

  // Determina os destinos (chat IDs)
  let targets: Array<{ chatId: string; groupId?: string; groupName?: string }> = [];

  // chatIds diretos (se fornecidos)
  if (body.chatIds && body.chatIds.length > 0) {
    targets = body.chatIds.map((chatId) => ({ chatId }));
  }

  // groupIds (SocialGroups do Telegram)
  if (body.groupIds && body.groupIds.length > 0) {
    const groups = await prisma.socialGroup.findMany({
      where: {
        id: { in: body.groupIds },
        platform: "telegram",
        active: true,
      },
    });
    for (const g of groups) {
      const chatId = extractChatId(g.inviteUrl, g.notes);
      if (chatId) {
        targets.push({ chatId, groupId: g.id, groupName: g.name });
      }
    }
  }

  // Se nenhum destino fornecido, publica em TODOS os grupos ativos do Telegram
  if (targets.length === 0) {
    const allTelegramGroups = await prisma.socialGroup.findMany({
      where: { platform: "telegram", active: true },
    });
    for (const g of allTelegramGroups) {
      const chatId = extractChatId(g.inviteUrl, g.notes);
      if (chatId) {
        targets.push({ chatId, groupId: g.id, groupName: g.name });
      }
    }
  }

  if (targets.length === 0) {
    return NextResponse.json(
      {
        error: "Nenhum grupo/chat do Telegram encontrado. Cadastre grupos com chat_id ou link t.me/c/... no módulo Grupos.",
        hint: "O bot precisa ser adicionado ao grupo como administrador para enviar mensagens.",
      },
      { status: 400 },
    );
  }

  // Envia pra todos os destinos (com 1s de delay pra não estourar rate limit)
  const results: Array<{
    chatId: string;
    groupName?: string;
    success: boolean;
    messageId?: number;
    error?: string;
  }> = [];

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];

    // Delay entre envios (exceto o primeiro)
    if (i > 0) {
      await new Promise((r) => setTimeout(r, 1000));
    }

    const result = await sendTelegramMessage(
      botToken,
      target.chatId,
      messageText,
      imageUrl,
      body.disableNotification,
    );

    results.push({
      chatId: target.chatId,
      groupName: target.groupName,
      ...result,
    });

    // Atualiza lastPostedAt do grupo se deu certo
    if (result.success && target.groupId) {
      await prisma.socialGroup.update({
        where: { id: target.groupId },
        data: { lastPostedAt: new Date() },
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.length - successCount;

  return NextResponse.json({
    ok: failureCount === 0,
    results,
    successCount,
    failureCount,
    totalTargets: targets.length,
  });
}
