import { test, expect, type Page } from "@playwright/test";
import { TEST_ACCOUNTS, clearBrowserState } from "./helpers";

// ===== Smoke test — Central de Divulgação (Release C) =====
//
// Valida que:
// 1. Página /admin/flags existe e tem toggles
// 2. Página /admin/divulgacao existe e mostra aviso quando flag OFF
// 3. Após ativar flag, página mostra tabs (Calendário, Lista, Campanhas, Canais, Assets)
// 4. Calendário carrega sem erro
// 5. Lista carrega sem erro
// 6. Campanhas carrega sem erro
// 7. Canais carrega sem erro
// 8. Assets carrega sem erro

async function adminLogin(page: Page) {
  await clearBrowserState(page);
  await page.goto("/admin/login");
  await page.fill('input[type="email"]', TEST_ACCOUNTS.admin.email);
  await page.fill('input[type="password"]', TEST_ACCOUNTS.admin.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });
}

test.describe("Central de Divulgação — Release C", () => {
  test("página /admin/flags carrega com toggles", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/flags");
    await expect(page.locator("h1")).toContainText("Feature Flags");
    // Deve ter pelo menos 10 toggles (uma por flag)
    const switches = page.locator('button[role="switch"]');
    await expect(switches).toHaveCount(await switches.count());
    expect(await switches.count()).toBeGreaterThanOrEqual(10);
  });

  test("página /admin/divulgacao mostra aviso quando flag OFF", async ({ page }) => {
    await adminLogin(page);
    // Garante que a flag está OFF
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_marketing_hub_enabled", value: false },
    });
    await page.goto("/admin/divulgacao");
    await expect(page.locator("h1")).toContainText("Divulgação");
    await expect(page.locator("text=Módulo desativado")).toBeVisible({ timeout: 10000 });
  });

  test("após ativar flag, divulgacao mostra tabs e componentes", async ({ page }) => {
    await adminLogin(page);
    // Ativa a flag
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_marketing_hub_enabled", value: true },
    });
    await page.goto("/admin/divulgacao");
    await expect(page.locator("h1")).toContainText("Divulgação");

    // Deve mostrar as 5 tabs
    await expect(page.getByRole("tab", { name: /Calendário/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("tab", { name: /Lista/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Campanhas/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Canais/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Assets/ })).toBeVisible();
  });

  test("tab Calendário carrega", async ({ page }) => {
    await adminLogin(page);
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_marketing_hub_enabled", value: true },
    });
    await page.goto("/admin/divulgacao");
    // Já está na tab Calendário por padrão
    await page.waitForTimeout(2000);
    // Deve mostrar "Dias editoriais" ou "Nenhuma postagem"
    const hasCalendar = await page.locator("text=Dias editoriais").count();
    const hasEmpty = await page.locator("text=Nenhuma postagem encontrada").count();
    expect(hasCalendar + hasEmpty).toBeGreaterThan(0);
  });

  test("tab Lista carrega", async ({ page }) => {
    await adminLogin(page);
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_marketing_hub_enabled", value: true },
    });
    await page.goto("/admin/divulgacao");
    await page.getByRole("tab", { name: /Lista/ }).click();
    await page.waitForTimeout(2000);
    // Deve mostrar a tabela ou empty state
    const hasTable = await page.locator("table").count();
    const hasEmpty = await page.locator("text=Nenhuma postagem encontrada").count();
    expect(hasTable + hasEmpty).toBeGreaterThan(0);
  });

  test("tab Campanhas carrega", async ({ page }) => {
    await adminLogin(page);
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_marketing_hub_enabled", value: true },
    });
    await page.goto("/admin/divulgacao");
    await page.getByRole("tab", { name: /Campanhas/ }).click();
    await page.waitForTimeout(2000);
    // Deve mostrar o botão "Importar Plano 90 Dias"
    await expect(page.getByText(/Importar Plano 90 Dias/)).toBeVisible({ timeout: 10000 });
  });

  test("tab Canais carrega", async ({ page }) => {
    await adminLogin(page);
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_marketing_hub_enabled", value: true },
    });
    await page.goto("/admin/divulgacao");
    await page.getByRole("tab", { name: /Canais/ }).click();
    await page.waitForTimeout(2000);
    await expect(page.locator("h3").filter({ hasText: "Canais oficiais" })).toBeVisible({ timeout: 10000 });
  });

  test("tab Assets carrega", async ({ page }) => {
    await adminLogin(page);
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_marketing_hub_enabled", value: true },
    });
    await page.goto("/admin/divulgacao");
    await page.getByRole("tab", { name: /Assets/ }).click();
    await page.waitForTimeout(2000);
    // Deve mostrar o botão "Enviar imagens" ou empty state
    const hasButton = await page.getByText(/Enviar imagens/).count();
    const hasEmpty = await page.locator("text=Nenhum asset cadastrado").count();
    expect(hasButton + hasEmpty).toBeGreaterThan(0);
  });

  test("API /api/admin/promotion/campaigns responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/admin/promotion/campaigns");
    expect(res.status()).toBe(401);
  });

  test("API /api/admin/promotion/posts responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/admin/promotion/posts");
    expect(res.status()).toBe(401);
  });

  test("API /api/admin/promotion/assets responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/admin/promotion/assets");
    expect(res.status()).toBe(401);
  });

  test("API /api/admin/promotion/channels responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/admin/promotion/channels");
    expect(res.status()).toBe(401);
  });

  test("API /api/admin/promotion/reminders responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/admin/promotion/reminders");
    expect(res.status()).toBe(401);
  });

  test("API /api/admin/feature-flags POST rejeita flag desconhecida", async ({ request }) => {
    // Primeiro faz login para ter cookie
    const loginRes = await request.post("/api/admin/login", {
      data: {
        email: TEST_ACCOUNTS.admin.email,
        password: TEST_ACCOUNTS.admin.password,
      },
    });
    if (loginRes.ok()) {
      const res = await request.post("/api/admin/feature-flags", {
        data: { key: "flag_inexistente_xyz", value: true },
      });
      expect(res.status()).toBe(400);
    }
  });

  test("API /api/admin/feature-flags POST rejeita value inválido", async ({ request }) => {
    const loginRes = await request.post("/api/admin/login", {
      data: {
        email: TEST_ACCOUNTS.admin.email,
        password: TEST_ACCOUNTS.admin.password,
      },
    });
    if (loginRes.ok()) {
      const res = await request.post("/api/admin/feature-flags", {
        data: { key: "admin_marketing_hub_enabled", value: "not-boolean" as unknown as boolean },
      });
      expect([400, 500]).toContain(res.status());
    }
  });
});
