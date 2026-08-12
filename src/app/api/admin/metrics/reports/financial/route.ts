import { NextRequest, NextResponse } from "next/server";
import { prismaRead } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/admin/metrics/reports/financial — exportação CSV financeiro (assinaturas)
// Query: status, paymentMethod, format (csv|json), startDate, endDate
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const paymentMethod = searchParams.get("paymentMethod") ?? undefined;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const format = searchParams.get("format") ?? "csv";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (paymentMethod) where.paymentMethod = paymentMethod;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
  }

  const subscriptions = await prismaRead.subscription.findMany({
    where,
    select: {
      id: true,
      buyerName: true,
      buyerEmail: true,
      buyerPhone: true,
      buyerCity: true,
      amount: true,
      paymentMethod: true,
      status: true,
      plan: true,
      licenseKey: true,
      kiwifyOrderId: true,
      reviewedAt: true,
      reviewedBy: true,
      reviewNotes: true,
      activatedAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  if (format === "json") {
    return NextResponse.json({ subscriptions, total: subscriptions.length });
  }

  const headers = [
    "id", "buyerName", "buyerEmail", "buyerPhone", "buyerCity",
    "amount", "paymentMethod", "status", "plan", "licenseKey",
    "kiwifyOrderId", "reviewedAt", "reviewedBy", "activatedAt", "createdAt",
  ];

  const rows = subscriptions.map((s) => [
    s.id,
    csvEscape(s.buyerName),
    csvEscape(s.buyerEmail),
    csvEscape(s.buyerPhone ?? ""),
    csvEscape(s.buyerCity ?? ""),
    Number(s.amount).toFixed(2),
    csvEscape(s.paymentMethod),
    csvEscape(s.status),
    csvEscape(s.plan ?? ""),
    csvEscape(s.licenseKey ?? ""),
    csvEscape(s.kiwifyOrderId ?? ""),
    s.reviewedAt?.toISOString() ?? "",
    csvEscape(s.reviewedBy ?? ""),
    s.activatedAt?.toISOString() ?? "",
    s.createdAt.toISOString(),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const filename = `financeiro-${new Date().toISOString().slice(0, 10)}.csv`;

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
