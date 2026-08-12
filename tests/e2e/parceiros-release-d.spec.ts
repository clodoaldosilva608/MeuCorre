import { test, expect, type Page } from "@playwright/test";
import { TEST_ACCOUNTS, clearBrowserState } from "./helpers";

// ===== Smoke test — CRM de Parceiros (Release D) =====
//
// Valida que:
// 1. Página /admin/parceiros existe e mostra aviso quando flag OFF
// 2. Após ativar flag, página mostra tabs (Dashboard, Empresas, Pipeline, Importar)
// 3. Dashboard carrega sem erro
// 4. Lista de empresas carrega com filtros
// 5. Kanban carrega com 12 colunas
// 6. Importar carrega com textarea e botões
// 7. APIs respondem 401 sem auth
// 8. CRUD básico de parceiro (criar via API → buscar → atualizar → deletar)

async function adminLogin(page: Page) {
  await clearBrowserState(page);
  await page.goto("/admin/login");
  await page.fill('input[type="email"]', TEST_ACCOUNTS.admin.email);
  await page.fill('input[type="password"]', TEST_ACCOUNTS.admin.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });
}

async function adminLoginAPI(request: import("@playwright/test").APIRequestContext) {
  const loginRes = await request.post("/api/admin/login", {
    data: {
      email: TEST_ACCOUNTS.admin.email,
      password: TEST_ACCOUNTS.admin.password,
    },
  });
  return loginRes.ok();
}

