import { test, expect } from "@playwright/test";
import { mkdirSync } from "fs";
import { join } from "path";
import {
  TEST_ACCOUNTS,
  clearBrowserState,
  dismissPopups,
  registerUserViaApi,
} from "./helpers";

// ===== Captura de Screenshots com Dados Reais =====
//
// Registra um usuário de teste, adiciona múltiplas corridas e despesas
// via UI (simulando uso real), e captura screenshots de todas as telas
// do dashboard com dados visíveis.

const OUT_DIR = "/home/z/my-project/public/screenshots";

async function capture(page, name: string, fullPage = false) {
  const path = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage });
  console.log(`  ✓ ${name}.png`);
}

test.describe("Screenshots com dados reais", () => {
  test.beforeAll(() => {
    try {
      mkdirSync(OUT_DIR, { recursive: true });
    } catch {}
  });

  test("cadastra usuário + adiciona corridas/despesas + captura telas", async ({
    page,
  }) => {
    await clearBrowserState(page);

    // Cadastra usuário de teste
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-screenshot-${Date.now()}@meucorre.com`,
      name: "Carlos Entregador",
    };

    console.log("\n--- Cadastrando usuário ---");
    await registerUserViaApi(page, account);

    // Seta localStorage para suprimir popups
    await page.addInitScript(() => {
      const now = Date.now();
      localStorage.setItem("meucorre_promo_dismissed_at", String(now));
      localStorage.setItem("meucorre_share_dismissed_at", String(now));
      localStorage.setItem("meucorre_feedback_asked_at", String(now));
      localStorage.setItem("meucorre_first_use", new Date().toISOString());
    });

    await page.goto("/app");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(4000);
    await dismissPopups(page);

    console.log("--- Adicionando 5 corridas de apps diferentes ---");

    // Corrida 1: iFood R$ 25
    await page.getByRole("button", { name: /nova corrida/i }).click();
    await page.waitForTimeout(800);
    let dialog = page
      .locator('[role="dialog"]')
      .filter({ has: page.locator("h2", { hasText: /nova corrida/i }) })
      .last();
    await dialog.waitFor({ state: "visible", timeout: 5000 });
    await dialog.locator("button", { hasText: "iFood" }).first().click({ force: true });
    await page.waitForTimeout(300);
    await dialog.locator("button", { hasText: "R$ 25" }).first().click({ force: true });
    await page.waitForTimeout(300);
    await dialog.getByPlaceholder("0,0", { exact: true }).fill("8,5");
    await dialog.getByPlaceholder(/bairro centro/i).fill("Centro → Vila Nova");
    await dialog.getByRole("button", { name: /lançar corrida/i }).click({ force: true });
    await page.waitForTimeout(1500);
    await dismissPopups(page);

    // Corrida 2: 99Food R$ 10
    await page.getByRole("button", { name: /nova corrida/i }).click();
    await page.waitForTimeout(800);
    dialog = page
      .locator('[role="dialog"]')
      .filter({ has: page.locator("h2", { hasText: /nova corrida/i }) })
      .last();
    await dialog.locator("button", { hasText: "99Food" }).first().click({ force: true });
    await page.waitForTimeout(300);
    await dialog.locator("button", { hasText: "R$ 10" }).first().click({ force: true });
    await page.waitForTimeout(300);
    await dialog.getByPlaceholder("0,0", { exact: true }).fill("3,2");
    await dialog.getByPlaceholder(/bairro centro/i).fill("Centro → Jardim Europa");
    await dialog.getByRole("button", { name: /lançar corrida/i }).click({ force: true });
    await page.waitForTimeout(1500);
    await dismissPopups(page);

    // Corrida 3: Lalamove R$ 20
    await page.getByRole("button", { name: /nova corrida/i }).click();
    await page.waitForTimeout(800);
    dialog = page
      .locator('[role="dialog"]')
      .filter({ has: page.locator("h2", { hasText: /nova corrida/i }) })
      .last();
    await dialog.locator("button", { hasText: "Lalamove" }).first().click({ force: true });
    await page.waitForTimeout(300);
    await dialog.locator("button", { hasText: "R$ 20" }).first().click({ force: true });
    await page.waitForTimeout(300);
    await dialog.getByPlaceholder("0,0", { exact: true }).fill("12,0");
    await dialog.getByPlaceholder(/bairro centro/i).fill("Industrial → Centro");
    await dialog.getByRole("button", { name: /lançar corrida/i }).click({ force: true });
    await page.waitForTimeout(1500);
    await dismissPopups(page);

    // Corrida 4: Rappi R$ 15
    await page.getByRole("button", { name: /nova corrida/i }).click();
    await page.waitForTimeout(800);
    dialog = page
      .locator('[role="dialog"]')
      .filter({ has: page.locator("h2", { hasText: /nova corrida/i }) })
      .last();
    await dialog.locator("button", { hasText: "Rappi" }).first().click({ force: true });
    await page.waitForTimeout(300);
    await dialog.locator("button", { hasText: "R$ 15" }).first().click({ force: true });
    await page.waitForTimeout(300);
    await dialog.getByPlaceholder("0,0", { exact: true }).fill("5,5");
    await dialog.getByPlaceholder(/bairro centro/i).fill("Vila Mariana → Centro");
    await dialog.getByRole("button", { name: /lançar corrida/i }).click({ force: true });
    await page.waitForTimeout(1500);
    await dismissPopups(page);

    // Corrida 5: iFood R$ 30
    await page.getByRole("button", { name: /nova corrida/i }).click();
    await page.waitForTimeout(800);
    dialog = page
      .locator('[role="dialog"]')
      .filter({ has: page.locator("h2", { hasText: /nova corrida/i }) })
      .last();
    await dialog.locator("button", { hasText: "iFood" }).first().click({ force: true });
    await page.waitForTimeout(300);
    await dialog.locator("button", { hasText: "R$ 30" }).first().click({ force: true });
    await page.waitForTimeout(300);
    await dialog.getByPlaceholder("0,0", { exact: true }).fill("10,0");
    await dialog.getByPlaceholder(/bairro centro/i).fill("Centro → Pinheiros");
    await dialog.getByRole("button", { name: /lançar corrida/i }).click({ force: true });
    await page.waitForTimeout(1500);
    await dismissPopups(page);

    console.log("--- Adicionando 2 despesas ---");

    // Despesa 1: Combustível R$ 20
    await page.getByRole("button", { name: /^despesas$/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /nova despesa/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /combustível/i }).click();
    await page.getByRole("button", { name: "R$ 20" }).click();
    await page.getByPlaceholder(/ex: gasolina/i).fill("Gasolina — 2L");
    await page.getByRole("button", { name: /lançar despesa/i }).click();
    await page.waitForTimeout(1500);
    await dismissPopups(page);

    // Despesa 2: Alimentação R$ 5
    await page.getByRole("button", { name: /nova despesa/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /alimentação/i }).click();
    await page.getByRole("button", { name: "R$ 5" }).click();
    await page.getByPlaceholder(/ex: gasolina/i).fill("Almoço express");
    await page.getByRole("button", { name: /lançar despesa/i }).click();
    await page.waitForTimeout(1500);
    await dismissPopups(page);

    // Volta para aba Corridas
    await page.getByRole("button", { name: /^corridas$/i }).click();
    await page.waitForTimeout(1000);

    console.log("\n--- Capturando screenshots ---");

    // 1. Dashboard — aba Corridas (com 5 corridas)
    console.log("1. Dashboard — Corridas");
    await capture(page, "07-dashboard-corridas");

    // 2. Dashboard — aba Despesas
    console.log("2. Dashboard — Despesas");
    await page.getByRole("button", { name: /^despesas$/i }).click();
    await page.waitForTimeout(1000);
    await capture(page, "08-dashboard-despesas");

    // 3. Dashboard — aba Gráficos (com dados)
    console.log("3. Dashboard — Gráficos");
    await page.getByRole("button", { name: /^gráficos$/i }).click();
    await page.waitForTimeout(3000); // aguarda lazy load do Charts
    await capture(page, "09-dashboard-graficos");

    // 4. Dashboard — aba Ofertas
    console.log("4. Dashboard — Ofertas");
    await page.getByRole("button", { name: /^ofertas$/i }).click();
    await page.waitForTimeout(2000);
    await capture(page, "13-dashboard-ofertas");

    // 5. Volta para corridas e captura mobile
    console.log("5. Dashboard mobile");
    await page.getByRole("button", { name: /^corridas$/i }).click();
    await page.waitForTimeout(500);
    await capture(page, "12-dashboard-mobile");

    console.log("\n=== Screenshots capturados com sucesso ===");
  });
});
