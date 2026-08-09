import { test, expect } from "@playwright/test";
import {
  TEST_ACCOUNTS,
  clearBrowserState,
  dismissPopups,
  registerUser,
  addCorrida,
} from "./helpers";

// ===== Simulação 2b: Abandono de checkout → Trial 14 dias =====
//
// Reproduz o fluxo manual:
// 1. Clica "Comprar plano vitalício"
// 2. Preenche dados → vai para Kiwify
// 3. Simula abandono: volta para /app sem pagar
// 4. Deve cair em trial 14 dias (modal "Faltam 14 dias" aparece)
// 5. Pode usar a plataforma normalmente (lançamentos sem bloqueio)

test.describe("Simulação 2b — Abandono de checkout", () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserState(page);
  });

  test("abandona checkout → cai em trial 14 dias com acesso total", async ({
    page,
  }) => {
    test.skip(!!process.env.SKIP_KIWIFY_REDIRECT, "Pula redirect Kiwify em CI");

    // 1. Landing → abre checkout
    await page.goto("/");
    await page.getByRole("button", { name: /comprar plano vitalício/i }).first().click();
    await page.waitForTimeout(1000);

    // 2. Preenche dados
    const testEmail = `e2e-abandona-${Date.now()}@meucorre.com`;
    const dialog = page.locator('[role="dialog"]');
    await dialog.getByRole("textbox").nth(0).fill("E2E Abandona User");
    await dialog.getByRole("textbox").nth(1).fill(testEmail);
    await dialog.getByPlaceholder(/\(11\) 99999-9999/).fill("(11) 96666-5555");
    await page.getByRole("button", { name: /pagar r\$ 18,90 na kiwify/i }).click();

    // 3. Chegou no checkout Kiwify
    await page.waitForURL(/pay\.kiwify\.com\.br/, { timeout: 15000 });
    expect(page.url()).toContain("pay.kiwify.com.br");

    // 4. Simula abandono: navega de volta para o app SEM pagar
    await clearBrowserState(page);
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    // 5. Modal trial deve aparecer
    await expect(
      page.getByRole("heading", { name: /faltam 14 dias do seu teste grátis/i }),
    ).toBeVisible({ timeout: 5000 });

    // 6. Fecha modal e faz lançamentos (sem bloqueio — trial = acesso total)
    await dismissPopups(page);

    // Registra uma conta para verificar trial funciona
    await page.goto("/register");
    await registerUser(page, {
      ...TEST_ACCOUNTS.trial,
      email: testEmail,
    });
    await dismissPopups(page);

    // Faz 6 lançamentos no trial (durante trial, sem limite)
    for (let i = 1; i <= 6; i++) {
      await addCorrida(page, {
        app: "iFood",
        valor: "R$ 10",
        km: "3,0",
        nota: `Trial launch #${i}`,
      });
    }

    // Total: 6 × R$10 = R$60
    await expect(
      page.getByRole("heading", { name: "R$ 60,00" }).first(),
    ).toBeVisible();

    // Verifica que NÃO é PRO
    const meData = await page.evaluate(async () => {
      const r = await fetch("/api/auth/me");
      return r.json();
    });
    expect(meData.user.isPro).toBe(false);
  });
});
