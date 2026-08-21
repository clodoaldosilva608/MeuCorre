import { NextRequest, NextResponse } from "next/server";
import { prisma, prismaRead } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import crypto from "crypto";
import { z } from "zod";

// GET /api/admin/subscriptions — lista compras com paginação cursor-based
//
// SEGURANÇA/PERFORMANCE (P1-2 + P3-3):
// - Paginação cursor-based (limit 10-100 + cursor + hasMore)
// - P3-3: usa prismaRead (read replica) para leituras admin
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // pending | approved | rejected | all
  const cursor = searchParams.get("cursor");
  const limitParam = parseInt(searchParams.get("limit") ?? "50", 10);
  const limit = Math.min(Math.max(limitParam || 50, 10), 100);

  const where = status && status !== "all" ? { status } : {};

  // P3-3: usa prismaRead (read replica)
  const subs = await prismaRead.subscription.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = subs.length > limit;
  const items = hasMore ? subs.slice(0, limit) : subs;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({
    subscriptions: items,
    nextCursor,
    hasMore,
    limit,
  });
}

// POST /api/admin/subscriptions — aprovar/rejeitar uma compra
// Body: { id, action: "approve" | "reject", reviewNotes? }
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as {
    id: string;
    action: "approve" | "reject";
    reviewNotes?: string;
  };

  if (!body.id || !body.action) {
    return NextResponse.json({ error: "id e action obrigatórios" }, { status: 400 });
  }

  const sub = await prisma.subscription.findUnique({ where: { id: body.id } });
  if (!sub) {
    return NextResponse.json({ error: "Compra não encontrata" }, { status: 404 });
  }

  if (body.action === "approve") {
    // Gera licença única (32 chars hex)
    const licenseKey = crypto.randomBytes(16).toString("hex");
    const updated = await prisma.subscription.update({
      where: { id: body.id },
      data: {
        status: "approved",
        reviewedAt: new Date(),
        reviewNotes: body.reviewNotes || null,
        licenseKey,
      },
    });
    return NextResponse.json({ subscription: updated, licenseKey });
  } else {
    const updated = await prisma.subscription.update({
      where: { id: body.id },
      data: {
        status: "rejected",
        reviewedAt: new Date(),
        reviewNotes: body.reviewNotes || null,
      },
    });
    return NextResponse.json({ subscription: updated });
  }
}
