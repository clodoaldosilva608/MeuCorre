import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { generateICS } from "../posts/[id]/ics/route";

// GET /api/admin/promotion/calendar.ics?campaignId=...&status=...
// Gera ICS com todas as postagens (opcionalmente filtradas)
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaignId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const platform = searchParams.get("platform") ?? undefined;

  const where: Record<string, unknown> = {};
  if (campaignId) where.campaignId = campaignId;
  if (status) where.status = status;
  if (platform) where.platform = platform;

  const posts = await prisma.promotionPost.findMany({
    where,
    include: { campaign: true },
    orderBy: [{ editorialDay: "asc" }, { sequenceNumber: "asc" }],
    take: 1000,
  });

  if (posts.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma postagem encontrada com os filtros informados" },
      { status: 404 },
    );
  }

  const ics = generateICS(posts);
  const filename = `meucorre-calendario-${posts.length}posts.ics`;

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
