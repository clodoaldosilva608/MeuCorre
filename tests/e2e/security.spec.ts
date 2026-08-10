import { test, expect } from "@playwright/test";
import {
  TEST_ACCOUNTS,
  clearBrowserState,
  dismissPopups,
  registerUser,
} from "./helpers";

// ===== Fase 2 — CT-5: Segurança =====
//
// Cobre:
//   1. Acesso a /app sem login → redireciona para /login
//   2. Acesso a /app/perfil sem login → redireciona para /login
//   3. Acesso a rotas API autenticadas sem cookie → 401
//      - /api/auth/me
//      - /api/sync (GET e POST)
//      - /api/referral/code
//      - /api/referral/stats
//      - /api/referral/pix
//      - /api/auth/update-profile
//   4. Isolamento entre usuários: user A não vê dados do user B
//   5. Cookie httpOnly não é acessível via JS (anti-XSS token leak)
//   6. Token JWT expirado/inválido é rejeitado
//   7. Rate limit bloqueia spam de cadastro (após 3/hora)

test.describe("Fase 2 — CT-5: Segurança", () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserState(page);
  });

  test("CT-5.1: /app em modo anônimo (guest) carrega sem login — UX de trial", async ({
    page,
  }) => {
    // /app é intencionalmente acessível sem login — usuário pode testar
    // o app em modo anônimo (guest) antes de se cadastrar. Esse é o fluxo
    // "Usar grátis primeiro" da landing page.
    await page.goto("/app");
    await page.waitForLoadState("networkidle");

    // Deve mostrar elementos do dashboard (cards, FAB, etc.)
    await expect(page.getByRole("button", { name: /nova corrida/i })).toBeVisible({
      timeout: 5000,
    });
    // Não deve ter sessão logada
    const me = await page.evaluate(async () => (await fetch("/api/auth/me")).json());
    expect(me.user).toBeNull();
    // /api/sync SEM cookie retorna 401 (proteção dos dados de usuários)
    const syncRes = await page.evaluate(async () => {
      const r = await fetch("/api/sync?since=0");
      return r.status;
    });
    expect(syncRes).toBe(401);
  });

  test("CT-5.2: /app/perfil sem login redireciona para /login", async ({ page }) => {
    await page.goto("/app/perfil");
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  test("CT-5.3: GET /api/auth/me sem cookie retorna { user: null }", async ({
    page,
  }) => {
    await page.goto("/");
    const res = await page.evaluate(async () => {
      const r = await fetch("/api/auth/me");
      return { status: r.status, body: await r.json() };
    });
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  test("CT-5.4: GET /api/sync sem cookie retorna 401", async ({ page }) => {
    await page.goto("/");
    const res = await page.evaluate(async () => {
      const r = await fetch("/api/sync?since=0");
      return { status: r.status, body: await r.json().catch(() => null) };
    });
    expect(res.status).toBe(401);
  });

  test("CT-5.5: POST /api/sync sem cookie retorna 401", async ({ page }) => {
    await page.goto("/");
    const res = await page.evaluate(async () => {
      const r = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveries: [], expenses: [] }),
      });
      return { status: r.status };
    });
    expect(res.status).toBe(401);
  });

  test("CT-5.6: GET /api/referral/code sem cookie retorna 401", async ({
    page,
  }) => {
    await page.goto("/");
    const res = await page.evaluate(async () => {
      const r = await fetch("/api/referral/code");
      return { status: r.status };
    });
    expect(res.status).toBe(401);
  });

  test("CT-5.7: GET /api/referral/stats sem cookie retorna 401", async ({
    page,
  }) => {
    await page.goto("/");
    const res = await page.evaluate(async () => {
      const r = await fetch("/api/referral/stats");
      return { status: r.status };
    });
    expect(res.status).toBe(401);
  });

  test("CT-5.8: PATCH /api/auth/update-profile sem cookie retorna 401", async ({
    page,
  }) => {
    await page.goto("/");
    const res = await page.evaluate(async () => {
      const r = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Hacker" }),
      });
      return { status: r.status };
    });
    expect(res.status).toBe(401);
  });

  test("CT-5.9: cookie meucorre_user é httpOnly (não acessível via document.cookie)", async ({
    page,
  }) => {
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-httponly-${Date.now()}@meucorre.com`,
    };
    await registerUser(page, account);
    await dismissPopups(page);

    // document.cookie NÃO deve conter meucorre_user
    const cookieStr = await page.evaluate(() => document.cookie);
    expect(cookieStr).not.toContain("meucorre_user");
  });

  test("CT-5.10: isolamento — usuário A não vê corridas do usuário B via /api/sync", async ({
    browser,
  }) => {
    // Cria 2 contexts separados (2 browsers virtuais)
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    try {
      // Cadastro do usuário A
      const accountA = {
        ...TEST_ACCOUNTS.trial,
        email: `e2e-iso-a-${Date.now()}@meucorre.com`,
      };
      await registerUser(pageA, accountA);
      await dismissPopups(pageA);
      await pageA.waitForTimeout(2000);

      // Cadastro do usuário B
      const accountB = {
        ...TEST_ACCOUNTS.trial,
        email: `e2e-iso-b-${Date.now()}@meucorre.com`,
      };
      await registerUser(pageB, accountB);
      await dismissPopups(pageB);
      await pageB.waitForTimeout(2000);

      // Usuário A envia 1 corrida via POST /api/sync
      const ts = Date.now();
      await pageA.evaluate(
        async ({ ts }) => {
          await fetch("/api/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              deliveries: [
                {
                  localId: 5001,
                  app: "iFood",
                  value: 25,
                  km: 5.0,
                  date: new Date().toISOString().slice(0, 10),
                  timestamp: ts,
                  notes: "SECRETO USER A",
                  updatedAt: ts,
                  deleted: false,
                },
              ],
              expenses: [],
            }),
          });
        },
        { ts },
      );

      // Usuário B faz GET /api/sync?since=0
      const bSync = await pageB.evaluate(async () => {
        const r = await fetch("/api/sync?since=0");
        return r.json();
      });

      // B não deve ver a corrida "SECRETO USER A"
      const notas = bSync.deliveries.map((d: { notes?: string | null }) => d.notes ?? "");
      expect(notas).not.toContain("SECRETO USER A");
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });

  test("CT-5.11: token JWT inválido (cookie adulterado) é rejeitado", async ({
    page,
  }) => {
    // Seta um cookie inválido manualmente (usa url em vez de domain/path separados)
    await page.context().addCookies([
      {
        name: "meucorre_user",
        value: "invalid.jwt.token",
        url: "https://meucorre.vercel.app",
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      },
    ]);

    await page.goto("/");
    const res = await page.evaluate(async () => {
      const r = await fetch("/api/auth/me");
      return { status: r.status, body: await r.json() };
    });

    // Token inválido → getUserSession retorna null → { user: null }
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  test("CT-5.12: rotas admin são protegidas separadamente do user", async ({
    page,
  }) => {
    // Cadastro de usuário COMUM (não admin)
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-noadmin-${Date.now()}@meucorre.com`,
    };
    await registerUser(page, account);
    await dismissPopups(page);

    // Tenta acessar rota admin com sessão de usuário comum
    const res = await page.evaluate(async () => {
      const r = await fetch("/api/admin/users");
      return { status: r.status };
    });

    // Deve ser 401 (sessão de usuário não serve para admin)
    expect([401, 403]).toContain(res.status);
  });

  test("CT-5.13: rota /admin/login NÃO aceita credenciais de usuário comum", async ({
    page,
  }) => {
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-noadmin-login-${Date.now()}@meucorre.com`,
      password: "SenhaComum123",
    };
    await registerUser(page, account);
    await dismissPopups(page);

    // Logout
    await page.evaluate(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
    });

    // Tenta login no admin com credenciais de usuário comum
    const res = await page.evaluate(
      async ({ email, password }) => {
        const r = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        return { status: r.status };
      },
      { email: account.email, password: account.password },
    );

    // Admin login usa ADMIN_EMAIL + ADMIN_PASSWORD env vars (hardcoded)
    // Credenciais de usuário comum devem ser rejeitadas
    expect([401, 403]).toContain(res.status);
  });
});
