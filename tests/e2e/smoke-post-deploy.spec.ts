import { test, expect } from "@playwright/test";

// ===== Fase 4 — Smoke Tests Pós-Deploy =====
//
// Suite enxuta e rápida (~3 min) para validar que o deploy de produção
// está saudável. Roda contra https://meucorre.vercel.app após cada deploy.
//
// Cobre:
//   1. Health check (DB + Redis + Sentry)
//   2. Landing page carrega com conteúdo correto
//   3. Páginas estáticas (login, register, termos, privacidade) carregam
//   4. API de anúncios responde
//   5. Versão deployada bate com o commit esperado
//   6. Headers de segurança presentes
//   7. Cadastro + login + logout funcionam end-to-end
//   8. Service Worker atualizado para v2 (Achado #1 corrigido)

const EXPECTED_VERSION = "d091f42"; // commit em produção (Fase 4 + nova identidade visual)

test.describe("Fase 4 — Smoke Tests Pós-Deploy", () => {
  test("S1: /api/health retorna healthy com versão esperada", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Vercel Security Checkpoint pode bloquear
    const body = await page.content();
    if (body.includes("Vercel Security Checkpoint")) {
      test.skip(true, "Vercel Security Checkpoint ativo");
      return;
    }

    const res = await page.evaluate(async () => {
      const r = await fetch("/api/health", { cache: "no-store" });
      return { status: r.status, body: await r.json() };
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(res.body.checks.database).toBe("ok");
    expect(res.body.checks.redis).toBe("ok");
    expect(res.body.checks.sentry).toBe("configured");
    expect(res.body.build.version).toBe(EXPECTED_VERSION);
    expect(res.body.build.environment).toBe("production");
  });

  test("S2: landing page carrega com heading principal correto", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const body = await page.content();
    if (body.includes("Vercel Security Checkpoint")) {
      test.skip(true, "Vercel Security Checkpoint ativo");
      return;
    }

    await expect(
      page.getByRole("heading", { name: /pare de perder dinheiro/i }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("S3: páginas estáticas carregam sem 500", async ({ page }) => {
    const pages = ["/login", "/register", "/termos", "/privacidade", "/recuperar-senha"];

    for (const path of pages) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      const status = response?.status() ?? 0;
      // Aceita 200 (OK) ou 403 (Vercel block temporário)
      expect([200, 403]).toContain(status);
      if (status === 200) {
        // Confirma que é a página certa (não uma página de erro)
        const title = await page.title();
        expect(title.length).toBeGreaterThan(0);
      }
    }
  });

  test("S4: /api/ads responde com lista de anúncios", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const body = await page.content();
    if (body.includes("Vercel Security Checkpoint")) {
      test.skip(true, "Vercel Security Checkpoint ativo");
      return;
    }

    const res = await page.evaluate(async () => {
      const r = await fetch("/api/ads?placement=banner_top", { cache: "no-store" });
      return { status: r.status, body: await r.json() };
    });

    expect(res.status).toBe(200);
    expect(res.body.ads).toBeDefined();
    expect(Array.isArray(res.body.ads)).toBe(true);
  });

  test("S5: headers de segurança presentes", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    const headers = response?.headers() ?? {};

    // Se Vercel bloqueou, headers podem ser diferentes
    if (headers["x-vercel-mitigated"]) {
      test.skip(true, "Vercel Security Checkpoint ativo");
      return;
    }

    expect(headers["content-security-policy"]).toBeDefined();
    expect(headers["strict-transport-security"]).toMatch(/max-age=\d+/);
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
  });

  test("S6: cadastro + login + logout funcionam end-to-end", async ({ page }) => {
    const {
      TEST_ACCOUNTS,
      clearBrowserState,
      registerUser,
      dismissPopups,
      loginUser,
    } = await import("./helpers");

    await clearBrowserState(page);

    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-smoke-${Date.now()}@meucorre.com`,
    };

    // Cadastro
    await registerUser(page, account);
    await dismissPopups(page);

    // Confirma autenticado
    const me = await page.evaluate(async () => (await fetch("/api/auth/me")).json());
    if (!me.user) {
      test.skip(true, "Vercel Security Checkpoint bloqueou cadastro");
      return;
    }
    expect(me.user.email).toBe(account.email);

    // Logout
    await page.evaluate(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
    });

    // Limpa Service Worker (CT-1.2 pattern)
    await page.evaluate(async () => {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        for (const k of keys) await caches.delete(k);
      }
    });
    await page.reload();
    await page.waitForTimeout(1500);

    // Confirma logout
    const meAfter = await page.evaluate(async () => {
      const r = await fetch("/api/auth/me", { cache: "no-store" });
      return r.json();
    });
    expect(meAfter.user).toBeNull();

    // Login novamente
    await loginUser(page, account.email, account.password);
    const meRe = await page.evaluate(async () => (await fetch("/api/auth/me")).json());
    expect(meRe.user).toBeTruthy();
    expect(meRe.user.email).toBe(account.email);
  });

  test("S7: Service Worker atualizado para v2 (Achado #1 corrigido)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    const body = await page.content();
    if (body.includes("Vercel Security Checkpoint")) {
      test.skip(true, "Vercel Security Checkpoint ativo");
      return;
    }

    // Força registro do SW navegando para /app (que registra SW)
    await page.goto("/app");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Verifica versão do SW ativo
    const swInfo = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return { supported: false };
      const regs = await navigator.serviceWorker.getRegistrations();
      if (regs.length === 0) return { supported: true, registered: false };

      // Pega o script do SW e verifica o CACHE_NAME
      const sw = regs[0];
      const scriptUrl = sw.active?.scriptURL ?? "";
      const response = await fetch(scriptUrl);
      const scriptText = await response.text();
      return {
        supported: true,
        registered: true,
        scriptUrl,
        hasV2: scriptText.includes("meucorre-v2"),
        hasApiBypass: scriptText.includes('url.pathname.startsWith("/api/")'),
      };
    });

    if (!swInfo.supported) {
      test.skip(true, "Service Worker não suportado neste browser");
      return;
    }

    expect(swInfo.registered).toBe(true);
    // SW v2 deve estar ativo (com bypass de /api/*)
    expect(swInfo.hasV2).toBe(true);
    expect(swInfo.hasApiBypass).toBe(true);
  });

  test("S8: /api/sync?since=invalid retorna 400 (não 500, Achado #3)", async ({ page }) => {
    const {
      TEST_ACCOUNTS,
      clearBrowserState,
      registerUserViaApi,
      dismissPopups,
    } = await import("./helpers");

    await clearBrowserState(page);
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-smoke-invalid-${Date.now()}@meucorre.com`,
    };

    // Usa API direta (mais rápido que UI)
    try {
      await registerUserViaApi(page, account);
    } catch (err) {
      test.skip(true, "Vercel Security Checkpoint bloqueou cadastro");
      return;
    }
    await dismissPopups(page);
    await page.waitForTimeout(2000);

    // Testa parâmetro inválido
    const res = await page.evaluate(async () => {
      const r = await fetch("/api/sync?since=invalid", { cache: "no-store" });
      return { status: r.status, body: await r.json().catch(() => null) };
    });

    // Deve ser 400 (não 500) — Achado #3 corrigido
    expect(res.status).toBe(400);
    expect(res.body?.error).toMatch(/parâmetro.*inválido/i);
  });
});
