import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/admin/partners/:id/logs — lista logs de auditoria do parceiro
// Query: action, limit
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

  const where: Record<string, unknown> = { partnerId: id };
  if (action) where.action = action;

  const logs = await prisma.partnerLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ logs });
}
