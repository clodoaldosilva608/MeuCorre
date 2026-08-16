// ===== Cron: Security Scan Automático =====
//
// Rota cron executada pela Vercel (configurada em vercel.json).
// Roda diariamente às 06:00 UTC (03:00 BRT).
//
// Lógica:
// 1. Lê o agendamento salvo pelo admin (Setting: security_scan_schedule)
// 2. Se agendamento está habilitado E o dia da semana bate, executa o scan
// 3. Se score < 70 e notifyTelegram=true, envia alerta no Telegram
// 4. Salva último resultado no Setting para o admin ver no dashboard
//
// Segurança: valida o header Authorization com CRON_SECRET da Vercel
// (Vercel envia automaticamente Authorization: Bearer <CRON_SECRET>)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runFullScan, type FullScanResult } from "@/lib/security-scanner";

const SCHEDULE_KEY = "security_scan_schedule";

interface Schedule {
  enabled: boolean;
  dayOfWeek: number; // 0=domingo, 6=sábado
  hour: number;
  minute: number;
  notifyTelegram: boolean;
  lastRunAt: string | null;
  lastResult: { overallScore: number; totalFindings: number } | null;
}

async function sendTelegramAlert(result: FullScanResult) {
  try {
    // Busca o bot token
    const tokenSetting = await prisma.setting.findUnique({
      where: { key: "telegram_bot_token" },
    });
    if (!tokenSetting?.value) return;

    // Busca o chat_id do grupo
    const chatIdSetting = await prisma.setting.findUnique({
      where: { key: "telegram_group_chat_id" },
    });
    const chatId = chatIdSetting?.value ?? "-1003981458177";

    const score = result.overallScore;
    const total = result.totalFindings;
    const emoji = score >= 80 ? "✅" : score >= 50 ? "⚠️" : "🔴";

    const message = `${emoji} *Security Scan Automático — MeuCorre*

📊 *Score:* ${score}/100
🔍 *Findings:* ${total}

${score < 70 ? "⚠️ Atenção: score abaixo de 70. Veja detalhes em /admin/security" : "Tudo certo! Segurança em dia."}

_Data: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}_
`;

    const res = await fetch(
      `https://api.telegram.org/bot${tokenSetting.value}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        }),
      },
    );

    if (!res.ok) {
      console.error("[cron/security-scan] Erro ao enviar alerta Telegram:", await res.text());
    }
  } catch (err) {
    console.error("[cron/security-scan] Erro Telegram:", err);
  }
}

export async function GET(req: NextRequest) {
  // Validação: Vercel envia Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  console.log("[cron/security-scan] Iniciando verificação de agendamento...");

  try {
    // 1. Lê o agendamento
    const setting = await prisma.setting.findUnique({
      where: { key: SCHEDULE_KEY },
    });

    if (!setting) {
      console.log("[cron/security-scan] Nenhum agendamento configurado. Saindo.");
      return NextResponse.json({ ok: true, skipped: true, reason: "no_schedule" });
    }

    const schedule: Schedule = JSON.parse(setting.value);

    if (!schedule.enabled) {
      console.log("[cron/security-scan] Agendamento desabilitado. Saindo.");
      return NextResponse.json({ ok: true, skipped: true, reason: "disabled" });
    }

    // 2. Verifica se hoje é o dia configurado
    // Vercel cron roda em UTC. Convertemos para America/Sao_Paulo (UTC-3)
    const now = new Date();
    const saoPauloTime = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);

    const weekdayStr = saoPauloTime.find((p) => p.type === "weekday")?.value ?? "";
    const hourStr = saoPauloTime.find((p) => p.type === "hour")?.value ?? "0";
    const minuteStr = saoPauloTime.find((p) => p.type === "minute")?.value ?? "0";

    // Mapeia weekday string para número (0=domingo)
    const weekdayMap: Record<string, number> = {
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    };
    const currentDay = weekdayMap[weekdayStr] ?? 0;
    const currentHour = parseInt(hourStr, 10);
    const currentMinute = parseInt(minuteStr, 10);

    console.log(`[cron/security-scan] Agora (São Paulo): dia=${currentDay} hora=${currentHour}:${currentMinute}`);
    console.log(`[cron/security-scan] Configurado: dia=${schedule.dayOfWeek} hora=${schedule.hour}:${schedule.minute}`);

    // Verifica se o dia bate (o cron roda diariamente, mas só executa no dia certo)
    if (currentDay !== schedule.dayOfWeek) {
      console.log(`[cron/security-scan] Hoje (dia ${currentDay}) não é o dia configurado (${schedule.dayOfWeek}). Saindo.`);
      return NextResponse.json({ ok: true, skipped: true, reason: "wrong_day" });
    }

    // Verifica se a hora bate (com tolerância de ±30 min, já que o cron pode rodar em horário ligeiramente diferente)
    const configuredMinutes = schedule.hour * 60 + schedule.minute;
    const currentMinutes = currentHour * 60 + currentMinute;
    const diff = Math.abs(currentMinutes - configuredMinutes);

    if (diff > 60) {
      console.log(`[cron/security-scan] Fora da janela de horário (diff=${diff}min). Saindo.`);
      return NextResponse.json({ ok: true, skipped: true, reason: "wrong_time" });
    }

    // 3. Executa o scan completo
    console.log("[cron/security-scan] ✅ Executando scan completo...");
    const result = runFullScan();

    console.log(`[cron/security-scan] Scan concluído: score=${result.overallScore}/100 findings=${result.totalFindings}`);

    // 4. Salva o resultado no Setting
    const updatedSchedule: Schedule = {
      ...schedule,
      lastRunAt: new Date().toISOString(),
      lastResult: {
        overallScore: result.overallScore,
        totalFindings: result.totalFindings,
      },
    };

    await prisma.setting.update({
      where: { key: SCHEDULE_KEY },
      data: { value: JSON.stringify(updatedSchedule) },
    });

    // 5. Envia alerta no Telegram se score < 70 ou se notifyTelegram=true
    if (schedule.notifyTelegram && result.overallScore < 70) {
      console.log("[cron/security-scan] Score < 70. Enviando alerta no Telegram...");
      await sendTelegramAlert(result);
    }

    // 6. Log detalhado por categoria
    for (const [cat, res] of Object.entries(result.results)) {
      console.log(`[cron/security-scan]   ${cat}: score=${res.score} findings=${res.findings.length}`);
    }

    return NextResponse.json({
      ok: true,
      executed: true,
      overallScore: result.overallScore,
      totalFindings: result.totalFindings,
      durationMs: result.durationMs,
      telegramAlertSent: schedule.notifyTelegram && result.overallScore < 70,
    });
  } catch (err) {
    console.error("[cron/security-scan] Erro:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 },
    );
  }
}
