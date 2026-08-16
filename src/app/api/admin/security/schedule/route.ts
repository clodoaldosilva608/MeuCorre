import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// ===== API de Agendamento de Security Scan =====
//
// GET  /api/admin/security/schedule — lista agendamentos
// POST /api/admin/security/schedule — cria/atualiza agendamento
//   body: { dayOfWeek: 0-6, hour: 0-23, minute: 0-59, enabled: boolean, notifyTelegram: boolean }
// DELETE /api/admin/security/schedule — desabilita agendamento

const SCHEDULE_KEY = "security_scan_schedule";

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const setting = await prisma.setting.findUnique({ where: { key: SCHEDULE_KEY } });
    if (!setting) {
      return NextResponse.json({
        enabled: false,
        dayOfWeek: 0, // domingo
        hour: 3,
        minute: 0,
        notifyTelegram: true,
        lastRunAt: null,
        lastResult: null,
      });
    }
    return NextResponse.json(JSON.parse(setting.value));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao buscar agendamento" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      dayOfWeek?: number;
      hour?: number;
      minute?: number;
      enabled?: boolean;
      notifyTelegram?: boolean;
    };

    // Validação
    if (body.dayOfWeek !== undefined && (body.dayOfWeek < 0 || body.dayOfWeek > 6)) {
      return NextResponse.json({ error: "dayOfWeek deve ser 0-6 (0=domingo)" }, { status: 400 });
    }
    if (body.hour !== undefined && (body.hour < 0 || body.hour > 23)) {
      return NextResponse.json({ error: "hour deve ser 0-23" }, { status: 400 });
    }
    if (body.minute !== undefined && (body.minute < 0 || body.minute > 59)) {
      return NextResponse.json({ error: "minute deve ser 0-59" }, { status: 400 });
    }

    // Busca config atual
    const existing = await prisma.setting.findUnique({ where: { key: SCHEDULE_KEY } });
    const current = existing ? JSON.parse(existing.value) : {};

    const updated = {
      enabled: body.enabled ?? current.enabled ?? false,
      dayOfWeek: body.dayOfWeek ?? current.dayOfWeek ?? 0,
      hour: body.hour ?? current.hour ?? 3,
      minute: body.minute ?? current.minute ?? 0,
      notifyTelegram: body.notifyTelegram ?? current.notifyTelegram ?? true,
      lastRunAt: current.lastRunAt ?? null,
      lastResult: current.lastResult ?? null,
    };

    await prisma.setting.upsert({
      where: { key: SCHEDULE_KEY },
      update: { value: JSON.stringify(updated) },
      create: { key: SCHEDULE_KEY, value: JSON.stringify(updated) },
    });

    return NextResponse.json({ ok: true, schedule: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao salvar agendamento" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const existing = await prisma.setting.findUnique({ where: { key: SCHEDULE_KEY } });
    if (existing) {
      const current = JSON.parse(existing.value);
      await prisma.setting.update({
        where: { key: SCHEDULE_KEY },
        data: { value: JSON.stringify({ ...current, enabled: false }) },
      });
    }
    return NextResponse.json({ ok: true, message: "Agendamento desabilitado" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao desabilitar" },
      { status: 500 },
    );
  }
}
