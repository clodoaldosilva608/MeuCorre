import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/admin/sponsors — lista todos
// POST /api/admin/sponsors — cria novo

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const sponsors = await prisma.sponsor.findMany({
      orderBy: [{ active: "desc" }, { sortOrder: "asc" }],
    });
    return NextResponse.json({ sponsors });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao carregar", details: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  try {
    const sponsor = await prisma.sponsor.create({ data: body });
    return NextResponse.json({ sponsor }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao criar", details: String(err) }, { status: 500 });
  }
}
