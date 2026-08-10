import { test, expect } from "@playwright/test";
import {
  TEST_ACCOUNTS,
  clearBrowserState,
  dismissPopups,
  registerUserViaApi,
  registerUser,
  loginUser,
} from "./helpers";

// ===== Fase 2 — CT-1: Ciclo de Autenticação =====
//
// Cobre o ciclo completo de autenticação do usuário entregador:
//   Cadastro → Login → Logout → Login
//   + cenários de falha (senha errada, email inexistente, duplicata, etc.)
//
// Estes testes rodam contra produção (https://meucorre.vercel.app).
// Cada teste cria uma conta única com timestamp para evitar colisões.

test.describe("Fase 2 — CT-1: Ciclo de Autenticação", () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserState(page);
  });

  test("CT-1.1: cadastro via API cria sessão válida e usuário pode acessar /app", async ({
    page,
  }) => {
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-auth-cycle-${Date.now()}@meucorre.com`,
      name: "E2E Auth Cycle",
    };
    const user = await registerUserViaApi(page, account);
    expect(user.id).toBeTruthy();
    expect(user.email).toBe(account.email);
    expect(user.isPro).toBe(false);

    // Cookie httpOnly foi setado — acessa /app direto
    await page.goto("/app");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await dismissPopups(page);

    // Confirma que está logado consultando /api/auth/me
    const meResponse = await page.evaluate(async () => {
      const r = await fetch("/api/auth/me");
      return r.json();
    });
    expect(meResponse.user).toBeTruthy();
    expect(meResponse.user.email).toBe(account.email);
    // trialDaysLeft deve ser calculado server-side (Fase 1)
    expect(typeof meResponse.user.trialDaysLeft).toBe("number");
    expect(meResponse.user.trialDaysLeft).toBeGreaterThan(0);
    expect(meResponse.user.trialDaysLeft).toBeLessThanOrEqual(14);
    expect(meResponse.user.isTrialActive).toBe(true);
    expect(meResponse.user.isTrialExpired).toBe(false);
  });

  test("CT-1.2: logout limpa sessão e /api/auth/me retorna null", async ({
    page,
  }) => {
    // Cadastra e loga
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-logout-${Date.now()}@meucorre.com`,
    };
    await registerUser(page, account);
    await dismissPopups(page);

    // Confirma autenticado
    let me = await page.evaluate(async () => (await fetch("/api/auth/me")).json());
    expect(me.user).toBeTruthy();
    // /api/sync também funciona (sessão ativa)
    let syncStatus = await page.evaluate(async () => {
      const r = await fetch("/api/sync?since=0");
      return r.status;
    });
    expect(syncStatus).toBe(200);

    // Faz logout via API
    const logoutRes = await page.evaluate(async () => {
      const r = await fetch("/api/auth/logout", { method: "POST" });
      return { status: r.status, body: await r.json() };
    });
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.ok).toBe(true);

    // Limpa Service Worker e Cache API — o SW do MeuCorre faz
    // stale-while-revalidate em TODOS os GETs (inclusive /api/auth/me e
    // /api/sync), retornando respostas em cache mesmo após logout. Para
    // validar que o servidor realmente rejeita a requisição, precisamos
    // bypassar o SW.
    await page.evaluate(async () => {
      // Desregistra todos os Service Workers
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) {
          await r.unregister();
        }
      }
      // Limpa todos os caches da Cache API
      if ("caches" in window) {
        const keys = await caches.keys();
        for (const k of keys) {
          await caches.delete(k);
        }
      }
    });

    // Recarrega a página para o SW ser totalmente descarregado
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    // /api/auth/me não deve mais retornar usuário
    me = await page.evaluate(async () => {
      const r = await fetch("/api/auth/me", { cache: "no-store" });
      return r.json();
    });
    expect(me.user).toBeNull();

    // ACHADO IMPORTANTE: o Service Worker do MeuCorre faz stale-while-revalidate
    // em TODOS os GETs, incluindo /api/sync. Após logout, /api/sync pode
    // retornar 200 em cache (com dados do usuário anterior) em vez de 401.
    // Isso é um risco de segurança baixo (dados em cache no próprio dispositivo
    // do usuário), mas deveria ser corrigido excluindo /api/* do cache do SW.
    // A verificação de que /api/sync retorna 401 sem cookie está coberta em
    // CT-5.4 com browser state limpo (sem SW registrado).
  });

  test("CT-1.3: após logout, usuário pode logar novamente com mesmas credenciais", async ({
    page,
  }) => {
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-relogin-${Date.now()}@meucorre.com`,
    };
    await registerUser(page, account);
    await dismissPopups(page);

    // Logout
    await page.evaluate(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
    });
    await page.waitForTimeout(500);

    // Login novamente via UI
    await loginUser(page, account.email, account.password);

    // Confirma autenticado
    const me = await page.evaluate(async () => (await fetch("/api/auth/me")).json());
    expect(me.user).toBeTruthy();
    expect(me.user.email).toBe(account.email);
  });

  test("CT-1.4: login com senha incorreta retorna 401 e NÃO cria sessão", async ({
    page,
  }) => {
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-wrongpass-${Date.now()}@meucorre.com`,
    };
    await registerUserViaApi(page, account);

    // Logout para limpar sessão
    await page.evaluate(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
    });
    await page.waitForTimeout(500);

    // Tentativa de login com senha errada
    const res = await page.evaluate(
      async ({ email }) => {
        const r = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: "SenhaErrada123" }),
        });
        return { status: r.status, body: await r.json() };
      },
      { email: account.email },
    );

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/email ou senha/i);
    expect(res.body.user).toBeUndefined();

    // Confirma que NÃO está logado
    const me = await page.evaluate(async () => (await fetch("/api/auth/me")).json());
    expect(me.user).toBeNull();
  });

  test("CT-1.5: login com email inexistente retorna 401 (mensagens idênticas — anti-enumeration)", async ({
    page,
  }) => {
    // Navega para homepage primeiro para estabelecer origem (necessário para fetch relativo)
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const res = await page.evaluate(async () => {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `inexistente-${Date.now()}@meucorre.com`,
          password: "QualquerSenha123",
        }),
      });
      return { status: r.status, body: await r.json() };
    });

    expect(res.status).toBe(401);
    // Mensagem deve ser a mesma do CT-1.4 (não revela que email não existe)
    expect(res.body.error).toMatch(/email ou senha/i);
  });

  test("CT-1.6: cadastro com email duplicado retorna 409", async ({ page }) => {
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-duplicate-${Date.now()}@meucorre.com`,
    };
    await registerUserViaApi(page, account);

    // Segunda tentativa com mesmo email
    const res = await page.evaluate(
      async ({ account, bypassToken }) => {
        const r = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-E2E-Test-Mode": bypassToken,
          },
          body: JSON.stringify(account),
        });
        return { status: r.status, body: await r.json() };
      },
      {
        account,
        bypassToken: process.env.E2E_TEST_BYPASS_TOKEN ?? "",
      },
    );

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/email já cadastrado/i);
  });

  test("CT-1.7: cadastro com email malformado retorna 400", async ({ page }) => {
    // Navega para homepage primeiro (necessário para fetch relativo)
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const res = await page.evaluate(
      async ({ bypassToken }) => {
        const r = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-E2E-Test-Mode": bypassToken,
          },
          body: JSON.stringify({
            name: "E2E Invalid",
            email: "nao-e-email",
            password: "SenhaValida123",
          }),
        });
        return { status: r.status, body: await r.json() };
      },
      { bypassToken: process.env.E2E_TEST_BYPASS_TOKEN ?? "" },
    );

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email inválido/i);
  });

  test("CT-1.8: cadastro com senha curta (<6 chars) retorna 400", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const res = await page.evaluate(
      async ({ bypassToken }) => {
        const r = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-E2E-Test-Mode": bypassToken,
          },
          body: JSON.stringify({
            name: "E2E Short Pass",
            email: `e2e-shortpass-${Date.now()}@meucorre.com`,
            password: "12345",
          }),
        });
        return { status: r.status, body: await r.json() };
      },
      { bypassToken: process.env.E2E_TEST_BYPASS_TOKEN ?? "" },
    );

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/senha/i);
  });

  test("CT-1.9: cadastro com nome curto (<2 chars) retorna 400", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const res = await page.evaluate(
      async ({ bypassToken }) => {
        const r = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-E2E-Test-Mode": bypassToken,
          },
          body: JSON.stringify({
            name: "A",
            email: `e2e-shortname-${Date.now()}@meucorre.com`,
            password: "SenhaValida123",
          }),
        });
        return { status: r.status, body: await r.json() };
      },
      { bypassToken: process.env.E2E_TEST_BYPASS_TOKEN ?? "" },
    );

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/nome/i);
  });

  test("CT-1.10: /app/perfil mostra dados do usuário logado após login", async ({
    page,
  }) => {
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-perfil-${Date.now()}@meucorre.com`,
      name: "Perfil Test User",
    };
    await registerUser(page, account);
    await dismissPopups(page);

    // Vai para /app/perfil
    await page.goto("/app/perfil");
    await page.waitForLoadState("networkidle");

    // Nome deve aparecer como valor de um input (form de perfil)
    // Usamos locator + toHaveValue (mais confiável que getByDisplayValue)
    const nameInput = page.locator("input").filter({ hasText: "" }).first();
    // Alternativa: aguarda o input com name="name" ou o valor preenchido
    await expect(page.locator(`input[value="${account.name}"]`)).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator(`input[value="${account.email}"]`)).toBeVisible();
  });
});
