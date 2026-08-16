import { prisma } from "@/lib/prisma";

// ===== Gerenciador de cota do Google Maps API =====
//
// O Google dá $200 de crédito grátis por mês.
// Cada busca Nearby Search custa $0.032 por request.
// Cada Place Details custa $0.017 por request.
// Com $200: ~4000 buscas + 4000 detalhes por mês.
//
// Configuramos um limite conservador de 3000 buscas/mês
// para nunca ultrapassar os $200 grátis.
//
// A cota reseta no dia 1 de cada mês.

const QUOTA_KEY = "google_maps_api_quota";
const LIMIT_PER_MONTH = 3000; // buscas por mês (conservador)
const WARNING_THRESHOLD = 2500; // avisa no Telegram ao chegar em 2500
const ALERT_THRESHOLD = 2800; // alerta crítico ao chegar em 2800

interface QuotaState {
  month: string; // YYYY-MM
  searchCount: number;
  detailsCount: number;
  lastResetAt: string;
  warnedAt: string | null;
  blocked: boolean;
}

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function getQuota(): Promise<QuotaState> {
  const setting = await prisma.setting.findUnique({ where: { key: QUOTA_KEY } });
  if (!setting) {
    const initial: QuotaState = {
      month: getCurrentMonth(),
      searchCount: 0,
      detailsCount: 0,
      lastResetAt: new Date().toISOString(),
      warnedAt: null,
      blocked: false,
    };
    return initial;
  }

  const state = JSON.parse(setting.value) as QuotaState;

  // Reseta a cota se mudou o mês
  const currentMonth = getCurrentMonth();
  if (state.month !== currentMonth) {
    state.month = currentMonth;
    state.searchCount = 0;
    state.detailsCount = 0;
    state.lastResetAt = new Date().toISOString();
    state.warnedAt = null;
    state.blocked = false;
    await saveQuota(state);
  }

  return state;
}

export async function saveQuota(state: QuotaState): Promise<void> {
  await prisma.setting.upsert({
    where: { key: QUOTA_KEY },
    update: { value: JSON.stringify(state) },
    create: { key: QUOTA_KEY, value: JSON.stringify(state) },
  });
}

export async function incrementSearchCount(count: number = 1): Promise<QuotaState> {
  const state = await getQuota();
  state.searchCount += count;
  await saveQuota(state);
  return state;
}

export async function incrementDetailsCount(count: number = 1): Promise<QuotaState> {
  const state = await getQuota();
  state.detailsCount += count;
  await saveQuota(state);
  return state;
}

export async function canSearch(): Promise<{ allowed: boolean; reason?: string; quota: QuotaState }> {
  const quota = await getQuota();

  if (quota.blocked) {
    return {
      allowed: false,
      reason: "Cota do Google Maps bloqueada. Aguarde o próximo mês para resetar.",
      quota,
    };
  }

  if (quota.searchCount >= LIMIT_PER_MONTH) {
    quota.blocked = true;
    await saveQuota(quota);
    return {
      allowed: false,
      reason: `Limite de ${LIMIT_PER_MONTH} buscas/mês atingido. A cota reseta no dia 1º do próximo mês.`,
      quota,
    };
  }

  return { allowed: true, quota };
}

export async function checkAndNotifyTelegram(): Promise<void> {
  const quota = await getQuota();

  // Aviso normal (2500 buscas)
  if (quota.searchCount >= WARNING_THRESHOLD && !quota.warnedAt) {
    quota.warnedAt = new Date().toISOString();
    await saveQuota(quota);
    await sendTelegramQuotaNotification(
      "⚠️",
      `Atenção! Cota do Google Maps em ${quota.searchCount}/${LIMIT_PER_MONTH} buscas este mês.\n\nFaltam ${LIMIT_PER_MONTH - quota.searchCount} buscas antes de bloquear.\n\nA cota reseta no dia 1º.`
    );
  }

  // Alerta crítico (2800 buscas)
  if (quota.searchCount >= ALERT_THRESHOLD && quota.searchCount < LIMIT_PER_MONTH) {
    await sendTelegramQuotaNotification(
      "🔴",
      `CRÍTICO! Cota do Google Maps em ${quota.searchCount}/${LIMIT_PER_MONTH} buscas!\n\nRestam apenas ${LIMIT_PER_MONTH - quota.searchCount} buscas. O sistema vai bloquear automaticamente ao atingir ${LIMIT_PER_MONTH}.`
    );
  }

  // Bloqueio (3000 buscas)
  if (quota.searchCount >= LIMIT_PER_MONTH && !quota.blocked) {
    quota.blocked = true;
    await saveQuota(quota);
    await sendTelegramQuotaNotification(
      "🚫",
      `BLOQUEIO AUTOMÁTICO! Cota do Google Maps atingiu ${quota.searchCount} buscas (limite: ${LIMIT_PER_MONTH}).\n\nA prospecção de leads foi bloqueada para evitar cobranças.\n\nA cota reseta no dia 1º do próximo mês.\n\nBuscas este mês: ${quota.searchCount}\nDetails: ${quota.detailsCount}\nCusto estimado: $${((quota.searchCount * 0.032) + (quota.detailsCount * 0.017)).toFixed(2)} de $200 grátis`
    );
  }
}

async function sendTelegramQuotaNotification(emoji: string, message: string): Promise<void> {
  try {
    const tokenSetting = await prisma.setting.findUnique({ where: { key: "telegram_bot_token" } });
    if (!tokenSetting?.value) return;

    const ADMIN_CHAT_ID = "802516531";

    await fetch(`https://api.telegram.org/bot${tokenSetting.value}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: `${emoji} *Cota Google Maps — MeuCorre*\n\n${message}`,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error("[quota] Erro Telegram:", err);
  }
}

export function getQuotaInfo() {
  return {
    limitPerMonth: LIMIT_PER_MONTH,
    warningThreshold: WARNING_THRESHOLD,
    alertThreshold: ALERT_THRESHOLD,
    costPerSearch: 0.032,
    costPerDetails: 0.017,
    freeCreditPerMonth: 200,
    estimatedMaxSearches: Math.floor(200 / 0.032), // ~6250 (mas limitamos a 3000)
  };
}
