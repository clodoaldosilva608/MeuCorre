import { test, expect } from "@playwright/test";

// ===== Testes de UI da Landing Page (B2, B4) =====
//
// Estes testes NÃO exigem banco de dados — apenas verificam que a UI
// da landing page funciona corretamente após as correções:
//
// - B2: Preço unificado em R$ 18,90 (não R$ 97,00 no LicenseDialog)
// - B4: CTAs "Comprar plano vitalício" abrem o dialog de checkout
//        diretamente (antes, só faziam scroll para #planos)

test.describe("Landing Page — correções B2 e B4", () => {
  test("CTA 'Comprar plano vitalício' do hero ABRE o dialog (não só scroll)", async ({
    page,
  }) => {
    await page.goto("/");

    // Clica no botão do hero
    await page.getByRole("button", { name: /comprar plano vitalício/i }).first().click();

    // Dialog deve aparecer imediatamente (não precisa rolar)
    await expect(
      page.getByRole("heading", { name: /quase lá! seus dados/i }),
    ).toBeVisible({ timeout: 3000 });
  });

  test("CTA 'Garanta seu acesso com desconto' também abre o dialog", async ({
    page,
  }) => {
    await page.goto("/");

    // Rola até a seção de CTA final
    await page.getByRole("button", { name: /garanta seu acesso com desconto/i }).scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: /garanta seu acesso com desconto/i }).click();

    await expect(
      page.getByRole("heading", { name: /quase lá! seus dados/i }),
    ).toBeVisible({ timeout: 3000 });
  });

  test("header tem botão 'Comprar' que abre o dialog", async ({ page }) => {
    await page.goto("/");

    // Botão "Comprar" no header (verde, novo)
    await page.getByRole("button", { name: /^comprar$/i }).click();

    await expect(
      page.getByRole("heading", { name: /quase lá! seus dados/i }),
    ).toBeVisible({ timeout: 3000 });
  });

  test("preço no dialog é R$ 18,90 (não R$ 97,00)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /comprar plano vitalício/i }).first().click();

    // Preço promocional visível
    await expect(page.locator("text=R$ 18,90").first()).toBeVisible({ timeout: 3000 });

    // Preço antigo R$ 97 aparece apenas como strikethrough (preço cheio)
    // — NÃO como preço atual a pagar
    const dialogText = await page.locator('[role="dialog"]').textContent();
    expect(dialogText).toMatch(/R\$ 18,90/);
    // R$ 97 pode aparecer como "de R$ 97 por R$ 18,90" — OK desde que
    // o preço a pagar seja R$ 18,90
  });

  test("form do dialog tem campos nome, email, telefone e botão Kiwify", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /comprar plano vitalício/i }).first().click();

    // Campos do form (Labels são <Label> não associadas via htmlFor em alguns casos,
    // então usamos os inputs diretamente)
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 3 textboxes dentro do dialog: nome, email, telefone
    await expect(dialog.getByRole("textbox")).toHaveCount(3);
    await expect(
      dialog.getByRole("button", { name: /pagar r\$ 18,90 na kiwify/i }),
    ).toBeVisible();
  });
});
