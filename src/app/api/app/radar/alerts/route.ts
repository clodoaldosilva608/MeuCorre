import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";

// GET /api/app/radar/alerts — lista alertas do usuário logado
// Query: status (active|dismissed|resolved), severity, type
export async function GET(req: Request) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "active";
  const severity = searchParams.get("severity") ?? undefined;
  const type = searchParams.get("type") ?? undefined;

  const where: Record<string, unknown> = {
    userId: session.sub,
  };
  if (status !== "all") where.status = status;
  if (severity) where.severity = severity;
  if (type) where.type = type;

  const alerts = await prisma.radarAlert.findMany({
    where,
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return NextResponse.json({ alerts });
}
