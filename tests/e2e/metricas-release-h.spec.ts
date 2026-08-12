import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { TEST_ACCOUNTS, clearBrowserState } from "./helpers";

// ===== Smoke test — Métricas e Relatórios (Release H) =====

async function adminLogin(page: Page) {
  await clearBrowserState(page);
  await page.goto("/admin/login");
  await page.fill('input[type="email"]', TEST_ACCOUNTS.admin.email);
  await page.fill('input[type="password"]', TEST_ACCOUNTS.admin.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });
}

async function adminLoginAPI(request: APIRequestContext) {
  const res = await request.post("/api/admin/login", {
    data: {
      email: TEST_ACCOUNTS.admin.email,
      password: TEST_ACCOUNTS.admin.password,
    },
  });
  return res.ok();
}

test.describe("Métricas e Relatórios — Release H", () => {
  test("página /admin/metricas carrega com 3 tabs (sem feature flag)", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/metricas");
    await expect(page.locator("h1")).toContainText("Métricas e Relatórios");
    // 3 tabs devem estar visíveis
    await expect(page.getByRole("tab", { name: /Dashboard/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("tab", { name: /Alertas/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Relatórios/ })).toBeVisible();
  });

  test("tab Dashboard carrega com KPIs", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/metricas");
    await page.waitForTimeout(3000);
    // Deve mostrar pelo menos "Receita total" ou "Carregando dashboard"
    const hasKpi = await page.locator("text=Receita total").count();
    const hasLoading = await page.locator("text=Carregando dashboard").count();
    expect(hasKpi + hasLoading).toBeGreaterThan(0);
  });

  test("tab Alertas carrega", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/metricas");
    await page.getByRole("tab", { name: /Alertas/ }).click();
    await page.waitForTimeout(2000);
    // Deve mostrar "alerta(s) ativo(s)" ou "Nenhum alerta ativo"
    const hasAlerts = await page.locator("text=/alerta.*ativo/i").count();
    const hasEmpty = await page.locator("text=Nenhum alerta ativo").count();
    const hasLoading = await page.locator("text=Carregando alertas").count();
    expect(hasAlerts + hasEmpty + hasLoading).toBeGreaterThan(0);
  });

  test("tab Relatórios carrega com 4 cards", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/metricas");
    await page.getByRole("tab", { name: /Relatórios/ }).click();
    await page.waitForTimeout(1500);
    // 4 cards de relatório
    await expect(page.getByText(/Parceiros/).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Usuários/).first()).toBeVisible();
    await expect(page.getByText(/Financeiro/).first()).toBeVisible();
    await expect(page.getByText(/Campanhas/).first()).toBeVisible();
    // Botões de download
    expect(await page.getByText(/Baixar CSV/).count()).toBe(4);
  });

  test("API /api/admin/metrics/dashboard responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/admin/metrics/dashboard");
    expect(res.status()).toBe(401);
  });

  test("API /api/admin/metrics/alerts responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/admin/metrics/alerts");
    expect(res.status()).toBe(401);
  });

  test("API /api/admin/metrics/reports/partners responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/admin/metrics/reports/partners");
    expect(res.status()).toBe(401);
  });

  test("Dashboard retorna KPIs agregados via API", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    const res = await request.get("/api/admin/metrics/dashboard?periodDays=30");
    expect(res.status()).toBe(200);
    const data = await res.json();

    // Valida estrutura
    expect(data.period).toBeTruthy();
    expect(data.period.days).toBe(30);
    expect(data.revenue).toBeTruthy();
    expect(data.users).toBeTruthy();
    expect(data.partners).toBeTruthy();
    expect(data.referrals).toBeTruthy();
    expect(data.app).toBeTruthy();

    // Valida tipos
    expect(typeof data.revenue.total).toBe("number");
    expect(typeof data.users.total).toBe("number");
    expect(typeof data.users.conversionRate).toBe("number");
    expect(typeof data.app.ctr).toBe("number");

    // byStage deve ter 12 estágios
    expect(Object.keys(data.partners.byStage).length).toBe(12);
    expect(data.partners.byStage.novo_lead).toBeGreaterThanOrEqual(0);

    // Campos opcionais (podem estar vazios se feature flags off)
    expect(data.campaigns).toBeTruthy();
    expect(data.outbound).toBeTruthy();
    expect(data.proposals).toBeTruthy();
    expect(data.promotion).toBeTruthy();
  });

  test("Dashboard aceita diferentes periodDays", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    for (const days of [7, 30, 90, 365]) {
      const res = await request.get(`/api/admin/metrics/dashboard?periodDays=${days}`);
      expect(res.status()).toBe(200);
      const data = await res.json();
      expect(data.period.days).toBe(days);
    }
  });

  test("Alertas retornam 8 categorias", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    const res = await request.get("/api/admin/metrics/alerts");
    expect(res.status()).toBe(200);
    const data = await res.json();

    expect(data.generatedAt).toBeTruthy();
    expect(typeof data.totalAlerts).toBe("number");
    expect(typeof data.highSeverityCount).toBe("number");
    expect(Array.isArray(data.alerts)).toBe(true);
    expect(data.alerts.length).toBe(8);

    // Categorias esperadas
    const alertIds = data.alerts.map((a: { id: string }) => a.id);
    expect(alertIds).toContain("leads_sem_contato");
    expect(alertIds).toContain("proposta_vencida");
    expect(alertIds).toContain("campanha_expirando");
    expect(alertIds).toContain("campanha_com_denuncia");
    expect(alertIds).toContain("atividade_atrasada");
    expect(alertIds).toContain("outbound_sem_resposta");
    expect(alertIds).toContain("proposta_aprovada_sem_ativacao");
    expect(alertIds).toContain("campanhas_expiradas_nao_marcadas");

    // Cada alerta tem campos esperados
    for (const alert of data.alerts) {
      expect(alert.id).toBeTruthy();
      expect(alert.label).toBeTruthy();
      expect(["high", "medium", "low"]).toContain(alert.severity);
      expect(typeof alert.count).toBe("number");
      expect(Array.isArray(alert.items)).toBe(true);
    }
  });

  test("Relatório CSV de parceiros baixa com BOM UTF-8", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    const res = await request.get("/api/admin/metrics/reports/partners?format=csv");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/csv");
    expect(res.headers()["content-disposition"]).toContain("attachment");
    expect(res.headers()["content-disposition"]).toContain("parceiros-");

    const body = await res.text();
    // BOM UTF-8
    expect(body.charCodeAt(0)).toBe(0xfeff);
    // Headers
    expect(body).toContain("id,companyName,tradeName,cnpj,category");
  });

  test("Relatório JSON de parceiros retorna array", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    const res = await request.get("/api/admin/metrics/reports/partners?format=json");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.partners)).toBe(true);
    expect(typeof data.total).toBe("number");
  });

  test("Relatório CSV de usuários com filtro isPro=true", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    const res = await request.get("/api/admin/metrics/reports/users?isPro=true&format=csv");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("id,name,email,phone,city,isPro");
  });

  test("Relatório CSV financeiro com filtro de data", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    const res = await request.get(
      "/api/admin/metrics/reports/financial?startDate=2026-01-01&endDate=2026-12-31&format=csv",
    );
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("id,buyerName,buyerEmail,buyerPhone,buyerCity,amount");
  });

  test("Relatório CSV de campanhas", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    const res = await request.get("/api/admin/metrics/reports/campaigns?format=csv");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("id,name,partnerName,partnerCity,partnerState,category");
    expect(body).toContain("views,clicks,leads,redemptions,reportsCount");
  });

  test("CSV escapa valores com vírgula corretamente", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    // Cria um parceiro com nome contendo vírgula
    const createRes = await request.post("/api/admin/partners", {
      data: {
        companyName: `Empresa, Teste ${Date.now()}`,
        city: "Recife",
        state: "PE",
      },
    });
    expect(createRes.status()).toBe(201);
    const { partner } = await createRes.json();

    // Baixa CSV
    const csvRes = await request.get("/api/admin/metrics/reports/partners?format=csv");
    expect(csvRes.status()).toBe(200);
    const body = await csvRes.text();
    // Deve conter a empresa com aspas duplas (escape)
    expect(body).toContain('"Empresa, Teste');

    // Limpa
    await request.delete(`/api/admin/partners/${partner.id}`);
  });

  test("Dashboard performance: responde em menos de 5 segundos", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    const start = Date.now();
    const res = await request.get("/api/admin/metrics/dashboard?periodDays=30");
    const duration = Date.now() - start;

    expect(res.status()).toBe(200);
    // Deve responder em menos de 5 segundos (mesmo com várias queries paralelas)
    expect(duration).toBeLessThan(5000);
  });
});
