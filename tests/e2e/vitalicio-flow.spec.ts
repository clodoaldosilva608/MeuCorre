import { test, expect } from "@playwright/test";
import {
  TEST_ACCOUNTS,
  clearBrowserState,
  dismissPopups,
  registerUser,
  loginUser,
  addCorrida,
} from "./helpers";

// ===== Simulação 2a: Usuário Vitalício (pagamento confirmado) =====
//
// Reproduz o fluxo manual testado:
// 1. Acessa landing page
// 2. Clica "Comprar plano vitalício" → abre modal de checkout
// 3. Preenche dados → redireciona para Kiwify (verifica URL)
// 4. (Simula webhook via admin: login admin → toggle PRO para o usuário)
// 5. Login como usuário PRO
// 6. Verifica que está PRO (sem trial countdown, sem promo popup)
// 7. Faz 6 lançamentos (excede limite 5/dia do plano gratuito)

test.describe("Simulação 2a — Usuário Vitalício (pagamento confirmado)", () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserState(page);
  });

  test("CTA 'Comprar plano vitalício' abre modal de checkout", async ({ page }) => {
    await page.goto("/");
    // Clica no botão do hero (não no link de scroll)
    await page.getByRole("button", { name: /comprar plano vitalício/i }).first().click();

    // Modal deve aparecer
    await expect(
      page.getByRole("heading", { name: /quase lá! seus dados/i }),
    ).toBeVisible({ timeout: 3000 });

    // Preço deve ser R$ 18,90 no dialog (pode aparecer múltiplas vezes)
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog.locator("text=R$ 18,90").first()).toBeVisible();
  });

  test("preenche dados → redireciona para Kiwify", async ({ page }) => {
    test.skip(!!process.env.SKIP_KIWIFY_REDIRECT, "Pula redirect Kiwify em CI");
    await page.goto("/");
    await page.getByRole("button", { name: /comprar plano vitalício/i }).first().click();
    await page.waitForTimeout(1000);

    const testEmail = `e2e-vitalicio-${Date.now()}@meucorre.com`;
    // Campos nome/email não têm placeholder — usamos nth()
    const dialog = page.locator('[role="dialog"]');
    await dialog.getByRole("textbox").nth(0).fill("E2E Vitalicio User");
    await dialog.getByRole("textbox").nth(1).fill(testEmail);
    await dialog.getByPlaceholder(/\(11\) 99999-9999/).fill("(11) 98888-7777");

    await page.getByRole("button", { name: /pagar r\$ 18,90 na kiwify/i }).click();

    // Deve redirecionar para pay.kiwify.com.br
    await page.waitForURL(/pay\.kiwify\.com\.br/, { timeout: 15000 });
    expect(page.url()).toContain("pay.kiwify.com.br");
    expect(page.url()).toContain(`email=${encodeURIComponent(testEmail)}`);
  });

  test("admin grant PRO → usuário vira PRO vitalício com lançamentos ilimitados", async ({
    page,
  }) => {
    // 1. Registra usuário
    const account = {
      ...TEST_ACCOUNTS.vitalicio,
      email: `e2e-vitalicio-pro-${Date.now()}@meucorre.com`,
    };
    await registerUser(page, account);

    // 2. Concede PRO via API direta (simula webhook Kiwify + admin grant)
    // Usa a API admin com as credenciais de admin para fazer login e
    // depois PATCH /api/admin/users/[id] com { isPro: true }
    const grantResult = await page.evaluate(
      async ({ admin, userEmail }) => {
        // Login como admin
        const loginRes = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(admin),
        });
        if (!loginRes.ok) {
          return { error: `Admin login failed: ${loginRes.status}` };
        }

        // Busca usuário pelo email
        const listRes = await fetch("/api/admin/users?filter=all");
        const listData = await listRes.json();
        const user = listData.users?.find(
          (u: { email: string }) => u.email === userEmail,
        );
        if (!user) {
          return { error: "User not found" };
        }

        // Concede PRO
        const patchRes = await fetch(`/api/admin/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPro: true }),
        });
        const patchData = await patchRes.json();
        return { patchRes: patchData, userId: user.id };
      },
      { admin: TEST_ACCOUNTS.admin, userEmail: account.email },
    );

    expect(grantResult.error).toBeUndefined();
    expect(grantResult.patchRes?.user?.isPro).toBe(true);
    expect(grantResult.patchRes?.user?.licenseKey).toBeTruthy();

    // 3. Limpa sessão e faz login novamente como usuário (agora PRO)
    await clearBrowserState(page);
    await loginUser(page, account.email, account.password);

    // Recarrega a página para forçar re-check do status PRO via /api/auth/me
    // (o useEffect que verifica isPro roda apenas no mount)
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await dismissPopups(page);

    // 4. Verifica que é PRO via API
    const meData = await page.evaluate(async () => {
      const r = await fetch("/api/auth/me");
      return r.json();
    });
    expect(meData.user.isPro).toBe(true);
    expect(meData.user.licenseKey).toBeTruthy();

    // 5. Badge PRO visível no header
    // Aumenta timeout porque getUserSession agora faz query no banco (active check)
    // e pode demorar mais em cold start
    await expect(page.getByText("PRO", { exact: true })).toBeVisible({ timeout: 20000 });

    // 6. Botão "Ativar licença PRO" NÃO deve estar visível (usuário já é PRO)
    await expect(
      page.getByRole("button", { name: /ativar licença pro/i }),
    ).toHaveCount(0);

    // 7. Faz 6 lançamentos (excede limite 5/dia do trial — PRO é ilimitado)
    for (let i = 1; i <= 6; i++) {
      await addCorrida(page, {
        app: "iFood",
        valor: "R$ 25",
        km: "5,0",
        nota: `PRO launch #${i}`,
      });
    }

    // Total: 6 × R$25 = R$150
    await expect(
      page.getByRole("heading", { name: "R$ 150,00" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "6", exact: true }),
    ).toBeVisible();
  });
});
