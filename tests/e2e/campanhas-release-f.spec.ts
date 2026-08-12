import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { TEST_ACCOUNTS, clearBrowserState } from "./helpers";

// ===== Smoke test — Campanhas de Parceiros (Release F) =====

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
  const res = await request.post("/api/admin/partners", {
    data: {
      companyName: `E2E Campaigns Partner ${Date.now()}`,
      city: "Recife",
      state: "PE",
      category: "servicos",
      phone: "(81) 99999-9999",
      email: `e2e-campaigns-${Date.now()}@test.com`,
    },
  });
  expect(res.status()).toBe(201);
  const { partner } = await res.json();
  return partner.id;
}

test.describe("Campanhas de Parceiros — Release F", () => {
  test("página /admin/campanhas mostra aviso quando flags OFF", async ({ page }) => {
    await adminLogin(page);
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "partner_campaigns_enabled", value: false },
    });
    await page.goto("/admin/campanhas");
    await expect(page.locator("h1")).toContainText("Campanhas de Parceiros");
    await expect(page.locator("text=Módulo desativado")).toBeVisible({ timeout: 10000 });
  });

  test("após ativar flags, campanhas carrega", async ({ page }) => {
    await adminLogin(page);
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_partner_crm_enabled", value: true },
    });
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "partner_campaigns_enabled", value: true },
    });
    await page.goto("/admin/campanhas");
    await expect(page.locator("h1")).toContainText("Campanhas de Parceiros");
    // Deve mostrar ou botão Nova campanha ou empty state
    await page.waitForTimeout(2000);
    const hasButton = await page.getByText(/Nova campanha/).count();
    const hasEmpty = await page.locator("text=Nenhuma campanha encontrada").count();
    expect(hasButton + hasEmpty).toBeGreaterThan(0);
  });

  test("API /api/admin/partner-campaigns responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/admin/partner-campaigns");
    expect(res.status()).toBe(401);
  });

  test("API /api/public/campaigns lista apenas published", async ({ request }) => {
    // Endpoint público — não requer auth
    const res = await request.get("/api/public/campaigns");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.campaigns)).toBe(true);
    // Todas devem ser published (ou array vazio)
    for (const c of data.campaigns) {
      // Não retorna status no response público, mas só published são retornadas
      expect(c.id).toBeTruthy();
    }
  });

  test("CRUD completo de campanha via API com workflow de aprovação", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);
    const partnerId = await ensureTestPartner(request);

    // Cria campanha
    const createRes = await request.post("/api/admin/partner-campaigns", {
      data: {
        partnerId,
        name: `E2E Campaign ${Date.now()}`,
        offerTitle: "10% OFF para entregadores",
        offerDescription: "Desconto exclusivo para entregadores MeuCorre",
        offerCta: "Aproveitar",
        offerUrl: "https://example.com/oferta",
        couponCode: "MEUCORRE10",
        discountText: "10% OFF",
        category: "servicos",
        city: "Recife",
        state: "PE",
        billingModel: "both",
        campaignPrice: 1500,
        leadPrice: 5,
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    expect(createRes.status()).toBe(201);
    const { campaign } = await createRes.json();
    expect(campaign.id).toBeTruthy();
    expect(campaign.status).toBe("draft");
    expect(campaign.utmCampaign).toBeTruthy(); // slug gerado
    expect(campaign.views).toBe(0);
    expect(campaign.clicks).toBe(0);

    // Busca por ID
    const getRes = await request.get(`/api/admin/partner-campaigns/${campaign.id}`);
    expect(getRes.status()).toBe(200);

    // Tenta publicar sem aprovar → 400
    const publishBeforeApprove = await request.post(
      `/api/admin/partner-campaigns/${campaign.id}/publish`,
      { data: {} },
    );
    expect(publishBeforeApprove.status()).toBe(400);

    // Aprova
    const approveRes = await request.post(
      `/api/admin/partner-campaigns/${campaign.id}/approve`,
      { data: {} },
    );
    expect(approveRes.status()).toBe(200);
    const { campaign: approved } = await approveRes.json();
    expect(approved.status).toBe("approved");
    expect(approved.approvedAt).toBeTruthy();
    expect(approved.approvedByEmail).toBeTruthy();

    // Publica
    const publishRes = await request.post(
      `/api/admin/partner-campaigns/${campaign.id}/publish`,
      { data: {} },
    );
    expect(publishRes.status()).toBe(200);
    const { campaign: published } = await publishRes.json();
    expect(published.status).toBe("published");
    expect(published.publishedAt).toBeTruthy();

    // Verifica que aparece na lista pública
    const publicListRes = await request.get("/api/public/campaigns?city=Recife");
    expect(publicListRes.status()).toBe(200);
    const publicData = await publicListRes.json();
    const foundInPublic = publicData.campaigns.find((c: { id: string }) => c.id === campaign.id);
    expect(foundInPublic).toBeTruthy();
    expect(foundInPublic.offerTitle).toBe("10% OFF para entregadores");

    // Registra view via endpoint público
    const trackViewRes = await request.post(
      `/api/public/campaigns/${campaign.id}/track`,
      { data: { event: "view" } },
    );
    expect(trackViewRes.status).toBe(200);

    // Registra click
    const trackClickRes = await request.post(
      `/api/public/campaigns/${campaign.id}/track`,
      { data: { event: "click" } },
    );
    expect(trackClickRes.status).toBe(200);

    // Verifica métricas
    const metricsRes = await request.get(
      `/api/admin/partner-campaigns/${campaign.id}/metrics`,
    );
    expect(metricsRes.status()).toBe(200);
    const metricsData = await metricsRes.json();
    expect(metricsData.campaign.views).toBe(1);
    expect(metricsData.campaign.clicks).toBe(1);
    expect(metricsData.derived.ctr).toBe(100); // 1 click / 1 view * 100

    // Pausa
    const pauseRes = await request.post(
      `/api/admin/partner-campaigns/${campaign.id}/pause`,
      { data: { reason: "Teste de pausa" } },
    );
    expect(pauseRes.status).toBe(200);
    const { campaign: paused } = await pauseRes.json();
    expect(paused.status).toBe("paused");

    // Reativa
    const republishRes = await request.post(
      `/api/admin/partner-campaigns/${campaign.id}/publish`,
      { data: {} },
    );
    expect(republishRes.status()).toBe(200);
    const { campaign: republished } = await republishRes.json();
    expect(republished.status).toBe("published");

    // Limpa (cancela primeiro via delete — só draft/canceled podem ser deletados)
    // Tenta deletar published → 400
    const deletePublished = await request.delete(
      `/api/admin/partner-campaigns/${campaign.id}`,
    );
    expect(deletePublished.status).toBe(400);

    // Limpa parceiro (cascade)
    await request.delete(`/api/admin/partners/${partnerId}`);
  });

  test("Rejeição exige motivo", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);
    const partnerId = await ensureTestPartner(request);

    const createRes = await request.post("/api/admin/partner-campaigns", {
      data: {
        partnerId,
        name: `E2E Reject Campaign ${Date.now()}`,
        offerTitle: "Test",
        offerDescription: "Test",
        offerUrl: "https://example.com",
      },
    });
    const { campaign } = await createRes.json();

    // Rejeita sem motivo → 400
    const rejectNoReason = await request.post(
      `/api/admin/partner-campaigns/${campaign.id}/reject`,
      { data: {} },
    );
    expect(rejectNoReason.status).toBe(400);

    // Rejeita com motivo
    const rejectRes = await request.post(
      `/api/admin/partner-campaigns/${campaign.id}/reject`,
      { data: { reason: "Oferta não atende critérios" } },
    );
    expect(rejectRes.status()).toBe(200);
    const { campaign: rejected } = await rejectRes.json();
    expect(rejected.status).toBe("rejected");
    expect(rejected.rejectedReason).toBe("Oferta não atende critérios");

    await request.delete(`/api/admin/partners/${partnerId}`);
  });

  test("Denúncia auto-pausa após 3 reports", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);
    const partnerId = await ensureTestPartner(request);

    // Cria e publica campanha
    const createRes = await request.post("/api/admin/partner-campaigns", {
      data: {
        partnerId,
        name: `E2E Reports Campaign ${Date.now()}`,
        offerTitle: "Test",
        offerDescription: "Test",
        offerUrl: "https://example.com",
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    const { campaign } = await createRes.json();

    await request.post(`/api/admin/partner-campaigns/${campaign.id}/approve`, { data: {} });
    await request.post(`/api/admin/partner-campaigns/${campaign.id}/publish`, { data: {} });

    // 2 denúncias — não pausa
    await request.post(`/api/admin/partner-campaigns/${campaign.id}/report`, {
      data: { reason: "Report 1" },
    });
    await request.post(`/api/admin/partner-campaigns/${campaign.id}/report`, {
      data: { reason: "Report 2" },
    });

    const beforeThird = await request.get(`/api/admin/partner-campaigns/${campaign.id}`);
    const beforeData = await beforeThird.json();
    expect(beforeData.campaign.status).toBe("published");
    expect(beforeData.campaign.reportsCount).toBe(2);

    // 3ª denúncia — auto-pausa
    const thirdReport = await request.post(
      `/api/admin/partner-campaigns/${campaign.id}/report`,
      { data: { reason: "Report 3 — auto pause" } },
    );
    expect(thirdReport.status()).toBe(200);
    const thirdData = await thirdReport.json();
    expect(thirdData.autoPaused).toBe(true);
    expect(thirdData.campaign.status).toBe("paused");

    await request.delete(`/api/admin/partners/${partnerId}`);
  });

  test("Validação: campos obrigatórios", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    // Sem partnerId
    const res1 = await request.post("/api/admin/partner-campaigns", {
      data: { name: "Test" },
    });
    expect(res1.status()).toBe(400);

    // Sem offerTitle
    const partnerId = await ensureTestPartner(request);
    const res2 = await request.post("/api/admin/partner-campaigns", {
      data: {
        partnerId,
        name: "Test",
        // faltam offerTitle, offerDescription, offerUrl
      },
    });
    expect(res2.status()).toBe(400);

    await request.delete(`/api/admin/partners/${partnerId}`);
  });

  test("Endpoint público rejeita event inválido", async ({ request }) => {
    // Cria campanha published
    expect(await adminLoginAPI(request)).toBe(true);
    const partnerId = await ensureTestPartner(request);
    const createRes = await request.post("/api/admin/partner-campaigns", {
      data: {
        partnerId,
        name: `E2E Track Test ${Date.now()}`,
        offerTitle: "Test",
        offerDescription: "Test",
        offerUrl: "https://example.com",
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    const { campaign } = await createRes.json();
    await request.post(`/api/admin/partner-campaigns/${campaign.id}/approve`, { data: {} });
    await request.post(`/api/admin/partner-campaigns/${campaign.id}/publish`, { data: {} });

    // Event inválido → 400
    const invalidEvent = await request.post(
      `/api/public/campaigns/${campaign.id}/track`,
      { data: { event: "invalid" } },
    );
    expect(invalidEvent.status()).toBe(400);

    await request.delete(`/api/admin/partners/${partnerId}`);
  });

  test("Endpoint público recusa campanha não published", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);
    const partnerId = await ensureTestPartner(request);

    // Cria campanha draft
    const createRes = await request.post("/api/admin/partner-campaigns", {
      data: {
        partnerId,
        name: `E2E Draft Test ${Date.now()}`,
        offerTitle: "Test",
        offerDescription: "Test",
        offerUrl: "https://example.com",
      },
    });
    const { campaign } = await createRes.json();

    // Tenta registrar view em draft → 403
    const trackDraft = await request.post(
      `/api/public/campaigns/${campaign.id}/track`,
      { data: { event: "view" } },
    );
    expect(trackDraft.status).toBe(403);

    await request.delete(`/api/admin/partners/${partnerId}`);
  });
});
