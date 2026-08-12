import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";

// GET /api/app/score/history — histórico de scores do usuário (para mostrar evolução)
// Query: limit (default 30)
export async function GET(req: Request) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 30), 100);

  const snapshots = await prisma.scoreSnapshot.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Calcula evolução (diferença do primeiro para o último)
  const evolution = snapshots.length >= 2
    ? snapshots[0].score - snapshots[snapshots.length - 1].score
    : 0;

  // Tendência: subindo, estável, descendo
  let trend: "up" | "stable" | "down" = "stable";
  if (snapshots.length >= 3) {
    const recent3 = snapshots.slice(0, 3).map((s) => s.score);
    const avgRecent = recent3.reduce((a, b) => a + b, 0) / 3;
    const older = snapshots.slice(3, 6).map((s) => s.score);
    if (older.length > 0) {
      const avgOlder = older.reduce((a, b) => a + b, 0) / older.length;
      if (avgRecent > avgOlder + 5) trend = "up";
      else if (avgRecent < avgOlder - 5) trend = "down";
    }
  }

  return NextResponse.json({
    snapshots: snapshots.reverse(), // cronológico para gráfico
    evolution,
    trend,
    interpretation: snapshots.length === 0
      ? "Sem histórico ainda. Calcule seu primeiro score."
      : trend === "up"
        ? "Sua consistência está melhorando. Continue assim!"
        : trend === "down"
          ? "Sua consistência diminuiu recentemente. Tente voltar ao ritmo."
          : "Sua consistência está estável. Mantenha o ritmo!",
  });
}
