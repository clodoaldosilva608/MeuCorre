import { test, expect } from "@playwright/test";

// ===== Fase 3 — CT-7: Simulação de Falhas =====
//
// Valida que o MeuCorre falha graciosamente quando dependências externas
// caem. Não derrubamos serviços reais, mas validamos:
//   1. /api/health reporta status de DB + Redis + Sentry
//   2. App continua funcional offline (IndexedDB local-first)
//   3. /api/sync sem sessão retorna 401 (não 500)
//   4. POST /api/sync com JSON inválido retorna 400/401 (não 500)
//   5. Rota inexistente retorna 404 customizado
//   6. Rate limit retorna 429 (não 500) quando excedido
//   7. Headers de segurança presentes
//   8. Cookie de sessão tem Secure/HttpOnly/SameSite
//
// NOTA: Vercel Security Checkpoint (DDoS protection) pode bloquear
// requests automatizados a partir deste ambiente. Os testes pulam
// graciosamente se detectado, sem falhar. Em ambiente CI (GitHub
// Actions), o checkpoint normalmente não ativa.

async function isVercelBlocked(page: import("@playwright/test").Page): Promise<boolean> {
  const body = await page.content();
  return body.includes("Vercel Security Checkpoint") || body.includes("vercel-challenge");
}

test.describe("Fase 3 — CT-7: Simulação de Falhas", () => {
  test("CT-7.1: /api/health reporta status de cada dependência", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    if (await isVercelBlocked(page)) {
      test.skip(true, "Vercel Security Checkpoint ativo neste ambiente");
      return;
    }

    const res = await page.evaluate(async () => {
      const r = await fetch("/api/health", { cache: "no-store" });
      return { status: r.status, body: await r.json() };
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(res.body.checks.database).toBe("ok");
    expect(["ok", "configured", "not_configured"]).toContain(
      res.body.checks.redis,
    );
    expect(res.body.build.version).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
  });

  test("CT-7.2: app continua funcional offline (IndexedDB local-first)", async ({
    page,
  }) => {
    await page.goto("/app");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    if (await isVercelBlocked(page)) {
      test.skip(true, "Vercel Security Checkpoint ativo neste ambiente");
      return;
    }

    // Vai offline
    await page.context().setOffline(true);
    await page.waitForTimeout(500);

    // Tenta abrir dialog de Nova Corrida enquanto offline
    await page.getByRole("button", { name: /nova corrida/i }).click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]').filter({
      has: page.locator("h2", { hasText: /nova corrida/i }),
    });
    await expect(dialog).toBeVisible({ timeout: 3000 });

    await page.keyboard.press("Escape");
    await page.context().setOffline(false);
  });

  test("CT-7.3: GET /api/sync sem sessão retorna 401 (não 500)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    if (await isVercelBlocked(page)) {
      test.skip(true, "Vercel Security Checkpoint ativo neste ambiente");
      return;
    }

    // Limpa cookies
    await page.context().clearCookies();

    const res = await page.evaluate(async () => {
      try {
        const r = await fetch("/api/sync?since=0", { cache: "no-store" });
        return { status: r.status, body: await r.json().catch(() => null) };
      } catch (err) {
        return { status: 0, error: String(err) };
      }
    });

    expect(res.status).toBe(401);
    expect(res.body?.error).toMatch(/não autorizado/i);
  });

  test("CT-7.4: POST /api/sync com JSON inválido retorna 400 ou 401 (não 500)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    if (await isVercelBlocked(page)) {
      test.skip(true, "Vercel Security Checkpoint ativo neste ambiente");
      return;
    }

    const res = await page.evaluate(async () => {
      const r = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{invalid json",
      });
      return { status: r.status };
    });

    // Sem sessão, deve ser 401 (auth check vem antes do parse JSON)
    expect([401, 400]).toContain(res.status);
  });

  test("CT-7.5: rota inexistente retorna 404 customizado (não 500)", async ({
    page,
  }) => {
    const res = await page.goto("/rota-que-nao-existe-12345", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3000);

    if (await isVercelBlocked(page)) {
      test.skip(true, "Vercel Security Checkpoint ativo neste ambiente");
      return;
    }

    expect(res?.status()).toBe(404);
    await expect(page.locator("body")).toContainText(
      /404|não encontrada|página não existe/i,
    );
  });

  test("CT-7.6: rate limit retorna 429 (não 500) quando excedido", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    if (await isVercelBlocked(page)) {
      test.skip(true, "Vercel Security Checkpoint ativo neste ambiente");
      return;
    }

    let lastStatus = 0;
    let lastBody: { error?: string } | null = null;

    for (let i = 0; i < 35; i++) {
      const res = await page.evaluate(async () => {
        const r = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: `test-rate-limit-${Date.now()}@meucorre.com`,
            password: "wrong",
          }),
        });
        return { status: r.status, body: await r.json().catch(() => null) };
      });
      lastStatus = res.status;
      lastBody = res.body;
      if (res.status === 429) break;
    }

    expect([429]).toContain(lastStatus);
    expect(lastBody?.error).toMatch(/muitas requisições/i);
  });

  test("CT-7.7: headers de segurança estão presentes em todas as rotas", async ({
    page,
  }) => {
    const response = await page.goto("/", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3000);

    if (await isVercelBlocked(page)) {
      test.skip(true, "Vercel Security Checkpoint ativo neste ambiente");
      return;
    }

    const headers = response?.headers() ?? {};

    expect(headers["content-security-policy"]).toBeDefined();
    expect(headers["strict-transport-security"]).toMatch(/max-age=\d+/);
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBeDefined();
    expect(headers["permissions-policy"]).toBeDefined();
  });

  test("CT-7.8: cookie de sessão tem atributos de segurança (Secure, HttpOnly, SameSite)", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto("https://meucorre.vercel.app/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(5000);

      if (await isVercelBlocked(page)) {
        test.skip(true, "Vercel Security Checkpoint ativo neste ambiente");
        return;
      }

      const account = {
        name: "E2E Cookie Test",
        email: `e2e-cookie-${Date.now()}@meucorre.com`,
        password: "TesteE2E@2026",
      };

      await page.evaluate(
        async ({ account, bypassToken }) => {
          const r = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-E2E-Test-Mode": bypassToken,
            },
            body: JSON.stringify(account),
          });
          return r.status;
        },
        {
          account,
          bypassToken: process.env.E2E_TEST_BYPASS_TOKEN ?? "",
        },
      );

      const cookies = await context.cookies();
      const sessionCookie = cookies.find((c) => c.name === "meucorre_user");

      expect(sessionCookie).toBeDefined();
      expect(sessionCookie?.httpOnly).toBe(true);
      expect(sessionCookie?.secure).toBe(true);
      expect(sessionCookie?.sameSite).toBe("Lax");
      expect(sessionCookie?.expires).toBeGreaterThan(Date.now() / 1000);
    } finally {
      await context.close();
    }
  });
});
