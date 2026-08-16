import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { randomBytes } from "node:crypto";
import { z } from "zod";

const VALID_ROLES = new Set(["owner", "admin", "member"]);

// POST /api/admin/teams/:id/invites
// Cria convite para um email. Gera token único de aceite.
// Body: { email, name?, phone?, role? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const adminEmail = await getAdminEmail();
  const body = (await req.json()) as {
    email?: string;
    name?: string;
    phone?: string;
    role?: string;
  };

  if (!body.email?.trim()) {
    return NextResponse.json({ error: "email é obrigatório" }, { status: 400 });
  }

  // Valida email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const role = VALID_ROLES.has(body.role ?? "") ? body.role! : "member";

  // Verifica se time existe
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) {
    return NextResponse.json({ error: "Time não encontrado" }, { status: 404 });
  }

  if (!team.active) {
    return NextResponse.json({ error: "Time inativo" }, { status: 400 });
  }

  // Verifica limite de membros
  const memberCount = await prisma.teamMember.count({
    where: { teamId: id, status: "active" },
  });
  const pendingInvites = await prisma.teamInvite.count({
    where: { teamId: id, status: "pending" },
  });
  if (memberCount + pendingInvites >= team.maxMembers) {
    return NextResponse.json(
      { error: `Limite de membros atingido (${team.maxMembers}). Membros ativos: ${memberCount}, convites pendentes: ${pendingInvites}.` },
      { status: 400 },
    );
  }

  // Verifica se já é membro
  const existingMember = await prisma.teamMember.findUnique({
    where: { teamId_email: { teamId: id, email: body.email.toLowerCase() } },
  });
  if (existingMember && existingMember.status === "active") {
    return NextResponse.json(
      { error: "Este email já é membro ativo do time" },
      { status: 409 },
    );
  }

  // Verifica se já tem convite pendente
  const existingInvite = await prisma.teamInvite.findFirst({
    where: { teamId: id, email: body.email.toLowerCase(), status: "pending" },
  });
  if (existingInvite) {
    return NextResponse.json(
      { error: "Já existe convite pendente para este email", invite: existingInvite },
      { status: 409 },
    );
  }

  // Gera token único (32 chars hex)
  const token = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

  const invite = await prisma.teamInvite.create({
    data: {
      teamId: id,
      email: body.email.toLowerCase(),
      name: sanitizeString(body.name ?? "", 100) || null,
      phone: sanitizeString(body.phone ?? "", 30) || null,
      token,
      role,
      status: "pending",
      invitedBy: adminEmail ?? "admin",
      expiresAt,
    },
  });

  return NextResponse.json({
    invite,
    inviteUrl: `/equipes/convite/${token}`,
  }, { status: 201 });
}

// GET /api/admin/teams/:id/invites — lista convites do time
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const invites = await prisma.teamInvite.findMany({
    where: { teamId: id },
    orderBy: { invitedAt: "desc" },
  });

  return NextResponse.json({ invites });
}
