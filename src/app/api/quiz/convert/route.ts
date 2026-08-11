import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeString } from "@/lib/validation";

// ===== Marca Lead como convertido =====
//
// Chamado quando um Lead cria conta no /app.
// Atualiza convertedAt e convertedUserId no registro do Lead.
// Não bloqueia o fluxo de registro se falhar (best-effort).

export async function POST(req: NextRequest) {
  let body: { email?: string; userId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email = sanitizeString(body.email?.toLowerCase().trim() ?? "", 200);
  if (!email) {
    return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
  }

  try {
    // Busca o User pelo email para pegar o ID
    const user = body.userId
      ? { id: body.userId }
      : await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });

    if (!user) {
      // Lead pode não existir ainda (se veio direto do registro sem quiz)
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Atualiza o Lead com convertedAt e convertedUserId
    await prisma.lead.updateMany({
      where: { email },
      data: {
        convertedAt: new Date(),
        convertedUserId: user.id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[quiz/convert] Erro:", error);
    // Não retorna erro — best-effort
    return NextResponse.json({ ok: true, error: "best-effort" });
  }
}
