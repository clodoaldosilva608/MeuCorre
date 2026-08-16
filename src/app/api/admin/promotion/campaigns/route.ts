import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { z } from "zod";

// GET /api/admin/promotion/campaigns — lista campanhas
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const campaigns = await prisma.campaign.findMany({
    include: {
      _count: { select: { posts: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ campaigns });
}

// POST /api/admin/promotion/campaigns — cria campanha
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

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

  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: "Nome da campanha é obrigatório" },
      { status: 400 },
    );
  }

  const validStatuses = ["draft", "active", "paused", "completed", "archived"];
  const status = validStatuses.includes(body.status ?? "")
    ? body.status!
    : "draft";

  const hexRegex = /^#[0-9a-fA-F]{6}$/;
  const color = hexRegex.test(body.color ?? "") ? body.color : "#10b981";

  const campaign = await prisma.campaign.create({
    data: {
      name: sanitizeString(body.name, 100),
      description: sanitizeString(body.description, 500) || null,
      objective: sanitizeString(body.objective, 200) || null,
      startAt: body.startAt ? new Date(body.startAt) : null,
      endAt: body.endAt ? new Date(body.endAt) : null,
      timezone: body.timezone || "America/Sao_Paulo",
      status,
      color,
      defaultUtm: sanitizeString(body.defaultUtm, 500) || null,
    },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
