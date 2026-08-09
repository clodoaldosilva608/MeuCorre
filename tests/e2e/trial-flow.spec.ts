import { test, expect } from "@playwright/test";
import {
  TEST_ACCOUNTS,
  clearBrowserState,
  dismissPopups,
  registerUser,
  addCorrida,
} from "./helpers";

// ===== Simulação 1: Usuário Trial ("Usar grátis primeiro") =====
//
// Reproduz o fluxo manual testado anteriormente:
// 1. Acessa landing page
// 2. Clica "Usar grátis primeiro" → vai para /app
// 3. Modal trial "Faltam 14 dias" aparece
// 4. Cria conta via /register
// 5. Faz lançamentos (corridas + despesas)
// 6. Verifica que gráficos atualizam
// 7. Verifica que NÃO é PRO (botão "Ativar licença PRO" visível)

test.describe("Simulação 1 — Usuário Trial", () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserState(page);
  });

  test("fluxo completo trial: landing → usar grátis → cadastrar → lançar", async ({
    page,
  }) => {
    // 1. Landing page
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /pare de perder dinheiro/i })).toBeVisible();

    // 2. Clica "Usar grátis primeiro"
    await page.getByRole("link", { name: /usar grátis primeiro/i }).click();
    await page.waitForURL("**/app", { timeout: 15000 });

    // 3. Modal trial deve aparecer
    await expect(
      page.getByRole("heading", { name: /faltam 14 dias do seu teste grátis/i }),
    ).toBeVisible({ timeout: 5000 });

    // 4. Fecha modal e cadastra
    await dismissPopups(page);
    await page.goto("/register");

    const trialAccount = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-trial-${Date.now()}@meucorre.com`,
    };
    await registerUser(page, trialAccount);
    await dismissPopups(page);

    // 5. Verifica que está logado mas NÃO é PRO
    const meResponse = await page.evaluate(async () => {
      const r = await fetch("/api/auth/me");
      return r.json();
    });
    expect(meResponse.user.email).toBe(trialAccount.email);
    expect(meResponse.user.isPro).toBe(false);

    // 6. Botão "Ativar licença PRO" deve estar visível no header (NÃO é PRO)
    // O botão Crown fica no header (não no menu lateral)
    await expect(
      page.getByRole("button", { name: /ativar licença pro/i }),
    ).toBeVisible({ timeout: 5000 });

    // 7. Abre o menu lateral e verifica que as ações estão disponíveis
    await page.getByRole("button", { name: /menu de ações/i }).click();
    await expect(
      page.getByRole("button", { name: /capturar por notificação/i }),
    ).toBeVisible({ timeout: 3000 });
    await expect(
      page.getByRole("button", { name: /exportar json/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /apagar tudo/i }),
    ).toBeVisible();
  });

  test("lançamentos funcionam no trial (corridas + despesas + gráficos)", async ({
    page,
  }) => {
    // Setup: registra e vai pro app
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-trial-launch-${Date.now()}@meucorre.com`,
    };
    await registerUser(page, account);
    await dismissPopups(page);

    // Faz 3 corridas
    await addCorrida(page, { app: "iFood", valor: "R$ 25", km: "5,0", nota: "Corrida 1" });
    await addCorrida(page, { app: "99Food", valor: "R$ 10", km: "3,0", nota: "Corrida 2" });
    await addCorrida(page, { app: "Lalamove", valor: "R$ 20", km: "8,0", nota: "Corrida 3" });

    // Total esperado: R$ 55,00 (25 + 10 + 20) e 3 corridas, 16 km
    await expect(page.getByRole("heading", { name: "R$ 55,00" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "3", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /16,0 km/i })).toBeVisible();

    // Adiciona 1 despesa
    await page.getByRole("button", { name: /despesas/i }).click();
    await page.getByRole("button", { name: /nova despesa/i }).click();
    await page.getByRole("button", { name: /combustível/i }).click();
    await page.getByRole("button", { name: "R$ 20" }).click();
    await page.getByPlaceholder(/gasolina.*óleo/i).fill("Gasolina E2E");
    await page.getByRole("button", { name: /lançar despesa/i }).click();
    await page.waitForTimeout(800);

    // Lucro líquido = R$ 55 - R$ 20 = R$ 35
    await expect(page.getByRole("heading", { name: "R$ 35,00" })).toBeVisible();

    // Vai pra aba Gráficos
    await page.getByRole("button", { name: /gráficos/i }).click();
    await expect(page.getByRole("heading", { name: /últimos 7 dias/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /distribuição por app/i })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /despesas por categoria/i }),
    ).toBeVisible();
  });
});
