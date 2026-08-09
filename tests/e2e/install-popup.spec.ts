import { test, expect } from "@playwright/test";
import { clearBrowserState, dismissPopups, registerUser, TEST_ACCOUNTS } from "./helpers";

// ===== Verificação do pop-up "Baixar aplicativo" =====
//
// Antes da correção G1, NÃO existia nenhum botão/banner "Baixar aplicativo"
// na interface do app. Agora deve existir:
// 1. Um item "Baixar aplicativo" no menu lateral (sempre visível)
// 2. Um pop-up modal que abre ao clicar nesse item
// 3. O pop-up deve funcionar em iOS (instruções) e Android (botão instalar)

test.describe("Pop-up 'Baixar aplicativo'", () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserState(page);
  });

  test("item 'Baixar aplicativo' está no menu lateral e abre o pop-up", async ({
    page,
  }) => {
    // Registra e vai pro app
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-install-${Date.now()}@meucorre.com`,
    };
    await registerUser(page, account);
    await dismissPopups(page);

    // Abre o menu lateral
    await page.getByRole("button", { name: /menu de ações/i }).click();

    // Verifica que o item "Baixar aplicativo" está visível
    const installItem = page.getByRole("button", { name: /baixar aplicativo/i });
    await expect(installItem).toBeVisible({ timeout: 2000 });

    // Clica nele — deve abrir o modal
    await installItem.click();
    await expect(
      page.getByRole("heading", { name: /instalar aplicativo/i }),
    ).toBeVisible({ timeout: 3000 });

    // Conteúdo do modal deve mencionar PWA / offline / tela inicial
    // Usa .last() pois pode haver outros dialogs abertos (trial promo)
    const installDialog = page
      .locator('[role="dialog"]')
      .filter({ has: page.getByRole("heading", { name: /instalar aplicativo/i }) })
      .last();
    const modalText = (await installDialog.textContent()) ?? "";
    expect(modalText).toMatch(/offline|tela inicial|pwa/i);
  });

  test("pop-up 'Baixar aplicativo' contém instruções ou botão de instalação", async ({
    page,
  }) => {
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-install-content-${Date.now()}@meucorre.com`,
    };
    await registerUser(page, account);
    await dismissPopups(page);

    await page.getByRole("button", { name: /menu de ações/i }).click();
    await page.getByRole("button", { name: /baixar aplicativo/i }).click();

    // Deve ter OU o botão "Instalar agora" (Android) OU as instruções
    // "Adicionar à Tela de Início" (iOS) OU a mensagem sobre Chrome/Edge
    // Filtra pelo dialog que contém "Instalar aplicativo"
    const dialog = page
      .locator('[role="dialog"]')
      .filter({ has: page.getByRole("heading", { name: /instalar aplicativo/i }) })
      .last();
    await expect(dialog).toBeVisible({ timeout: 3000 });
    const text = (await dialog.textContent()) ?? "";
    const hasInstallButton = /instalar agora/i.test(text);
    const hasIOSInstructions = /adicionar à tela de início/i.test(text);
    const hasGenericInstructions = /chrome|edge/i.test(text);
    expect(hasInstallButton || hasIOSInstructions || hasGenericInstructions).toBe(true);
  });
});
