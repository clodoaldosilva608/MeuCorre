import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { featureFlagSchema, validateOrError } from "@/lib/zod-schemas";
import { z } from "zod";

// ===== API de Feature Flags =====
//
// GET  /api/admin/feature-flags          — retorna todas as flags
// POST /api/admin/feature-flags          — atualiza uma flag
//   Body: { "key": "admin_marketing_hub_enabled", "value": true }
//
// As flags são armazenadas na tabela Setting (key-value).
// Padrão: todas as flags novas começam como "false" (OFF).

export const DEFAULT_FLAGS: Record<string, boolean> = {
  admin_marketing_hub_enabled: true,
  admin_partner_crm_enabled: true,
  partner_campaigns_enabled: true,
  partner_outbound_preview_enabled: true,
  partner_outbound_send_enabled: true,
  partner_portal_enabled: true,
  app_radar_enabled: true,
  app_score_enabled: true,
  app_challenge_enabled: true,
  admin_teams_enabled: true,
};

// P4-5: Performance flags (typed — não apenas boolean)
export const PERFORMANCE_FLAGS: Record<string, { value: unknown; type: "boolean" | "number" | "string"; description: string }> = {
  "new-dashboard-v2": { value: false, type: "boolean", description: "Redesign completo da dashboard (experimental)" },
  "sync.batch-size": { value: 150, type: "number", description: "Tamanho do batch no sync (10-500)" },
  "ads.cache-ttl": { value: 300000, type: "number", description: "TTL do cache de anúncios em ms (60000-600000)" },
  "rate-limit.admin-login": { value: 5, type: "number", description: "Máx tentativas de login admin por 15min" },
  "trial.days": { value: 14, type: "number", description: "Duração do trial grátis (dias)" },
  "lifetime.max-sales": { value: 500, type: "number", description: "Limite máximo de vitalícios vendidos" },
  "lifetime.cutoff-days": { value: 90, type: "number", description: "Dias até cutoff da oferta vitalício" },
};

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // 1. Module flags (boolean — ativa/desativa módulos)
  const flags: Record<string, boolean> = { ...DEFAULT_FLAGS };

  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: { in: Object.keys(DEFAULT_FLAGS) },
      },
    });
    for (const s of settings) {
      flags[s.key] = s.value === "true";
    }
  } catch (err) {
    console.warn("[admin/feature-flags] Banco indisponível, usando defaults:", err instanceof Error ? err.message : err);
  }

  // 2. Performance flags (typed — ajusta parâmetros de runtime)
  const perfFlags: Record<string, { value: unknown; type: string; description: string }> = {};
  for (const [key, meta] of Object.entries(PERFORMANCE_FLAGS)) {
    perfFlags[key] = { ...meta };
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: `flag:${key}` },
      });
      if (setting) {
        try {
          perfFlags[key].value = JSON.parse(setting.value);
        } catch {
          perfFlags[key].value = setting.value;
        }
      }
    } catch {
      // DB indisponível — usa default
    }
  }

  return NextResponse.json({ flags, performanceFlags: perfFlags });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  // P4-5: Se isPerformance=true, trata como performance flag (typed value)
  if (body.isPerformance) {
    const perfKey = String(body.key ?? "").replace(/^perf:/, "");
    if (!(perfKey in PERFORMANCE_FLAGS)) {
      return NextResponse.json(
        { error: `Flag de performance desconhecida: ${perfKey}` },
        { status: 400 },
      );
    }
    const dbKey = `flag:${perfKey}`;
    const dbValue = typeof body.value === "string" ? body.value : JSON.stringify(body.value);
    await prisma.setting.upsert({
      where: { key: dbKey },
      create: { key: dbKey, value: dbValue },
      update: { value: dbValue },
    });
    return NextResponse.json({ ok: true, key: perfKey, value: body.value });
  }

  // Module flags (boolean)
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
