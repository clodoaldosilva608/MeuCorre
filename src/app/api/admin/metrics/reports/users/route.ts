import { NextRequest, NextResponse } from "next/server";
import { prismaRead } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/admin/metrics/reports/users — exportação CSV de usuários
// Query: isPro, subscriptionStatus, format (csv|json)
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isPro = searchParams.get("isPro");
  const subscriptionStatus = searchParams.get("subscriptionStatus") ?? undefined;
  const format = searchParams.get("format") ?? "csv";

  const where: Record<string, unknown> = {};
  if (isPro === "true") where.isPro = true;
  if (isPro === "false") where.isPro = false;
  if (subscriptionStatus) where.subscriptionStatus = subscriptionStatus;

  const users = await prismaRead.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      isPro: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
      active: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  if (format === "json") {
    return NextResponse.json({ users, total: users.length });
  }

  const headers = [
    "id", "name", "email", "phone", "city", "isPro",
    "subscriptionPlan", "subscriptionStatus", "subscriptionExpiresAt",
    "active", "lastLoginAt", "createdAt",
  ];

  const rows = users.map((u) => [
    u.id,
    csvEscape(u.name),
    csvEscape(u.email),
    csvEscape(u.phone ?? ""),
    csvEscape(u.city ?? ""),
    u.isPro ? "true" : "false",
    csvEscape(u.subscriptionPlan ?? ""),
    csvEscape(u.subscriptionStatus ?? ""),
    u.subscriptionExpiresAt?.toISOString() ?? "",
    u.active ? "true" : "false",
    u.lastLoginAt?.toISOString() ?? "",
    u.createdAt.toISOString(),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const filename = `usuarios-${new Date().toISOString().slice(0, 10)}.csv`;

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
