import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { z } from "zod";

// PATCH /api/admin/promotion/campaigns/:id — atualiza campanha
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as {
    name?: string;
    description?: string;
    objective?: string;
    startAt?: string;
    endAt?: string;
    timezone?: string;
    status?: string;
    color?: string;
    defaultUtm?: string;
  };

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = sanitizeString(body.name, 100);
  if (body.description !== undefined)
    data.description = sanitizeString(body.description, 500) || null;
  if (body.objective !== undefined)
    data.objective = sanitizeString(body.objective, 200) || null;
  if (body.startAt !== undefined)
    data.startAt = body.startAt ? new Date(body.startAt) : null;
  if (body.endAt !== undefined)
    data.endAt = body.endAt ? new Date(body.endAt) : null;
  if (body.timezone !== undefined) data.timezone = body.timezone;
  if (body.status !== undefined) {
    const validStatuses = [
      "draft",
      "active",
      "paused",
      "completed",
      "archived",
    ];
    if (validStatuses.includes(body.status)) data.status = body.status;
  }
  if (body.color !== undefined) {
    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    if (hexRegex.test(body.color)) data.color = body.color;
  }
  if (body.defaultUtm !== undefined)
    data.defaultUtm = sanitizeString(body.defaultUtm, 500) || null;

  try {
    const campaign = await prisma.campaign.update({
      where: { id },
      data,
    });
    return NextResponse.json({ campaign });
  } catch {
    return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
  }
}

// DELETE /api/admin/promotion/campaigns/:id — remove campanha (cascade posts)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.campaign.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
  }
}
