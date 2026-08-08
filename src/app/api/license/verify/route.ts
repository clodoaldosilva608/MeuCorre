import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/license/verify
// Verifica se uma licenseKey é válida (assinatura aprovada).
// Usado pelo app do entregador para ativar recursos PRO.
export async function POST(req: NextRequest) {
  const body = (await req.json()) as { licenseKey?: string };
  const key = body.licenseKey?.trim();

  if (!key) {
    return NextResponse.json({ valid: false, pro: false });
  }

  const sub = await prisma.subscription.findUnique({
    where: { licenseKey: key },
    select: {
      id: true,
      status: true,
      licenseKey: true,
      activatedAt: true,
      deviceId: true,
    },
  });

  if (!sub || sub.status !== "approved") {
    return NextResponse.json({ valid: false, pro: false });
  }

  return NextResponse.json({
    valid: true,
    pro: true,
    activatedAt: sub.activatedAt,
    licenseKey: sub.licenseKey,
  });
}
