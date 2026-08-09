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
  // Navega para a homepage primeiro para estabelecer a origem (necessário
  // para fetch com URL relativa funcionar no page.evaluate)
  await page.goto("/");
  await page.waitForLoadState("networkidle");

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
// Antes de navegar, seta localStorage para suprimir popups (trial promo,
// share, feedback) que interferem com os cliques do Playwright.
export async function registerUser(
  page: Page,
  account: { name: string; email: string; password: string },
) {
  await registerUserViaApi(page, account);

  // Navega para /app e imediatamente seta localStorage para suprimir popups.
  // Fazemos isso via page.addInitScript para garantir que roda antes de
  // qualquer componente React montar.
  await page.addInitScript(() => {
    const now = Date.now();
    localStorage.setItem("meucorre_promo_dismissed_at", String(now));
    localStorage.setItem("meucorre_share_dismissed_at", String(now));
    localStorage.setItem("meucorre_feedback_asked_at", String(now));
    localStorage.setItem("meucorre_first_use", new Date().toISOString());
  });

  // A API já setou o cookie — navega para /app direto
  await page.goto("/app");
  await page.waitForLoadState("networkidle");
  // Aguarda splash screen (1.4s) + promo popup (0.8s depois)
  // Share popup aparece 6s depois do promo, mas vamos fechar o promo primeiro
  // e depois lidar com o share se aparecer
  await page.waitForTimeout(3000);
  await dismissPopups(page);
}

// Faz login via UI (form /login)
// Suprime popups via localStorage (igual registerUser) para não interferir
// com os cliques do Playwright nos testes.
export async function loginUser(page: Page, email: string, password: string) {
  // Seta localStorage para suprimir popups antes de navegar
  await page.addInitScript(() => {
    const now = Date.now();
    localStorage.setItem("meucorre_promo_dismissed_at", String(now));
    localStorage.setItem("meucorre_share_dismissed_at", String(now));
    localStorage.setItem("meucorre_feedback_asked_at", String(now));
    localStorage.setItem("meucorre_first_use", new Date().toISOString());
  });

  await page.goto("/login");
  await page.getByPlaceholder(/seu@email\.com/i).fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForURL("**/app", { timeout: 15000 });
  // Aguarda splash screen terminar
  await page.waitForTimeout(2000);
  // Fecha qualquer popup residual
  await dismissPopups(page);
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
    /bora ajudar a galera/i, // heading do share popup — fecha via botão "Fechar"
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
    // e no botão "Fechar" do share popup
    try {
      const closeBtns = page.locator(
        'button[aria-label="Close"], button[aria-label="Fechar"]',
      );
      const btns = await closeBtns.all();
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

    // Para popups que têm um botão "Fechar" genérico (share popup)
    try {
      const fecharBtn = page.locator("button", { hasText: "Fechar" }).first();
      if (await fecharBtn.isVisible({ timeout: 100 }).catch(() => false)) {
        await fecharBtn.click({ timeout: 1000, force: true }).catch(() => {});
        await page.waitForTimeout(300);
        closedAny = true;
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
// Assume que os popups (trial, share, etc.) já foram suprimidos via
// localStorage em registerUser. Usa cliques nativos do Playwright.
export async function addCorrida(
  page: Page,
  opts: { app?: string; valor?: string; km?: string; nota?: string } = {},
) {
  const { app = "iFood", valor = "R$ 25", km = "5,0", nota = "E2E test" } = opts;

  // Garante que não há popups interceptando
  await dismissPopups(page);

  // Clica no botão "Nova corrida" (FAB)
  await page.getByRole("button", { name: /nova corrida/i }).click({ timeout: 5000 });
  await page.waitForTimeout(1000);

  // Localiza o dialog "Nova Corrida" específico
  const dialog = page
    .locator('[role="dialog"]')
    .filter({ has: page.locator("h2", { hasText: "Nova Corrida" }) })
    .last();
  await dialog.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(300);

  // Clica no botão do app (force: true pois elementos <p> do dialog
  // podem interceptar pointer events em layouts com scroll)
  const appButton = dialog.locator("button", { hasText: app }).first();
  await appButton.click({ timeout: 3000, force: true });
  await page.waitForTimeout(300);

  // Clica no valor
  const valorButton = dialog.locator("button", { hasText: valor }).first();
  await valorButton.click({ timeout: 3000, force: true });
  await page.waitForTimeout(300);

  // Preenche km (placeholder "0,0" exact) e nota
  await dialog.getByPlaceholder("0,0", { exact: true }).fill(km);
  await dialog.getByPlaceholder(/bairro centro/i).fill(nota);
  await page.waitForTimeout(200);

  // Submete
  await dialog.getByRole("button", { name: /lançar corrida/i }).click({ force: true });
  await page.waitForTimeout(1500);
  // Fecha qualquer toast que apareceu
  await dismissPopups(page);
}
