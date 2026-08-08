import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/feedback
// Recebe feedback do usuário (rating + message), salva no DB.
export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    rating?: number;
    message?: string;
    page?: string;
  };

  const rating = Number(body.rating);
  const message = (body.message ?? "").trim();

  if (!rating || rating < 1 || rating > 5) {
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

  const userAgent = req.headers.get("user-agent") ?? null;

  const feedback = await prisma.feedback.create({
    data: {
      rating,
      message: message.slice(0, 1000),
      page: body.page ?? null,
      userAgent,
    },
  });

  return NextResponse.json({ ok: true, id: feedback.id });
}
