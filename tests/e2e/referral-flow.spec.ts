import { test, expect } from "@playwright/test";
import {
  TEST_ACCOUNTS,
  clearBrowserState,
  dismissPopups,
  registerUser,
  registerUserViaApi,
} from "./helpers";

// ===== Fase 2 — CT-6: Fluxo de Referral (Indicar → Converter → Pagar) =====
//
// Cobre o ciclo completo do programa de indicação:
//   1. Usuário A acessa /api/referral/code → código é criado automaticamente
//   2. Usuário B se cadastra com o código de A → referral criado status "pending"
//   3. Usuário A consulta /api/referral/stats → vê B na lista como "pending"
//   4. Usuário A cadastra chave PIX via /api/referral/pix
//   5. Anti-fraude: self-referral é rejeitado
//   6. Anti-fraude: mesmo usuário não pode ser indicado 2x
//   7. Código inexistente é rejeitado
//
// NOTA: a transição "pending → converted" acontece quando o webhook Kiwify
// confirma pagamento do indicado. Não testamos essa transição aqui porque
// exigiria simular webhook de pagamento real (coberto em testes manuais).

test.describe("Fase 2 — CT-6: Referral Flow", () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserState(page);
  });

  test("CT-6.1: GET /api/referral/code cria código automaticamente para usuário logado", async ({
    page,
  }) => {
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-referrer-${Date.now()}@meucorre.com`,
    };
    await registerUser(page, account);
    await dismissPopups(page);

    const res = await page.evaluate(async () => {
      const r = await fetch("/api/referral/code");
      return { status: r.status, body: await r.json() };
    });

    expect(res.status).toBe(200);
    // Campanha pode estar ativa ou não. Se ativa, code deve existir.
    if (res.body.active) {
      expect(res.body.code).toMatch(/^MEUCORRE-/i);
      expect(res.body.link).toContain("?ref=");
      expect(typeof res.body.rewardAmount).toBe("number");
      expect(res.body.stats).toBeDefined();
    } else {
      // Campanha inativa — ok, não bloqueia
      expect(res.body.active).toBe(false);
    }
  });

  test("CT-6.2: indicar amigo cria referral status 'pending'", async ({ browser }) => {
    // Usuário A (referrer) e B (indicado) em contexts separados
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    try {
      // Cadastro do usuário A
      const accountA = {
        ...TEST_ACCOUNTS.trial,
        email: `e2e-ref-a-${Date.now()}@meucorre.com`,
      };
      await registerUser(pageA, accountA);
      await dismissPopups(pageA);

      // Pega código do usuário A
      const codeRes = await pageA.evaluate(async () => {
        const r = await fetch("/api/referral/code");
        return r.json();
      });

      if (!codeRes.active) {
        // Campanha inativa — pula o teste mas não falha
        test.skip(true, "Campanha de referral inativa no ambiente");
        return;
      }

      const refCode = codeRes.code as string;
      expect(refCode).toMatch(/^MEUCORRE-/i);

      // Usuário B se cadastra com o código de A (via API direta)
      const accountB = {
        name: "E2E Referred B",
        email: `e2e-ref-b-${Date.now()}@meucorre.com`,
        password: "TesteE2E@2026",
        referralCode: refCode,
      };

      const regRes = await registerUserViaApi(pageB, accountB);
      expect(regRes.id).toBeTruthy();

      // Usuário A consulta stats — deve ver B como "pending"
      await pageA.waitForTimeout(1000); // dá tempo do POST /api/referral/register rodar
      const statsRes = await pageA.evaluate(async () => {
        const r = await fetch("/api/referral/stats");
        return r.json();
      });

      expect(statsRes.referrals).toBeDefined();
      const foundB = statsRes.referrals.find(
        (r: { referredEmail: string }) =>
          r.referredEmail.includes(accountB.email[0]) &&
          r.referredEmail.includes("meucorre.com"),
      );
      // Como o email é mascarado, verificamos pelo total incrementado
      expect(statsRes.summary.total).toBeGreaterThanOrEqual(1);
      expect(statsRes.summary.pending).toBeGreaterThanOrEqual(1);
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });

  test("CT-6.3: anti-fraude — self-referral é rejeitado", async ({ page }) => {
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-selfref-${Date.now()}@meucorre.com`,
    };
    await registerUser(page, account);
    await dismissPopups(page);

    // Pega o próprio código
    const codeRes = await page.evaluate(async () => {
      const r = await fetch("/api/referral/code");
      return r.json();
    });

    if (!codeRes.active) {
      test.skip(true, "Campanha de referral inativa");
      return;
    }

    const myCode = codeRes.code as string;

    // Tenta usar o próprio código para se auto-indicar
    // Simula chamada ao /api/referral/register com userId = próprio
    const me = await page.evaluate(async () => (await fetch("/api/auth/me")).json());

    const res = await page.evaluate(
      async ({ userId, email, name, code }) => {
        const r = await fetch("/api/referral/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, email, name, code }),
        });
        return { status: r.status, body: await r.json() };
      },
      {
        userId: me.user.id,
        email: me.user.email,
        name: me.user.name,
        code: myCode,
      },
    );

    // 200 com reason "self_referral" — anti-fraude funciona
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.reason).toBe("self_referral");
  });

  test("CT-6.4: anti-fraude — usuário não pode ser indicado 2x", async ({
    browser,
  }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    try {
      const accountA = {
        ...TEST_ACCOUNTS.trial,
        email: `e2e-refdup-a-${Date.now()}@meucorre.com`,
      };
      await registerUser(pageA, accountA);
      await dismissPopups(pageA);

      const codeRes = await pageA.evaluate(async () => {
        const r = await fetch("/api/referral/code");
        return r.json();
      });

      if (!codeRes.active) {
        test.skip(true, "Campanha de referral inativa");
        return;
      }

      const refCode = codeRes.code as string;

      // Cadastra B com código de A
      const accountB = {
        name: "E2E Dup B",
        email: `e2e-refdup-b-${Date.now()}@meucorre.com`,
        password: "TesteE2E@2026",
        referralCode: refCode,
      };
      await registerUserViaApi(pageB, accountB);

      // Tenta chamar /api/referral/register DE NOVO com mesmo userId
      const me = await pageB.evaluate(async () => (await fetch("/api/auth/me")).json());

      const res = await pageB.evaluate(
        async ({ userId, email, name, code }) => {
          const r = await fetch("/api/referral/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, email, name, code }),
          });
          return { status: r.status, body: await r.json() };
        },
        {
          userId: me.user.id,
          email: me.user.email,
          name: me.user.name,
          code: refCode,
        },
      );

      // Deve retornar ok: false reason: already_referred
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(false);
      expect(res.body.reason).toBe("already_referred");
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });

  test("CT-6.5: código de referral inexistente é rejeitado", async ({ page }) => {
    await page.goto("/");
    const res = await page.evaluate(async () => {
      const r = await fetch("/api/referral/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "fake-user-id",
          email: "fake@meucorre.com",
          name: "Fake",
          code: "MEUCORRE-ZZZZZZ",
        }),
      });
      return { status: r.status, body: await r.json() };
    });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.reason).toBe("invalid_code");
  });

  test("CT-6.6: cadastro de chave PIX valida tamanho mínimo", async ({ page }) => {
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-pix-${Date.now()}@meucorre.com`,
    };
    await registerUser(page, account);
    await dismissPopups(page);

    // Chave muito curta (<3 chars) → 400
    const res = await page.evaluate(async () => {
      const r = await fetch("/api/referral/pix", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pixKey: "ab" }),
      });
      return { status: r.status, body: await r.json() };
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/inválid/i); // matching "inválida" ou "inválido"
  });

  test("CT-6.7: cadastro de chave PIX valida tamanho máximo (140 chars)", async ({
    page,
  }) => {
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-pix-long-${Date.now()}@meucorre.com`,
    };
    await registerUser(page, account);
    await dismissPopups(page);

    // Chave muito longa (>140 chars) → 400
    const longPix = "x".repeat(141);
    const res = await page.evaluate(
      async ({ longPix }) => {
        const r = await fetch("/api/referral/pix", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pixKey: longPix }),
        });
        return { status: r.status, body: await r.json() };
      },
      { longPix },
    );

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/longa/i);
  });

  test("CT-6.8: cadastra PIX válida e depois lê de volta via GET", async ({
    page,
  }) => {
    const account = {
      ...TEST_ACCOUNTS.trial,
      email: `e2e-pix-rw-${Date.now()}@meucorre.com`,
    };
    await registerUser(page, account);
    await dismissPopups(page);

    const pixKey = `email-${Date.now()}@meucorre.com`;

    // PATCH
    const patchRes = await page.evaluate(
      async ({ pixKey }) => {
        const r = await fetch("/api/referral/pix", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pixKey }),
        });
        return { status: r.status, body: await r.json() };
      },
      { pixKey },
    );
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.ok).toBe(true);
    expect(patchRes.body.pixKey).toBe(pixKey);

    // GET — usa cache-busting para evitar resposta em cache do SW
    const cacheBust = Date.now();
    const getRes = await page.evaluate(
      async ({ cacheBust }) => {
        const r = await fetch(`/api/referral/pix?_cb=${cacheBust}`, {
          cache: "no-store",
        });
        return r.json();
      },
      { cacheBust },
    );
    expect(getRes.pixKey).toBe(pixKey);
  });

  test("CT-6.9: POST /api/referral/code registra clique (incrementa contador)", async ({
    browser,
  }) => {
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();

    try {
      const accountA = {
        ...TEST_ACCOUNTS.trial,
        email: `e2e-click-${Date.now()}@meucorre.com`,
      };
      await registerUser(pageA, accountA);
      await dismissPopups(pageA);

      const codeRes = await pageA.evaluate(async () => {
        const r = await fetch("/api/referral/code");
        return r.json();
      });

      if (!codeRes.active) {
        test.skip(true, "Campanha de referral inativa");
        return;
      }

      const refCode = codeRes.code as string;
      const clicksBefore = codeRes.clicks as number;

      // Simula um clique no link (POST /api/referral/code com code)
      await pageA.evaluate(
        async ({ refCode }) => {
          await fetch("/api/referral/code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: refCode }),
          });
        },
        { refCode },
      );

      // Consulta novamente — usa cache-busting para evitar SW cache
      const cacheBust = Date.now();
      const codeRes2 = await pageA.evaluate(
        async ({ cacheBust }) => {
          const r = await fetch(`/api/referral/code?_cb=${cacheBust}`, {
            cache: "no-store",
          });
          return r.json();
        },
        { cacheBust },
      );

      expect(codeRes2.clicks).toBe(clicksBefore + 1);
    } finally {
      await ctxA.close();
    }
  });
});
