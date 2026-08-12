import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// PATCH /api/admin/partner-portal/tokens/:id
// Atualiza permissões, vigência ou status ativo
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;

  const data: Record<string, unknown> = {};
  if (body.canViewCampaigns !== undefined) data.canViewCampaigns = Boolean(body.canViewCampaigns);
  if (body.canViewMetrics !== undefined) data.canViewMetrics = Boolean(body.canViewMetrics);
  if (body.canViewProposals !== undefined) data.canViewProposals = Boolean(body.canViewProposals);
  if (body.expiresAt !== undefined) {
    data.expiresAt = body.expiresAt ? new Date(body.expiresAt as string) : null;
  }
  if (body.active !== undefined) data.active = Boolean(body.active);

  try {
    const token = await prisma.partnerPortalToken.update({
      where: { id },
      data,
    });
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Token não encontrado" }, { status: 404 });
  }
}

// DELETE /api/admin/partner-portal/tokens/:id (revoga — active=false)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const token = await prisma.partnerPortalToken.update({
      where: { id },
      data: { active: false },
    });
    return NextResponse.json({ ok: true, token });
  } catch {
    return NextResponse.json({ error: "Token não encontrado" }, { status: 404 });
  }
}
