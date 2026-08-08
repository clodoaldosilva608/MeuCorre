"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/db";

// ===== Trial & Free Plan Limits =====
// 15 dias de trial grátis (acesso total)
// Após trial: 5 lançamentos de corrida por dia
// Implementado via IndexedDB (client-side enforcement — MVP).

const TRIAL_DAYS = 15;
const FREE_DAILY_LIMIT = 5;
const STORAGE_KEY_FIRST_USE = "meucorre_first_use";
const STORAGE_KEY_DISMISSED_PROMO = "meucorre_promo_dismissed_at";
const STORAGE_KEY_DISMISSED_SHARE = "meucorre_share_dismissed_at";
const STORAGE_KEY_FEEDBACK_ASKED = "meucorre_feedback_asked_at";

export interface TrialStatus {
  isPro: boolean;
  isTrialActive: boolean;
  trialDaysLeft: number;
  isTrialExpired: boolean;
  launchesToday: number;
  remainingLaunches: number;
  canLaunch: boolean;
}

// Calcula status de trial/limite baseado em localStorage + DB
export function useTrialStatus(isPro: boolean): TrialStatus {
  const [status, setStatus] = useState<TrialStatus>({
    isPro,
    isTrialActive: true,
    trialDaysLeft: TRIAL_DAYS,
    isTrialExpired: false,
    launchesToday: 0,
    remainingLaunches: FREE_DAILY_LIMIT,
    canLaunch: true,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const compute = async () => {
      // PRO não tem limites
      if (isPro) {
        setStatus({
          isPro: true,
          isTrialActive: false,
          trialDaysLeft: 0,
          isTrialExpired: false,
          launchesToday: 0,
          remainingLaunches: Infinity,
          canLaunch: true,
        });
        return;
      }

      // Verifica first use
      let firstUse = localStorage.getItem(STORAGE_KEY_FIRST_USE);
      if (!firstUse) {
        firstUse = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY_FIRST_USE, firstUse);
      }
      const firstUseDate = new Date(firstUse);
      const now = new Date();
      const daysSinceFirstUse = Math.floor(
        (now.getTime() - firstUseDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const trialDaysLeft = Math.max(0, TRIAL_DAYS - daysSinceFirstUse);
      const isTrialActive = trialDaysLeft > 0;
      const isTrialExpired = !isTrialActive;

      // Conta lançamentos de hoje
      const today = todayISO(now);
      const todayDeliveries = await db.deliveries
        .where("date")
        .equals(today)
        .count();
      const launchesToday = todayDeliveries;
      const remainingLaunches = Math.max(0, FREE_DAILY_LIMIT - launchesToday);
      const canLaunch = isTrialActive || remainingLaunches > 0;

      setStatus({
        isPro: false,
        isTrialActive,
        trialDaysLeft,
        isTrialExpired,
        launchesToday,
        remainingLaunches,
        canLaunch,
      });
    };

    compute();
  }, [isPro]);

  return status;
}

function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ===== Pop-up "Compre PRO" — só mostra 1x por sessão (a cada 4h) =====
export function shouldShowPromoPopup(isPro: boolean): boolean {
  if (isPro) return false;
  if (typeof window === "undefined") return false;
  const last = localStorage.getItem(STORAGE_KEY_DISMISSED_PROMO);
  if (!last) return true;
  const lastTime = new Date(last).getTime();
  const now = Date.now();
  // Mostra de novo após 4 horas
  return now - lastTime > 4 * 60 * 60 * 1000;
}

export function dismissPromoPopup() {
  localStorage.setItem(STORAGE_KEY_DISMISSED_PROMO, new Date().toISOString());
}

// ===== Pop-up "Compartilhe com os amigos" — 1x por dia =====
export function shouldShowSharePopup(isPro: boolean): boolean {
  if (typeof window === "undefined") return false;
  const last = localStorage.getItem(STORAGE_KEY_DISMISSED_SHARE);
  if (!last) return true;
  const lastDate = new Date(last).toDateString();
  const today = new Date().toDateString();
  return lastDate !== today;
}

export function dismissSharePopup() {
  localStorage.setItem(STORAGE_KEY_DISMISSED_SHARE, new Date().toISOString());
}

// ===== Pop-up de Feedback — 1x por semana, só após 3+ corridas =====
export async function shouldShowFeedbackPopup(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const last = localStorage.getItem(STORAGE_KEY_FEEDBACK_ASKED);
  if (last) {
    const lastTime = new Date(last).getTime();
    const now = Date.now();
    // Só pergunta de novo após 30 dias
    if (now - lastTime < 30 * 24 * 60 * 60 * 1000) return false;
  }
  // Só pergunta se tem pelo menos 3 corridas lançadas
  const count = await db.deliveries.count();
  return count >= 3;
}

export function markFeedbackAsked() {
  localStorage.setItem(STORAGE_KEY_FEEDBACK_ASKED, new Date().toISOString());
}

export { TRIAL_DAYS, FREE_DAILY_LIMIT };
