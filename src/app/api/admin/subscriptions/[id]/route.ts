import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// DELETE /api/admin/subscriptions/[id] — exclui uma assinatura
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await prisma.subscription.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Assinatura não encontrada" },
      { status: 404 },
    );
  }
}

// PATCH /api/admin/subscriptions/[id] — edita status/amount/notes
// Body: { status?, amount?, reviewNotes? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;

  let body: {
    status?: string;
    amount?: number;
    reviewNotes?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.status !== undefined) {
    const valid = ["pending", "approved", "rejected"];
    if (!valid.includes(body.status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }
    data.status = body.status;
    data.reviewedAt = new Date();
  }

  if (body.amount !== undefined) {
    const amount = Number(body.amount);
    if (isNaN(amount) || amount < 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }
    data.amount = amount;
  }

  if (body.reviewNotes !== undefined) {
    data.reviewNotes = body.reviewNotes.trim().slice(0, 500) || null;
  }

  try {
    const sub = await prisma.subscription.update({ where: { id }, data });
    return NextResponse.json({ subscription: sub });
  } catch {
    return NextResponse.json(
      { error: "Assinatura não encontrada" },
      { status: 404 },
    );
  }
}