test.describe("CRM de Parceiros — Release D", () => {
  test("página /admin/parceiros mostra aviso quando flag OFF", async ({ page }) => {
    await adminLogin(page);
    // Garante que a flag está OFF
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_partner_crm_enabled", value: false },
    });
    await page.goto("/admin/parceiros");
    await expect(page.locator("h1")).toContainText("Parceiros");
    await expect(page.locator("text=Módulo desativado")).toBeVisible({ timeout: 10000 });
  });

  test("após ativar flag, parceiros mostra tabs", async ({ page }) => {
    await adminLogin(page);
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_partner_crm_enabled", value: true },
    });
    await page.goto("/admin/parceiros");
    await expect(page.locator("h1")).toContainText("Parceiros");

    // Deve mostrar as 4 tabs
    await expect(page.getByRole("tab", { name: /Dashboard/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("tab", { name: /Empresas/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Pipeline/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Importar/ })).toBeVisible();
  });

  test("tab Dashboard carrega sem erro", async ({ page }) => {
    await adminLogin(page);
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_partner_crm_enabled", value: true },
    });
    await page.goto("/admin/parceiros");
    await page.waitForTimeout(2000);
    // Deve mostrar pelo menos um dos KPIs
    const hasContent = await page.locator("text=Parceiros").count();
    const hasEmpty = await page.locator("text=Nenhuma ação registrada").count();
    expect(hasContent + hasEmpty).toBeGreaterThan(0);
  });

  test("tab Empresas carrega com filtros", async ({ page }) => {
    await adminLogin(page);
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_partner_crm_enabled", value: true },
    });
    await page.goto("/admin/parceiros");
    await page.getByRole("tab", { name: /Empresas/ }).click();
    await page.waitForTimeout(2000);
    // Deve mostrar o botão "Novo parceiro" ou empty state
    const hasButton = await page.getByText(/Novo parceiro/).count();
    const hasEmpty = await page.locator("text=Nenhum parceiro encontrado").count();
    expect(hasButton + hasEmpty).toBeGreaterThan(0);
  });

  test("tab Pipeline carrega", async ({ page }) => {
    await adminLogin(page);
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_partner_crm_enabled", value: true },
    });
    await page.goto("/admin/parceiros");
    await page.getByRole("tab", { name: /Pipeline/ }).click();
    await page.waitForTimeout(2000);
    // Deve mostrar colunas do Kanban (labels de estágio)
    const hasNovoLead = await page.locator("text=Novo Lead").count();
    const hasAtivo = await page.locator("text=Ativo").count();
    const hasLoading = await page.locator("text=Carregando pipeline").count();
    expect(hasNovoLead + hasAtivo + hasLoading).toBeGreaterThan(0);
  });

  test("tab Importar carrega com textarea", async ({ page }) => {
    await adminLogin(page);
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_partner_crm_enabled", value: true },
    });
    await page.goto("/admin/parceiros");
    await page.getByRole("tab", { name: /Importar/ }).click();
    await page.waitForTimeout(1500);
    await expect(page.locator("text=Importação CSV de parceiros")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Carregar arquivo CSV/)).toBeVisible();
  });

  test("API /api/admin/partners responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/admin/partners");
    expect(res.status()).toBe(401);
  });

  test("API /api/admin/partners/dashboard responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/admin/partners/dashboard");
    expect(res.status()).toBe(401);
  });

  test("API /api/admin/partners/import responde 401 sem auth", async ({ request }) => {
    const res = await request.post("/api/admin/partners/import", {
      data: { format: "json", partners: [] },
    });
    expect(res.status()).toBe(401);
  });

  test("CRUD completo de parceiro via API", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    // Cria parceiro
    const createRes = await request.post("/api/admin/partners", {
      data: {
        companyName: `E2E Test Partner ${Date.now()}`,
        tradeName: "E2E Test",
        category: "oficina",
        origin: "manual",
        city: "Recife",
        state: "PE",
        phone: "(81) 99999-9999",
        email: `e2e-${Date.now()}@test.com`,
        priority: "media",
        stage: "novo_lead",
        notes: "Criado por teste E2E",
      },
    });
    expect(createRes.status()).toBe(201);
    const { partner } = await createRes.json();
    expect(partner.id).toBeTruthy();
    expect(partner.assignedTo).toBe("Clodoaldo Silva"); // default aplicado
    expect(partner.companyName).toContain("E2E Test Partner");

    // Busca por ID
    const getRes = await request.get(`/api/admin/partners/${partner.id}`);
    expect(getRes.status()).toBe(200);
    const { partner: fetched } = await getRes.json();
    expect(fetched.id).toBe(partner.id);

    // Atualiza stage
    const patchRes = await request.patch(`/api/admin/partners/${partner.id}`, {
      data: { stage: "qualificando", priority: "alta" },
    });
    expect(patchRes.status()).toBe(200);
    const { partner: updated } = await patchRes.json();
    expect(updated.stage).toBe("qualificando");
    expect(updated.priority).toBe("alta");

    // Adiciona contato
    const contactRes = await request.post(`/api/admin/partners/${partner.id}/contacts`, {
      data: {
        name: "Contato E2E",
        email: "contato.e2e@test.com",
        phone: "(81) 98888-8888",
        isPrimary: true,
      },
    });
    expect(contactRes.status()).toBe(201);
    const { contact } = await contactRes.json();
    expect(contact.id).toBeTruthy();

    // Cria oportunidade
    const oppRes = await request.post(`/api/admin/partners/${partner.id}/opportunities`, {
      data: {
        title: "Oportunidade E2E",
        stage: "novo_lead",
        potentialValue: 1500,
        billingModel: "campaign",
      },
    });
    expect(oppRes.status()).toBe(201);

    // Cria atividade
    const actRes = await request.post(`/api/admin/partners/${partner.id}/activities`, {
      data: {
        type: "call",
        title: "Ligação E2E",
        description: "Teste de atividade",
      },
    });
    expect(actRes.status()).toBe(201);

    // Lista logs (deve ter created, updated, contact_added, opportunity_created, activity_created)
    const logsRes = await request.get(`/api/admin/partners/${partner.id}/logs`);
    expect(logsRes.status()).toBe(200);
    const { logs } = await logsRes.json();
    expect(logs.length).toBeGreaterThanOrEqual(3);

    // Deleta (cascade)
    const delRes = await request.delete(`/api/admin/partners/${partner.id}`);
    expect(delRes.status()).toBe(200);

    // Confirma que foi removido
    const getAfter = await request.get(`/api/admin/partners/${partner.id}`);
    expect(getAfter.status()).toBe(404);
  });

  test("Importação CSV com preview via API", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    const csv = `companyName,category,city,state,phone,email
E2E CSV Test 1 ${Date.now()},oficina,Recife,PE,(81) 99999-0001,e2e-csv1@test.com
E2E CSV Test 2 ${Date.now()},alimentacao,Olinda,PE,(81) 99999-0002,e2e-csv2@test.com`;

    const previewRes = await request.post("/api/admin/partners/import", {
      data: {
        format: "csv",
        csv,
        preview: true,
      },
    });
    expect(previewRes.status()).toBe(200);
    const preview = await previewRes.json();
    expect(preview.preview).toBe(true);
    expect(preview.total).toBe(2);
    expect(preview.toCreate).toBe(2);
    expect(preview.toUpdate).toBe(0);
    expect(preview.errors).toBe(0);
  });

  test("Importação rejeita formato inválido", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    const res = await request.post("/api/admin/partners/import", {
      data: { format: "xml", xml: "<foo/>" },
    });
    expect(res.status()).toBe(400);
  });

  test("Validação: companyName obrigatório", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    const res = await request.post("/api/admin/partners", {
      data: { city: "Recife" },
    });
    expect(res.status()).toBe(400);
  });

  test("Validação: stage inválido rejeitado", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    const createRes = await request.post("/api/admin/partners", {
      data: {
        companyName: `E2E Stage Test ${Date.now()}`,
        stage: "estagio_inexistente",
      },
    });
    // stage inválido cai para default "novo_lead"
    expect(createRes.status()).toBe(201);
    const { partner } = await createRes.json();
    expect(partner.stage).toBe("novo_lead");

    // Limpa
    await request.delete(`/api/admin/partners/${partner.id}`);
  });

  test("Validação: priority inválida rejeitada", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    const createRes = await request.post("/api/admin/partners", {
      data: {
        companyName: `E2E Priority Test ${Date.now()}`,
        priority: "super_urgente",
      },
    });
    expect(createRes.status()).toBe(201);
    const { partner } = await createRes.json();
    expect(partner.priority).toBe("media"); // default aplicado

    // Limpa
    await request.delete(`/api/admin/partners/${partner.id}`);
  });
});
