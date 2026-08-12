import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";

const VALID_ROLES = new Set(["owner", "admin", "member"]);
const VALID_STATUSES = new Set(["active", "suspended", "removed"]);

// GET /api/admin/teams/:id/members — lista membros
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const members = await prisma.teamMember.findMany({
    where: { teamId: id },
    orderBy: [{ role: "asc" }, { joinedAt: "desc" }],
  });

  return NextResponse.json({ members });
}

// POST /api/admin/teams/:id/members — adiciona membro diretamente (sem convite)
// Útil para admin adicionar membros manualmente
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    userId?: string;
  };

  if (!body.name?.trim() || !body.email?.trim()) {
    return NextResponse.json(
      { error: "name e email são obrigatórios" },
      { status: 400 },
    );
  }

  const role = VALID_ROLES.has(body.role ?? "") ? body.role! : "member";

  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) {
    return NextResponse.json({ error: "Time não encontrado" }, { status: 404 });
  }

  // Verifica limite
  const memberCount = await prisma.teamMember.count({
    where: { teamId: id, status: "active" },
  });
  if (memberCount >= team.maxMembers) {
    return NextResponse.json(
      { error: `Limite de membros atingido (${team.maxMembers})` },
      { status: 400 },
    );
  }

  // Verifica duplicação
  const existing = await prisma.teamMember.findUnique({
    where: { teamId_email: { teamId: id, email: body.email.toLowerCase() } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Este email já é membro do time" },
      { status: 409 },
    );
  }

  const member = await prisma.teamMember.create({
    data: {
      teamId: id,
      userId: body.userId || null,
      name: sanitizeString(body.name, 100),
      email: body.email.toLowerCase(),
      phone: sanitizeString(body.phone ?? "", 30) || null,
      role,
      status: "active",
    },
  });

  return NextResponse.json({ member }, { status: 201 });
}
