import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// POST /api/admin/partner-campaigns/:id/metrics
// Incrementa counters de métricas. Body: { event: "view" | "click" | "lead" | "redemption" }
// Usado para registrar interações do usuário com a campanha.
//
// Endpoint admin — para uso interno. O app do entregador usa o endpoint público
// /api/public/campaigns/:id/track para registrar views e cliques.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { event?: string };

  const validEvents = new Set(["view", "click", "lead", "redemption"]);
  if (!validEvents.has(body.event ?? "")) {
    return NextResponse.json(
      { error: `event inválido. Válidos: ${Array.from(validEvents).join(", ")}` },
      { status: 400 },
    );
  }

  const campaign = await prisma.partnerCampaign.findUnique({ where: { id } });
  if (!campaign) {
    return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
  }

  // Incrementa o counter correspondente
  const fieldMap: Record<string, "views" | "clicks" | "leads" | "redemptions"> = {
    view: "views",
    click: "clicks",
    lead: "leads",
    redemption: "redemptions",
  };
  const field = fieldMap[body.event!];

  const updated = await prisma.partnerCampaign.update({
    where: { id },
    data: { [field]: { increment: 1 } },
    select: {
      id: true,
      views: true,
      clicks: true,
      leads: true,
      redemptions: true,
    },
  });

  return NextResponse.json({ campaign: updated, event: body.event });
}

// GET /api/admin/partner-campaigns/:id/metrics — retorna métricas atuais
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const campaign = await prisma.partnerCampaign.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      status: true,
      views: true,
      clicks: true,
      leads: true,
      redemptions: true,
      reportsCount: true,
      publishedAt: true,
      startsAt: true,
      endsAt: true,
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
  }

  // Calcula CTR (click-through rate)
  const ctr = campaign.views > 0 ? (campaign.clicks / campaign.views) * 100 : 0;
  const conversionRate = campaign.clicks > 0 ? (campaign.leads / campaign.clicks) * 100 : 0;

  return NextResponse.json({
    campaign,
    derived: {
      ctr: Number(ctr.toFixed(2)),
      conversionRate: Number(conversionRate.toFixed(2)),
      daysActive: campaign.publishedAt
        ? Math.floor((Date.now() - new Date(campaign.publishedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    },
  });
}
