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

// Token para bypass de rate limit em testes E2E.
// A env var E2E_TEST_BYPASS_TOKEN precisa estar configurada na Vercel.
// Se não estiver setada localmente, os testes que criam usuários vão
// falhar por rate limiting (3 cadastros/IP/hora).
const E2E_BYPASS_TOKEN = process.env.E2E_TEST_BYPASS_TOKEN ?? "";

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

// Registra um novo usuário via /api/auth/register (API direta).
// Usa o header X-E2E-Test-Mode para bypassar o rate limit de cadastro.
// Retorna os dados do usuário criado ou lança erro se falhar.
export async function registerUserViaApi(
  page: Page,
  account: { name: string; email: string; password: string },
): Promise<{ id: string; email: string; isPro: boolean }> {
  const response = await page.evaluate(
    async ({ account, bypassToken }) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-E2E-Test-Mode": bypassToken,
        },
        body: JSON.stringify(account),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(`Register failed: ${data.error || res.status}`);
      }
      return data;
    },
    { account, bypassToken: E2E_BYPASS_TOKEN },
  );
  return response.user;
}

// Registra um novo usuário e estabelece sessão.
// Usa a API direta (com bypass de rate limit) — a API já seta o cookie
// httpOnly meucorre_user, então navegamos direto para /app.
export async function registerUser(
  page: Page,
  account: { name: string; email: string; password: string },
) {
  await registerUserViaApi(page, account);
  // A API já setou o cookie — navega para /app direto
  await page.goto("/app");
  await page.waitForLoadState("networkidle");
  // Aguarda splash screen terminar e popups carregarem
  await page.waitForTimeout(3000);
}

// Faz login via UI (form /login)
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder(/seu@email\.com/i).fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForURL("**/app", { timeout: 15000 });
  // Aguarda splash screen e popups carregarem
  await page.waitForTimeout(3000);
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
