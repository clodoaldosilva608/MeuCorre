import { NextRequest, NextResponse } from "next/server";
import { prismaRead } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/admin/metrics/reports/campaigns — exportação CSV de campanhas de parceiros
// Query: status, partnerId, format (csv|json)
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const partnerId = searchParams.get("partnerId") ?? undefined;
  const format = searchParams.get("format") ?? "csv";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (partnerId) where.partnerId = partnerId;

  const campaigns = await prismaRead.partnerCampaign.findMany({
    where,
    include: {
      partner: { select: { companyName: true, city: true, state: true, category: true } },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: 5000,
  }).catch(() => []);

  if (format === "json") {
    return NextResponse.json({ campaigns, total: campaigns.length });
  }

  const headers = [
    "id", "name", "partnerName", "partnerCity", "partnerState", "category",
    "offerTitle", "couponCode", "discountText", "billingModel",
    "campaignPrice", "leadPrice", "status",
    "views", "clicks", "leads", "redemptions", "reportsCount",
    "startsAt", "endsAt", "publishedAt", "createdAt",
  ];

  const rows = campaigns.map((c) => [
    c.id,
    csvEscape(c.name),
    csvEscape(c.partner?.companyName ?? ""),
    csvEscape(c.partner?.city ?? ""),
    csvEscape(c.partner?.state ?? ""),
    csvEscape(c.partner?.category ?? ""),
    csvEscape(c.offerTitle),
    csvEscape(c.couponCode ?? ""),
    csvEscape(c.discountText ?? ""),
    csvEscape(c.billingModel),
    c.campaignPrice ? Number(c.campaignPrice).toFixed(2) : "",
    c.leadPrice ? Number(c.leadPrice).toFixed(2) : "",
    csvEscape(c.status),
    c.views,
    c.clicks,
    c.leads,
    c.redemptions,
    c.reportsCount,
    c.startsAt.toISOString(),
    c.endsAt?.toISOString() ?? "",
    c.publishedAt?.toISOString() ?? "",
    c.createdAt.toISOString(),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const filename = `campanhas-${new Date().toISOString().slice(0, 10)}.csv`;

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
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
