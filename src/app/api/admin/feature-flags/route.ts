import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { featureFlagSchema, validateOrError } from "@/lib/zod-schemas";

// ===== API de Feature Flags =====
//
// GET  /api/admin/feature-flags          — retorna todas as flags
// POST /api/admin/feature-flags          — atualiza uma flag
//   Body: { "key": "admin_marketing_hub_enabled", "value": true }
//
// As flags são armazenadas na tabela Setting (key-value).
// Padrão: todas as flags novas começam como "false" (OFF).

export const DEFAULT_FLAGS: Record<string, boolean> = {
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

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  // Validação com Zod
  const validation = validateOrError(featureFlagSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 },
    );
  }

  const { key, value } = validation.data;

  // Valida se a flag é conhecida
  if (!(key in DEFAULT_FLAGS)) {
    return NextResponse.json(
      { error: `Flag desconhecida: ${key}` },
      { status: 400 },
    );
  }

  await prisma.setting.upsert({
    where: { key },
    create: { key, value: String(value) },
    update: { value: String(value) },
  });

  return NextResponse.json({ ok: true, key, value });
}
