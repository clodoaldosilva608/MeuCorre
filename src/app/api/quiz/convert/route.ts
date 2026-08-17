import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeString } from "@/lib/validation";
import { applyRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

// ===== Marca Lead como convertido =====
//
// Chamado quando um Lead cria conta no /app.
// Atualiza convertedAt e convertedUserId no registro do Lead.
// Não bloqueia o fluxo de registro se falhar (best-effort).

const bodySchema = z.object({
  email: z.string().max(500).optional(),
  userId: z.string().max(500).optional()
});

// PUBLIC ROUTE — Esta rota é intencionalmente pública (não requer admin auth)
export async function POST(req: NextRequest) {
  // Rate limiting: 10 conversões por IP por hora
  const limited = await applyRateLimit(req, { windowMs: 60 * 60 * 1000, maxRequests: 10 });
  if (limited) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente mais tarde." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }
  const validatedBody = parsed.data;

  const email = sanitizeString(validatedBody.email?.toLowerCase().trim() ?? "", 200);
  if (!email) {
    return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
  }

  try {
    // Busca o User pelo email para pegar o ID
    const user = validatedBody.userId
      ? { id: validatedBody.userId }
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
    console.error("[quiz/convert] Erro interno");
    // Não retorna erro — best-effort
    return NextResponse.json({ ok: true, error: "best-effort" });
  }
}
