import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

// POST /api/license/verify
// Verifica se uma licenseKey é válida (assinatura aprovada).
// Usado pelo app do entregador para ativar recursos PRO.
//
// SEGURANÇA (P1-1):
// Rate limit 30/IP/15min — previne brute force de licenseKeys.
// licenseKey tem 32 chars (128 bits), enumeração teórica impossível,
// mas rate limit protege contra tentativas automatizadas em escala
// e contra DoS no banco.
export async function POST(req: NextRequest) {
  // Rate limit por IP (usuário pode não estar logado)
  const limited = await applyRateLimit(req, {
    windowMs: 15 * 60 * 1000,
    maxRequests: 30,
  });
  if (limited) return limited;

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
