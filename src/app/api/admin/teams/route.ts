import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { z } from "zod";

// GET /api/admin/teams — lista times
// Query: search, active, limit, offset
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? undefined;
  const active = searchParams.get("active");
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);
  const offset = Number(searchParams.get("offset") ?? 0);

  const where: Record<string, unknown> = {};
  if (active === "true") where.active = true;
  if (active === "false") where.active = false;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
      { managerEmail: { contains: search, mode: "insensitive" } },
    ];
  }

  const [teams, total] = await Promise.all([
    prisma.team.findMany({
      where,
      include: {
        _count: { select: { members: true, invites: true } },
      },
      orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.team.count({ where }),
  ]);

  return NextResponse.json({ teams, total, limit, offset });
}

// POST /api/admin/teams — cria time
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const adminEmail = await getAdminEmail();
  const body = (await req.json()) as {
    name?: string;
    description?: string;
    companyName?: string;
    cnpj?: string;
    managerName?: string;
    managerEmail?: string;
    managerPhone?: string;
    maxMembers?: number;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name é obrigatório" }, { status: 400 });
  }

  const team = await prisma.team.create({
    data: {
      name: sanitizeString(body.name, 100),
      description: sanitizeString(body.description, 500) || null,
      companyName: sanitizeString(body.companyName, 150) || null,
      cnpj: body.cnpj ? body.cnpj.replace(/\D/g, "") : null,
      managerName: sanitizeString(body.managerName, 100) || null,
      managerEmail: sanitizeString(body.managerEmail, 100)?.toLowerCase() || null,
      managerPhone: sanitizeString(body.managerPhone, 30) || null,
      maxMembers: typeof body.maxMembers === "number" && body.maxMembers > 0 ? body.maxMembers : 50,
      createdBy: adminEmail ?? "admin",
    },
    include: { _count: { select: { members: true, invites: true } } },
  });

  return NextResponse.json({ team }, { status: 201 });
}
