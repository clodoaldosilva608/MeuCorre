import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// ===== Configuração do Telegram Bot =====
//
// GET  /api/admin/promotion/telegram-config — status da configuração
// POST /api/admin/promotion/telegram-config — salva bot token e testa
// DELETE /api/admin/promotion/telegram-config — remove config
//
// O bot token é salvo na tabela Setting (key="telegram_bot_token").
// Funciona em serverless (Vercel) sem depender de filesystem.
//
// Como obter um bot token:
// 1. Abra o Telegram e procure @BotFather
// 2. Envie /newbot
// 3. Escolha um nome (ex: "MeuCorre Divulgação")
// 4. Escolha um username (ex: "meucorre_div_bot")
// 5. Copie o token (formato: 123456789:ABCdefGHIjklMNOpqrSTUvwxYZ)

const TOKEN_KEY = "telegram_bot_token";

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const setting = await prisma.setting.findUnique({
    where: { key: TOKEN_KEY },
  });

  if (!setting) {
    return NextResponse.json({
      configured: false,
      message: "Bot token não configurado. Obtenha um token com @BotFather no Telegram.",
    });
  }

  // Testa o bot (getMe) pra verificar se é válido
  try {
    const token = setting.value;
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = await meRes.json();

    if (!meData.ok) {
      return NextResponse.json({
        configured: true,
        valid: false,
        error: meData.description || "Token inválido",
      });
    }

    return NextResponse.json({
      configured: true,
      valid: true,
      botInfo: {
        username: meData.result.username,
        firstName: meData.result.first_name,
        canJoinGroups: meData.result.can_join_groups,
        canReadAllGroupMessages: meData.result.can_read_all_group_messages,
      },
    });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({
      configured: true,
      valid: false,
      error: `Erro ao testar bot: ${err.message}`,
    });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { botToken } = (await req.json()) as { botToken?: string };
  if (!botToken?.trim()) {
    return NextResponse.json({ error: "botToken é obrigatório" }, { status: 400 });
  }

  // Valida o token chamando getMe
  try {
    const meRes = await fetch(
      `https://api.telegram.org/bot${botToken.trim()}/getMe`,
    );
    const meData = await meRes.json();

    if (!meData.ok) {
      return NextResponse.json(
        { error: `Token inválido: ${meData.description || "verifique o token"}` },
        { status: 400 },
      );
    }

    // Salva no banco
    await prisma.setting.upsert({
      where: { key: TOKEN_KEY },
      update: { value: botToken.trim() },
      create: { key: TOKEN_KEY, value: botToken.trim() },
    });

    return NextResponse.json({
      ok: true,
      botInfo: {
        username: meData.result.username,
        firstName: meData.result.first_name,
      },
    });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json(
      { error: `Erro ao validar token: ${err.message}` },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await prisma.setting.deleteMany({ where: { key: TOKEN_KEY } });
  return NextResponse.json({ ok: true });
}
