import { NextRequest, NextResponse } from "next/server";
import { prismaRead } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/admin/metrics/reports/partners — exportação CSV de parceiros
// Query: stage, status, city, state, category, format (csv|json)
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const city = searchParams.get("city") ?? undefined;
  const state = searchParams.get("state") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const format = searchParams.get("format") ?? "csv";

  const where: Record<string, unknown> = {};
  if (stage) where.stage = stage;
  if (status) where.status = status;
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (state) where.state = state.toUpperCase();
  if (category) where.category = category;

  const partners = await prismaRead.partner.findMany({
    where,
    include: {
      _count: { select: { contacts: true, opportunities: true, activities: true } },
    },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    take: 5000,
  });

  if (format === "json") {
    return NextResponse.json({ partners, total: partners.length });
  }

  // CSV
  const headers = [
    "id", "companyName", "tradeName", "cnpj", "category", "origin",
    "city", "state", "phone", "email", "assignedTo", "priority",
    "status", "stage", "potentialValue", "contactsCount", "opportunitiesCount",
    "activitiesCount", "createdAt", "updatedAt",
  ];

  const rows = partners.map((p) => [
    p.id,
    csvEscape(p.companyName),
    csvEscape(p.tradeName ?? ""),
    csvEscape(p.cnpj ?? ""),
    csvEscape(p.category ?? ""),
    csvEscape(p.origin ?? ""),
    csvEscape(p.city ?? ""),
    csvEscape(p.state ?? ""),
    csvEscape(p.phone ?? ""),
    csvEscape(p.email ?? ""),
    csvEscape(p.assignedTo ?? ""),
    csvEscape(p.priority),
    csvEscape(p.status),
    csvEscape(p.stage),
    p.potentialValue ? Number(p.potentialValue).toFixed(2) : "",
    p._count.contacts,
    p._count.opportunities,
    p._count.activities,
    p.createdAt.toISOString(),
    p.updatedAt.toISOString(),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const filename = `parceiros-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse("\ufeff" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function csvEscape(value: string): string {
  if (!value) return "";
  // Se contém vírgula, aspa ou newline, envolve em aspas duplas
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
