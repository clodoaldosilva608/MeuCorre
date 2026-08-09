import { test, expect, type Page } from "@playwright/test";

// ===== Helpers compartilhados entre os testes E2E =====

// Email/senha de contas de teste — criadas no banco de produção.
// Em CI, estas contas precisam existir antes de rodar os testes.
export const TEST_ACCOUNTS = {
  trial: {
    email: `e2e-trial-${Date.now()}@meucorre.com`,
    password: "TesteE2E@2026",
    name: "E2E Trial User",
  },
  vitalicio: {
    email: `e2e-vitalicio-${Date.now()}@meucorre.com`,
    password: "TesteE2E@2026",
    name: "E2E Vitalicio User",
  },
  admin: {
    email: "clodoaldo608@gmail.com",
    password: "Silva88677488@#",
  },
};

// Limpa todo o estado do browser (cookies, localStorage, sessionStorage, IndexedDB)
export async function clearBrowserState(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    // Limpa todos os IndexedDBs do MeuCorre
    if (typeof indexedDB !== "undefined" && indexedDB.databases) {
      indexedDB.databases().then((dbs) => {
        for (const db of dbs) {
          if (db.name && db.name.startsWith("MeuCorreDB")) {
            indexedDB.deleteDatabase(db.name);
          }
        }
      });
    }
  });
}

// Registra um novo usuário via /register
export async function registerUser(
  page: Page,
  account: { name: string; email: string; password: string },
) {
  await page.goto("/register");
  await page.getByRole("textbox", { name: /nome/i }).fill(account.name);
  await page.getByRole("textbox", { name: /email/i }).fill(account.email);
  await page.getByPlaceholder("••••••••").fill(account.password);
  await page.getByRole("button", { name: /criar conta/i }).click();
  await page.waitForURL("**/app", { timeout: 15000 });
}

// Fecha o modal de trial/promo/share se estiver aberto
export async function dismissPopups(page: Page) {
  const closeButtons = [
    page.getByRole("button", { name: /talvez mais tarde/i }),
    page.getByRole("button", { name: /depois eu compartilho/i }),
    page.getByRole("button", { name: /fechar/i }).first(),
    page.getByRole("button", { name: /close/i }).first(),
  ];
  for (const btn of closeButtons) {
    try {
      if (await btn.isVisible({ timeout: 500 })) {
        await btn.click({ timeout: 1000 });
        await page.waitForTimeout(300);
      }
    } catch {
      // botão não visível — ignora
    }
  }
}

// Adiciona uma corrida via o form "Nova corrida"
export async function addCorrida(
  page: Page,
  opts: { app?: string; valor?: string; km?: string; nota?: string } = {},
) {
  const { app = "iFood", valor = "R$ 25", km = "5,0", nota = "E2E test" } = opts;
  await page.getByRole("button", { name: /nova corrida/i }).click();
  await page.getByRole("button", { name: new RegExp(app, "i") }).click();
  await page.getByRole("button", { name: new RegExp(valor.replace("$", "\\$"), "i") }).click();
  await page.getByPlaceholder("0,0").fill(km);
  await page.getByPlaceholder(/bairro centro/i).fill(nota);
  await page.getByRole("button", { name: /lançar corrida/i }).click();
  await page.waitForTimeout(800);
}
