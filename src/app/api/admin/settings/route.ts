import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/admin/settings — lista todas configurações
// POST /api/admin/settings — atualiza uma configuração
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const settings = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;

  return NextResponse.json({
    settings: {
      feedbackThankYouMessage:
        map.feedbackThankYouMessage ??
        "Valeu pelo feedback! 🙏 Seu depoimento ajuda muito a gente a melhorar o MeuCorre pra todo mundo. Bora correr atrás! 🏍️⚡",
    },
  });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: { key?: string; value?: string };
  try {
    body = (await req.json()) as { key?: string; value?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.key || body.value === undefined) {
    return NextResponse.json({ error: "key e value são obrigatórios" }, { status: 400 });
  }

  // Whitelist de chaves permitidas
  const allowedKeys = ["feedbackThankYouMessage"];
  if (!allowedKeys.includes(body.key)) {
    return NextResponse.json({ error: "Chave não permitida" }, { status: 400 });
  }

  const value = body.value.trim().slice(0, 1000);

  const setting = await prisma.setting.upsert({
    where: { key: body.key },
    create: { key: body.key, value },
    update: { value },
  });

  return NextResponse.json({ ok: true, setting });
}
