import { test, expect } from "@playwright/test";
import { clearBrowserState, dismissPopups, registerUser, addCorrida, TEST_ACCOUNTS } from "./helpers";

// ===== Verificação do menu lateral mobile (B-da UI) =====
//
// Antes da correção, os botões (notificação, share, apps, exportar, apagar)
// tinham classe `sm:inline-flex` e eram invisíveis no mobile (< 640px).
// Agora TODOS estão dentro de um menu lateral (Sheet) acessível via botão
// hambúrguer que aparece em qualquer largura de tela.

test.describe("Menu lateral mobile com todas as ações", () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserState(page);
  });

  test("botão menu hambúrguer visível em viewport mobile (375px)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto("/");

    // Em mobile, ainda não logado — vai pro /app
    await page.getByRole("link", { name: /usar grátis primeiro/i }).click();
    await page.waitForURL("**/app", { timeout: 10000 });
    await dismissPopups(page);

    // Botão de menu deve estar visível
    await expect(
      page.getByRole("button", { name: /menu de ações/i }),
    ).toBeVisible();
  });

  test("todas as 7 ações estão no menu lateral mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-mobile-menu-${Date.now()}@meucorre.com`,
    };
    await registerUser(page, account);
    await dismissPopups(page);

    // Abre o menu
    await page.getByRole("button", { name: /menu de ações/i }).click();

    // Verifica que TODAS as ações esperadas estão visíveis no menu
    const expectedActions = [
      /capturar por notificação/i,
      /gerenciar apps de entrega/i,
      /compartilhar com amigos/i,
      /exportar json/i,
      /exportar csv/i,
      /apagar tudo/i,
      /baixar aplicativo/i,
      /sair da conta/i,
    ];

    for (const pattern of expectedActions) {
      await expect(page.getByRole("button", { name: pattern })).toBeVisible({
        timeout: 2000,
      });
    }
  });

  test("ação 'Apagar tudo' abre diálogo de confirmação e funciona", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-clear-${Date.now()}@meucorre.com`,
    };
    await registerUser(page, account);
    await dismissPopups(page);

    // Adiciona 1 corrida usando o helper addCorrida (lida com popups/overlays)
    await addCorrida(page, { app: "iFood", valor: "R$ 25", km: "5,0", nota: "Antes do clear" });

    // Verifica que tem 1 corrida
    await expect(page.getByRole("heading", { name: "1", exact: true })).toBeVisible();

    // Abre menu e clica em "Apagar tudo"
    await page.getByRole("button", { name: /menu de ações/i }).click();
    await page.getByRole("button", { name: /apagar tudo/i }).click();

    // Diálogo de confirmação deve aparecer
    await expect(
      page.getByRole("heading", { name: /apagar todos os dados/i }),
    ).toBeVisible({ timeout: 2000 });

    // Confirma
    await page.getByRole("button", { name: /^apagar tudo$/i }).click();
    await page.waitForTimeout(1000);

    // Agora deve ter 0 corridas e R$ 0,00
    await expect(page.getByRole("heading", { name: "R$ 0,00" }).first()).toBeVisible();
  });
});
