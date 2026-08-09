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
  // Campos do form usam placeholder (não aria-label/associated label)
  await page.getByPlaceholder(/joão da silva/i).fill(account.name);
  await page.getByPlaceholder(/seu@email\.com/i).fill(account.email);
  await page.getByPlaceholder("••••••••").fill(account.password);
  await page.getByRole("button", { name: /criar conta/i }).click();
  await page.waitForURL("**/app", { timeout: 15000 });
}

// Fecha o modal de trial/promo/share/feedback se estiver aberto.
// Tenta múltiplos seletores de botão "fechar" e aguarda entre tentativas.
// Os popups do MeuCorre usam: "Talvez mais tarde", "Depois eu compartilho",
// "Fechar" (com F maiúsculo), e um botão "Close" (X) sem texto visível.
export async function dismissPopups(page: Page) {
  // Lista de padrões de botões que fecham popups
  const closePatterns = [
    /talvez mais tarde/i,
    /depois eu compartilho/i,
    /não.*agora/i,
    /fechar/i,
    /close/i,
  ];

  // Tenta até 8 rodadas de fechamento (alguns popups aparecem em sequência)
  for (let round = 0; round < 8; round++) {
    let closedAny = false;

    // Primeiro tenta clicar em qualquer botão visível com os padrões acima
    for (const pattern of closePatterns) {
      try {
        const btn = page.getByRole("button", { name: pattern }).first();
        if (await btn.isVisible({ timeout: 200 })) {
          await btn.click({ timeout: 1500, force: true });
          await page.waitForTimeout(400);
          closedAny = true;
        }
      } catch {
        // botão não visível — ignora
      }
    }

    // Também tenta clicar no botão "X" (Close) que tem apenas aria-label
    try {
      const closeBtns = page.locator('button[aria-label="Close"], button[aria-label="Fechar"]').all();
      const btns = await closeBtns;
      for (const btn of btns) {
        if (await btn.isVisible({ timeout: 100 }).catch(() => false)) {
          await btn.click({ timeout: 1000, force: true }).catch(() => {});
          await page.waitForTimeout(300);
          closedAny = true;
        }
      }
    } catch {
      // ignore
    }

    // Pressiona Escape como fallback
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(200);

    if (!closedAny) break;
  }
}

// Adiciona uma corrida via o form "Nova corrida".
// Usa eval para clicar nos botões diretamente via JS (bypassa overlays).
export async function addCorrida(
  page: Page,
  opts: { app?: string; valor?: string; km?: string; nota?: string } = {},
) {
  const { app = "iFood", valor = "R$ 25", km = "5,0", nota = "E2E test" } = opts;

  // Garante que não há popups interceptando
  await dismissPopups(page);

  // Clica no botão "Nova corrida" (FAB)
  await page.getByRole("button", { name: /nova corrida/i }).click({ timeout: 5000 });
  await page.waitForTimeout(1500);

  // Encontra o dialog "Nova Corrida" via JS (mais robusto que filter)
  // e clica nos botões via dispatchEvent (bypassa overlays do PromoPopup)
  const clickResult = await page.evaluate(
    ({ app, valor }) => {
      // Encontra o dialog que contém o heading "Nova Corrida"
      const dialogs = document.querySelectorAll('[role="dialog"]');
      let dialog: HTMLElement | null = null;
      for (const d of dialogs) {
        const h2 = d.querySelector("h2");
        if (h2 && h2.textContent && h2.textContent.includes("Nova Corrida")) {
          dialog = d as HTMLElement;
          break;
        }
      }
      if (!dialog) return { error: "Dialog Nova Corrida não encontrado" };

      // Clica no botão do app — match EXATO do textContent
      const buttons = Array.from(dialog.querySelectorAll("button"));
      const appBtn = buttons.find((b) => (b.textContent || "").trim() === app);
      if (appBtn) (appBtn as HTMLElement).click();

      // Pequeno delay entre cliques para React processar
      return { appClicked: !!appBtn, buttonsCount: buttons.length };
    },
    { app, valor },
  );
  await page.waitForTimeout(400);

  // Clica no valor em um evaluate separado (após o app ser selecionado)
  await page.evaluate((valor) => {
    const dialogs = document.querySelectorAll('[role="dialog"]');
    for (const d of dialogs) {
      const h2 = d.querySelector("h2");
      if (h2 && h2.textContent && h2.textContent.includes("Nova Corrida")) {
        const buttons = Array.from(d.querySelectorAll("button"));
        const valorBtn = buttons.find((b) => (b.textContent || "").trim() === valor);
        if (valorBtn) (valorBtn as HTMLElement).click();
        break;
      }
    }
  }, valor);
  await page.waitForTimeout(500);

  // Preenche km e nota via fill normal (inputs não são interceptados por overlays)
  const dialog = page
    .locator('[role="dialog"]')
    .filter({ has: page.locator("h2", { hasText: "Nova Corrida" }) })
    .last();
  await dialog.getByPlaceholder("0,0", { exact: true }).fill(km);
  await dialog.getByPlaceholder(/bairro centro/i).fill(nota);
  await page.waitForTimeout(300);

  // Clica em "Lançar Corrida" via JS (bypass overlays)
  await page.evaluate(() => {
    const dialogs = document.querySelectorAll('[role="dialog"]');
    for (const d of dialogs) {
      const h2 = d.querySelector("h2");
      if (h2 && h2.textContent && h2.textContent.includes("Nova Corrida")) {
        const buttons = d.querySelectorAll("button");
        for (const btn of buttons) {
          const text = (btn.textContent || "").trim();
          if (text.includes("Lançar Corrida") && !btn.hasAttribute("disabled")) {
            (btn as HTMLElement).click();
            return;
          }
        }
      }
    }
  });

  await page.waitForTimeout(1500);
  // Fecha qualquer toast/popup que apareceu
  await dismissPopups(page);
}
