import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

// POST /api/public/campaigns/:id/track
// Endpoint público (sem admin auth) para registrar interações do usuário com a campanha.
// Body: { event: "view" | "click" }
//
// Rate limiting: 60 eventos por IP por hora (evita inflar métricas).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Rate limiting: 60 eventos por IP por hora
  const limited = await applyRateLimit(req, { windowMs: 60 * 60 * 1000, maxRequests: 60 });
  if (limited) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente mais tarde." },
      { status: 429 },
    );
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { event?: string };

  const validEvents = new Set(["view", "click"]);
  if (!validEvents.has(body.event ?? "")) {
    return NextResponse.json(
      { error: "event deve ser 'view' ou 'click'" },
      { status: 400 },
    );
  }

  const campaign = await prisma.partnerCampaign.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
  }

  if (campaign.status !== "published") {
    return NextResponse.json(
      { error: "Campanha não está publicada" },
      { status: 403 },
    );
  }

  // Incrementa counter
  const field = body.event === "view" ? "views" : "clicks";
  await prisma.partnerCampaign.update({
    where: { id },
    data: { [field]: { increment: 1 } },
  });

  return NextResponse.json({ ok: true, event: body.event });
}

// GET /api/public/campaigns/:id/track — retorna campanha publicada (para exibir no app)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const campaign = await prisma.partnerCampaign.findUnique({
    where: { id },
    select: {
      id: true,
      offerTitle: true,
      offerDescription: true,
      offerCta: true,
      offerUrl: true,
      couponCode: true,
      discountText: true,
      imageUrl: true,
      videoUrl: true,
      category: true,
      city: true,
      state: true,
      proOnly: true,
      startsAt: true,
      endsAt: true,
      status: true,
      partner: { select: { companyName: true } },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
  }

  if (campaign.status !== "published") {
    return NextResponse.json(
      { error: "Campanha não disponível" },
      { status: 403 },
    );
  }

  // Verifica expiração
  const now = new Date();
  if (campaign.endsAt && new Date(campaign.endsAt).getTime() < now.getTime()) {
    await prisma.partnerCampaign.update({
      where: { id },
      data: { status: "expired" },
    });
    return NextResponse.json(
      { error: "Campanha expirada" },
      { status: 410 },
    );
  }

  // Verifica startsAt (não começou ainda)
  if (campaign.startsAt && new Date(campaign.startsAt).getTime() > now.getTime()) {
    return NextResponse.json(
      { error: "Campanha ainda não começou" },
      { status: 403 },
    );
  }

  // Retorna apenas campos públicos
  return NextResponse.json({
    campaign: {
      id: campaign.id,
      offerTitle: campaign.offerTitle,
      offerDescription: campaign.offerDescription,
      offerCta: campaign.offerCta,
      offerUrl: campaign.offerUrl,
      couponCode: campaign.couponCode,
      discountText: campaign.discountText,
      imageUrl: campaign.imageUrl,
      videoUrl: campaign.videoUrl,
      category: campaign.category,
      partnerName: campaign.partner.companyName,
    },
  });
}
