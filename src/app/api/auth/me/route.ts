import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";

const TRIAL_DAYS = 14;

// GET /api/auth/me
// Retorna dados do usuário logado (ou null se não logado)
//
// TRIAL SERVER-SIDE: O cálculo de trialDaysLeft e isTrialExpired é feito
// AQUI no servidor (não no client). O client usa estes valores como fonte
// de verdade, impedindo burla via localStorage.
export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  // Busca dados atualizados no DB (status PRO pode ter mudado)
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      name: true,
      email: true,
      isPro: true,
      licenseKey: true,
      phone: true,
      city: true,
      active: true,
      trialExtendedUntil: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ user: null });
  }

  // ===== Cálculo de Trial SERVER-SIDE =====
  // Usa createdAt como data de início do trial (não localStorage).
  // Se trialExtendedUntil for posterior, usa essa data.
  const now = new Date();
  const createdAt = new Date(user.createdAt);
  const daysSinceCreation = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  let trialDaysLeft = Math.max(0, TRIAL_DAYS - daysSinceCreation);

  // Se admin estendeu o trial, usa a data extendida
  if (user.trialExtendedUntil) {
    const extendedDate = new Date(user.trialExtendedUntil);
    const daysUntilExtended = Math.ceil(
      (extendedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntilExtended > trialDaysLeft) {
      trialDaysLeft = daysUntilExtended;
    }
  }

  const isTrialActive = trialDaysLeft > 0;
  const isTrialExpired = !isTrialActive;

  return NextResponse.json({
    user: {
      ...user,
      // Campos de trial calculados server-side
      trialDaysLeft,
      isTrialActive,
      isTrialExpired,
    },
  });
}
