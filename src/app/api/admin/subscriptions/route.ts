import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import crypto from "crypto";
import { z } from "zod";

// GET /api/admin/subscriptions — lista todas as compras
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // pending | approved | rejected | all

  const where = status && status !== "all" ? { status } : {};
  const subs = await prisma.subscription.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ subscriptions: subs });
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
