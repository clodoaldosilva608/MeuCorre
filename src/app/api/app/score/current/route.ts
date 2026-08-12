import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";

// GET /api/app/score/current — retorna o score mais recente do usuário
export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const latest = await prisma.scoreSnapshot.findFirst({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) {
    return NextResponse.json({
      score: null,
      message: "Score ainda não calculado. Use POST /api/app/score/calculate para gerar.",
    });
  }

  return NextResponse.json({
    score: latest,
    interpretation: interpretScore(latest.score),
  });
}

// Interpretação NÃO JULGA — mostra evolução, não compara com outros
function interpretScore(score: number): string {
  if (score >= 80) return "Excelente consistência! Você está mantendo bons hábitos de registro.";
  if (score >= 60) return "Boa consistência. Continue registrando suas corridas e despesas regularmente.";
  if (score >= 40) return "Consistência moderada. Tente lançar seus dados com mais frequência.";
  if (score >= 20) return "Consistência baixa. Que tal definir um lembrete diário para registrar?";
  return "Você está começando. Cada registro conta — comece com pequenos hábitos diários.";
}
