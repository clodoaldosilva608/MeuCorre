import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

// POST /api/feedback
// Recebe feedback do usuário (rating + message), salva no DB.
// Rate limit: 5 feedbacks por IP por hora (anti-spam)
export async function POST(req: NextRequest) {
  // Rate limit
  const limited = applyRateLimit(req, {
    windowMs: 60 * 60 * 1000, // 1h
    maxRequests: 5,
  });
  if (limited) return limited;

  let body: { rating?: number; message?: string; page?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const rating = Number(body.rating);
  const message = (body.message ?? "").trim();

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
  const page = body.page?.slice(0, 50) ?? null;

  const feedback = await prisma.feedback.create({
    data: {
      rating,
      message,
      page,
      userAgent,
    },
  });

  return NextResponse.json({ ok: true, id: feedback.id });
}
