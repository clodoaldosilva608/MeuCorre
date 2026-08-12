import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { randomBytes } from "node:crypto";

// GET /api/admin/partner-portal/tokens — lista tokens de portal
// Query: partnerId, active
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const partnerId = searchParams.get("partnerId") ?? undefined;
  const active = searchParams.get("active");

  const where: Record<string, unknown> = {};
  if (partnerId) where.partnerId = partnerId;
  if (active === "true") where.active = true;
  if (active === "false") where.active = false;

  const tokens = await prisma.partnerPortalToken.findMany({
    where,
    include: {
      partner: { select: { id: true, companyName: true, city: true, state: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tokens });
}

// POST /api/admin/partner-portal/tokens — cria token para um parceiro
// Body: { partnerId, canViewCampaigns?, canViewMetrics?, canViewProposals?, expiresAt? }
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const adminEmail = await getAdminEmail();
  const body = (await req.json()) as {
    partnerId?: string;
    canViewCampaigns?: boolean;
    canViewMetrics?: boolean;
    canViewProposals?: boolean;
    expiresAt?: string;
  };

  if (!body.partnerId) {
    return NextResponse.json({ error: "partnerId é obrigatório" }, { status: 400 });
  }

  const partner = await prisma.partner.findUnique({ where: { id: body.partnerId } });
  if (!partner) {
    return NextResponse.json({ error: "Parceiro não encontrado" }, { status: 404 });
  }

  const token = randomBytes(16).toString("hex");

  const portalToken = await prisma.partnerPortalToken.create({
    data: {
      partnerId: body.partnerId,
      token,
      canViewCampaigns: body.canViewCampaigns ?? true,
      canViewMetrics: body.canViewMetrics ?? true,
      canViewProposals: body.canViewProposals ?? false,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      active: true,
      createdBy: adminEmail ?? "admin",
    },
    include: {
      partner: { select: { id: true, companyName: true } },
    },
  });

  return NextResponse.json({
    token: portalToken,
    portalUrl: `/portal/${token}`,
  }, { status: 201 });
}
