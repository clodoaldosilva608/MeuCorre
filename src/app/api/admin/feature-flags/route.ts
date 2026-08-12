import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// ===== API de Feature Flags =====
//
// GET /api/admin/feature-flags
// Retorna o estado de todas as feature flags do sistema.
// As flags são armazenadas na tabela Setting (key-value).
// Padrão: todas as flags novas começam como "false" (OFF).

const DEFAULT_FLAGS: Record<string, boolean> = {
  admin_marketing_hub_enabled: false,
  admin_partner_crm_enabled: false,
  partner_campaigns_enabled: false,
  partner_outbound_preview_enabled: false,
  partner_outbound_send_enabled: false,
  partner_portal_enabled: false,
  app_radar_enabled: false,
  app_score_enabled: false,
  app_challenge_enabled: false,
  admin_teams_enabled: false,
};

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const settings = await prisma.setting.findMany({
    where: {
      key: { in: Object.keys(DEFAULT_FLAGS) },
    },
  });

  const flags: Record<string, boolean> = { ...DEFAULT_FLAGS };
  for (const s of settings) {
    flags[s.key] = s.value === "true";
  }

  return NextResponse.json({ flags });
}
