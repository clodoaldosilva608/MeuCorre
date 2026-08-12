import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";

// GET /api/admin/outbound/logs — lista logs
// Query: partnerId, contactId, templateId, status, channel, classification, search, limit, offset
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const partnerId = searchParams.get("partnerId") ?? undefined;
  const contactId = searchParams.get("contactId") ?? undefined;
  const templateId = searchParams.get("templateId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const channel = searchParams.get("channel") ?? undefined;
  const classification = searchParams.get("classification") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);
  const offset = Number(searchParams.get("offset") ?? 0);

  const where: Record<string, unknown> = {};
  if (partnerId) where.partnerId = partnerId;
  if (contactId) where.contactId = contactId;
  if (templateId) where.templateId = templateId;
  if (status) where.status = status;
  if (channel) where.channel = channel;
  if (classification) where.responseClassification = classification;
  if (search) {
    where.OR = [
      { renderedBody: { contains: search, mode: "insensitive" } },
      { responseText: { contains: search, mode: "insensitive" } },
      { partner: { companyName: { contains: search, mode: "insensitive" } } },
      { contact: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [logs, total, stats] = await Promise.all([
    prisma.outboundLog.findMany({
      where,
      include: {
        partner: { select: { id: true, companyName: true, city: true, state: true } },
        contact: { select: { id: true, name: true, email: true, phone: true, optOut: true } },
        template: { select: { id: true, name: true, channel: true, objective: true } },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.outboundLog.count({ where }),
    prisma.outboundLog.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  return NextResponse.json({
    logs,
    total,
    byStatus: stats,
    limit,
    offset,
  });
}
