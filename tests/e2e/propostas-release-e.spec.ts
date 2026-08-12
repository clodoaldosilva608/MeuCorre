import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { TEST_ACCOUNTS, clearBrowserState } from "./helpers";

// ===== Smoke test — Propostas e Materiais (Release E) =====

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

async function ensureTestPartner(request: APIRequestContext): Promise<string> {
  // Cria um parceiro de teste e retorna o ID
  const res = await request.post("/api/admin/partners", {
    data: {
      companyName: `E2E Propostas Partner ${Date.now()}`,
      city: "Recife",
      state: "PE",
      category: "servicos",
      phone: "(81) 99999-9999",
      email: `e2e-propostas-${Date.now()}@test.com`,
    },
  });
  expect(res.status()).toBe(201);
  const { partner } = await res.json();
  return partner.id;
}

test.describe("Propostas e Materiais — Release E", () => {
  test("página /admin/propostas mostra aviso quando flag OFF", async ({ page }) => {
    await adminLogin(page);
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_partner_crm_enabled", value: false },
    });
    await page.goto("/admin/propostas");
    await expect(page.locator("h1")).toContainText("Propostas e Materiais");
    await expect(page.locator("text=Módulo desativado")).toBeVisible({ timeout: 10000 });
  });

  test("após ativar flag, propostas mostra tabs", async ({ page }) => {
    await adminLogin(page);
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_partner_crm_enabled", value: true },
    });
    await page.goto("/admin/propostas");
    await expect(page.locator("h1")).toContainText("Propostas e Materiais");
    await expect(page.getByRole("tab", { name: /Propostas/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("tab", { name: /Materiais/ })).toBeVisible();
  });

  test("tab Propostas carrega com botão Nova proposta", async ({ page }) => {
    await adminLogin(page);
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_partner_crm_enabled", value: true },
    });
    await page.goto("/admin/propostas");
    await page.waitForTimeout(2000);
    const hasButton = await page.getByText(/Nova proposta/).count();
    const hasEmpty = await page.locator("text=Nenhuma proposta encontrada").count();
    expect(hasButton + hasEmpty).toBeGreaterThan(0);
  });

  test("tab Materiais carrega com upload", async ({ page }) => {
    await adminLogin(page);
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_partner_crm_enabled", value: true },
    });
    await page.goto("/admin/propostas");
    await page.getByRole("tab", { name: /Materiais/ }).click();
    await page.waitForTimeout(1500);
    await expect(page.getByText(/Enviar materiais/)).toBeVisible({ timeout: 10000 });
  });

  test("API /api/admin/proposals responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/admin/proposals");
    expect(res.status()).toBe(401);
  });

  test("API /api/admin/commercial-assets responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/admin/commercial-assets");
    expect(res.status()).toBe(401);
  });

  test("API /api/public/proposals/:token rejeita token curto", async ({ request }) => {
    const res = await request.get("/api/public/proposals/short");
    expect(res.status()).toBe(400);
  });

  test("API /api/public/proposals/:token retorna 404 para token válido mas inexistente", async ({ request }) => {
    const fakeToken = "a".repeat(32);
    const res = await request.get(`/api/public/proposals/${fakeToken}`);
    expect(res.status()).toBe(404);
  });

  test("CRUD completo de proposta via API", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);
    const partnerId = await ensureTestPartner(request);

    // Lista templates
    const templatesRes = await request.get("/api/admin/proposals/templates");
    expect(templatesRes.status()).toBe(200);
    const { templates } = await templatesRes.json();
    expect(templates.length).toBeGreaterThanOrEqual(3);

    // Cria proposta com template standard_both
    const createRes = await request.post("/api/admin/proposals", {
      data: {
        partnerId,
        title: `E2E Proposal ${Date.now()}`,
        fromTemplate: "standard_both",
        billingModel: "both",
        campaignPrice: 1500,
        leadPrice: 5,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: "Criado por teste E2E",
      },
    });
    expect(createRes.status()).toBe(201);
    const { proposal } = await createRes.json();
    expect(proposal.id).toBeTruthy();
    expect(proposal.number).toMatch(/^PROP-\d{4}-\d{3}$/);
    expect(proposal.status).toBe("draft");
    expect(proposal.version).toBe(1);
    expect(proposal.publicToken).toBeTruthy();
    expect(proposal.publicToken.length).toBe(32);
    expect(proposal.body).toContain("# Proposta"); // template aplicado

    // Busca por ID
    const getRes = await request.get(`/api/admin/proposals/${proposal.id}`);
    expect(getRes.status()).toBe(200);
    const { proposal: fetched } = await getRes.json();
    expect(fetched.id).toBe(proposal.id);

    // Atualiza
    const patchRes = await request.patch(`/api/admin/proposals/${proposal.id}`, {
      data: { title: `E2E Updated ${Date.now()}` },
    });
    expect(patchRes.status()).toBe(200);

    // Envia (draft → sent)
    const sendRes = await request.post(`/api/admin/proposals/${proposal.id}/send`, {
      data: {},
    });
    expect(sendRes.status()).toBe(200);
    const { proposal: sent, publicUrl } = await sendRes.json();
    expect(sent.status).toBe("sent");
    expect(sent.sentAt).toBeTruthy();
    expect(publicUrl).toContain(`/propostas/${proposal.publicToken}`);

    // Acessa via API pública
    const publicRes = await request.get(`/api/public/proposals/${proposal.publicToken}`);
    expect(publicRes.status()).toBe(200);
    const { proposal: publicProposal } = await publicRes.json();
    expect(publicProposal.id).toBe(proposal.id);
    expect(publicProposal.partner.companyName).toBeTruthy();
    // Não deve retornar campos sensíveis
    expect(publicProposal.notes).toBeUndefined();
    expect(publicProposal.approvedByEmail).toBeUndefined();

    // Aprova (sent → approved)
    const approveRes = await request.post(`/api/admin/proposals/${proposal.id}/approve`, {
      data: { notes: "Aprovado no E2E" },
    });
    expect(approveRes.status()).toBe(200);
    const { proposal: approved } = await approveRes.json();
    expect(approved.status).toBe("approved");
    expect(approved.approvedAt).toBeTruthy();
    expect(approved.approvedByEmail).toBeTruthy();

    // Limpa
    await request.delete(`/api/admin/partners/${partnerId}`);
  });

  test("Rejeição exige motivo", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);
    const partnerId = await ensureTestPartner(request);

    const createRes = await request.post("/api/admin/proposals", {
      data: {
        partnerId,
        title: `E2E Reject Test ${Date.now()}`,
        billingModel: "campaign",
        campaignPrice: 1000,
      },
    });
    const { proposal } = await createRes.json();

    // Envia primeiro
    await request.post(`/api/admin/proposals/${proposal.id}/send`, { data: {} });

    // Tenta rejeitar sem motivo
    const rejectNoReason = await request.post(`/api/admin/proposals/${proposal.id}/reject`, {
      data: {},
    });
    expect(rejectNoReason.status()).toBe(400);

    // Rejeita com motivo
    const rejectRes = await request.post(`/api/admin/proposals/${proposal.id}/reject`, {
      data: { reason: "Cliente achou caro" },
    });
    expect(rejectRes.status()).toBe(200);
    const { proposal: rejected } = await rejectRes.json();
    expect(rejected.status).toBe("rejected");
    expect(rejected.rejectedReason).toBe("Cliente achou caro");

    await request.delete(`/api/admin/partners/${partnerId}`);
  });

  test("Proposta aprovada não pode ser editada", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);
    const partnerId = await ensureTestPartner(request);

    const createRes = await request.post("/api/admin/proposals", {
      data: { partnerId, title: `E2E Locked ${Date.now()}` },
    });
    const { proposal } = await createRes.json();

    await request.post(`/api/admin/proposals/${proposal.id}/send`, { data: {} });
    await request.post(`/api/admin/proposals/${proposal.id}/approve`, { data: {} });

    // Tenta editar proposta aprovada
    const patchRes = await request.patch(`/api/admin/proposals/${proposal.id}`, {
      data: { title: "Tentativa de edição" },
    });
    expect(patchRes.status()).toBe(400);

    await request.delete(`/api/admin/partners/${partnerId}`);
  });

  test("CRUD de CommercialAsset via API", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    // Cria asset (sem upload, via POST JSON)
    const createRes = await request.post("/api/admin/commercial-assets", {
      data: {
        type: "media_kit",
        name: `E2E Media Kit ${Date.now()}`,
        description: "Media kit de teste",
        storageKey: "commercial/test.pdf",
        publicUrl: "https://example.com/test.pdf",
        mimeType: "application/pdf",
        fileSize: 1024000,
        version: "v1.0",
        tags: "recife, teste",
      },
    });
    expect(createRes.status()).toBe(201);
    const { asset } = await createRes.json();
    expect(asset.id).toBeTruthy();
    expect(asset.active).toBe(true);

    // Lista
    const listRes = await request.get("/api/admin/commercial-assets");
    expect(listRes.status()).toBe(200);
    const listData = await listRes.json();
    expect(listData.assets.length).toBeGreaterThan(0);

    // Atualiza
    const patchRes = await request.patch(`/api/admin/commercial-assets/${asset.id}`, {
      data: { description: "Atualizado", active: false },
    });
    expect(patchRes.status()).toBe(200);
    const { asset: updated } = await patchRes.json();
    expect(updated.active).toBe(false);

    // Deleta
    const delRes = await request.delete(`/api/admin/commercial-assets/${asset.id}`);
    expect(delRes.status()).toBe(200);
  });

  test("Validação: tipo inválido rejeitado em CommercialAsset", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    const res = await request.post("/api/admin/commercial-assets", {
      data: {
        type: "tipo_inexistente",
        name: "Teste",
        storageKey: "test",
      },
    });
    expect(res.status()).toBe(400);
  });

  test("Validação: partnerId obrigatório em Proposal", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    const res = await request.post("/api/admin/proposals", {
      data: { title: "Sem parceiro" },
    });
    expect(res.status()).toBe(400);
  });
});
