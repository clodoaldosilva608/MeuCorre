import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/admin/teams/:id/dashboard — painel agregado do time
// Retorna estatísticas do time (sem expor dados individuais de membros)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) {
    return NextResponse.json({ error: "Time não encontrado" }, { status: 404 });
  }

  const [
    totalMembers,
    activeMembers,
    suspendedMembers,
    pendingInvites,
    membersByRole,
  ] = await Promise.all([
    prisma.teamMember.count({ where: { teamId: id } }),
    prisma.teamMember.count({ where: { teamId: id, status: "active" } }),
    prisma.teamMember.count({ where: { teamId: id, status: "suspended" } }),
    prisma.teamInvite.count({ where: { teamId: id, status: "pending" } }),
    prisma.teamMember.groupBy({
      by: ["role"],
      where: { teamId: id, status: "active" },
      _count: true,
    }),
  ]);

  const byRole: Record<string, number> = {};
  for (const { role, _count } of membersByRole) {
    byRole[role] = _count;
  }

  return NextResponse.json({
    team: {
      id: team.id,
      name: team.name,
      companyName: team.companyName,
      active: team.active,
      maxMembers: team.maxMembers,
    },
    stats: {
      totalMembers,
      activeMembers,
      suspendedMembers,
      pendingInvites,
      byRole,
      capacityUsed: team.maxMembers > 0 ? Math.round((activeMembers / team.maxMembers) * 100) : 0,
    },
  });
}
