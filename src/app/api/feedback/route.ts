import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

// POST /api/feedback
// Recebe feedback do usuário (rating + message), salva no DB.
// Rate limit: 5 feedbacks por IP por hora (anti-spam)
const bodySchema = z.object({
  rating: z.string().max(500).optional(),
  message: z.string().max(500).optional(),
  page: z.string().max(500).optional()
});

// PUBLIC ROUTE — Esta rota é intencionalmente pública (não requer admin auth)
export async function POST(req: NextRequest) {
  // Rate limit
  const limited = await applyRateLimit(req, {
    windowMs: 60 * 60 * 1000, // 1h
    maxRequests: 5,
  });
  if (limited) return limited;

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

  const rating = Number(validatedBody.rating);
  const message = (validatedBody.message ?? "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Avaliação (1-5) é obrigatória" },
      { status: 400 },
    );
  }
  if (!message || message.length < 3) {
    return NextResponse.json(
      { error: "Conta um pouquinho mais pra gente (mín 3 caracteres)" },
      { status: 400 },
    );
  }
  if (message.length > 1000) {
    return NextResponse.json(
      { error: "Mensagem muito longa (máx 1000 caracteres)" },
      { status: 400 },
    );
  }

  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;
  const page = validatedBody.page?.slice(0, 50) ?? null;

  const feedback = await prisma.feedback.create({
    data: {
      rating,
      message,
      page,
      userAgent,
    },
  });

  // Busca mensagem de agradecimento configurada pelo admin
  let thankYouMessage =
    "Valeu pelo feedback! 🙏 Seu depoimento ajuda muito a gente a melhorar o MeuCorre pra todo mundo. Bora correr atrás! 🏍️⚡";
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "feedbackThankYouMessage" },
    });
    if (setting?.value) thankYouMessage = setting.value;
  } catch {
    // usa mensagem padrão
  }

  return NextResponse.json({ ok: true, id: feedback.id, thankYouMessage });
}
