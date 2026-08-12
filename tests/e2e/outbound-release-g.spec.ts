import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { TEST_ACCOUNTS, clearBrowserState } from "./helpers";

// ===== Smoke test — Outbound Supervisionado (Release G) =====

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

async function ensureTestPartner(
  request: APIRequestContext,
): Promise<{ partnerId: string; contactId: string }> {
  const partnerRes = await request.post("/api/admin/partners", {
    data: {
      companyName: `E2E Outbound Partner ${Date.now()}`,
      city: "Recife",
      state: "PE",
      category: "oficina",
      phone: "(81) 99999-9999",
      email: `e2e-outbound-${Date.now()}@test.com`,
    },
  });
  expect(partnerRes.status()).toBe(201);
  const { partner } = await partnerRes.json();

  // Adiciona contato
  const contactRes = await request.post(
    `/api/admin/partners/${partner.id}/contacts`,
    {
      data: {
        name: "Contato E2E",
        email: "contato.e2e@test.com",
        phone: "(81) 98888-8888",
        isPrimary: true,
      },
    },
  );
  expect(contactRes.status()).toBe(201);
  const { contact } = await contactRes.json();

  return { partnerId: partner.id, contactId: contact.id };
}

async function ensureApprovedTemplate(request: APIRequestContext): Promise<string> {
  const createRes = await request.post("/api/admin/outbound/templates", {
    data: {
      name: `E2E Template ${Date.now()}`,
      channel: "whatsapp",
      objective: "permission",
      body: "Olá {NOME}! Aqui é do MeuCorre. Vi que a {EMPRESA} em {CIDADE}/{ESTADO} atende entregadores. Topa uma parceria?",
      cta: "Posso te mandar mais informações?",
      optOutText: "Responda PARE para não receber mais",
      status: "approved",
    },
  });
  expect(createRes.status()).toBe(201);
  const { template } = await createRes.json();
  return template.id;
}

test.describe("Outbound Supervisionado — Release G", () => {
  test("página /admin/outbound mostra aviso quando flags OFF", async ({ page }) => {
    await adminLogin(page);
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "partner_outbound_preview_enabled", value: false },
    });
    await page.goto("/admin/outbound");
    await expect(page.locator("h1")).toContainText("Outbound Supervisionado");
    await expect(page.locator("text=Módulo desativado")).toBeVisible({ timeout: 10000 });
  });

  test("após ativar flags, outbound carrega com aviso de princípios", async ({ page }) => {
    await adminLogin(page);
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_partner_crm_enabled", value: true },
    });
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "partner_outbound_preview_enabled", value: true },
    });
    await page.goto("/admin/outbound");
    await expect(page.locator("h1")).toContainText("Outbound Supervisionado");
    // Aviso de princípios sempre visível
    await expect(page.locator("text=Princípios do outbound supervisionado")).toBeVisible({
      timeout: 10000,
    });
    // Tabs
    await expect(page.getByRole("tab", { name: /Mensagens/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Templates/ })).toBeVisible();
  });

  test("API /api/admin/outbound/templates responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/admin/outbound/templates");
    expect(res.status()).toBe(401);
  });

  test("API /api/admin/outbound/logs responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/admin/outbound/logs");
    expect(res.status()).toBe(401);
  });

  test("CRUD completo de template via API", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    // Cria
    const createRes = await request.post("/api/admin/outbound/templates", {
      data: {
        name: `E2E CRUD Template ${Date.now()}`,
        channel: "email",
        objective: "discovery",
        subject: "Parceria MeuCorre × {EMPRESA}",
        body: "Olá {NOME},\n\nVi que a {EMPRESA} em {CIDADE} atende entregadores. Podemos conversar?\n\n{MOTIVO}",
        cta: "Topa uma call de 15 min?",
        optOutText: "Responda PARE para não receber mais",
        status: "draft",
      },
    });
    expect(createRes.status()).toBe(201);
    const { template } = await createRes.json();
    expect(template.id).toBeTruthy();
    expect(template.version).toBe(1);
    expect(template.variables).toContain("NOME");
    expect(template.variables).toContain("EMPRESA");
    expect(template.variables).toContain("CIDADE");
    expect(template.variables).toContain("MOTIVO");

    // Busca
    const getRes = await request.get(`/api/admin/outbound/templates/${template.id}`);
    expect(getRes.status()).toBe(200);

    // Atualiza
    const patchRes = await request.patch(`/api/admin/outbound/templates/${template.id}`, {
      data: { status: "approved", cta: "Call amanhã?" },
    });
    expect(patchRes.status()).toBe(200);
    const { template: updated } = await patchRes.json();
    expect(updated.status).toBe("approved");
    expect(updated.cta).toBe("Call amanhã?");

    // Nova versão
    const versionRes = await request.post(
      `/api/admin/outbound/templates/${template.id}/version`,
      { data: { body: "Nova versão do body para {NOME}" } },
    );
    expect(versionRes.status()).toBe(201);
    const { template: newVersion, previousVersion } = await versionRes.json();
    expect(newVersion.version).toBe(2);
    expect(newVersion.parentTemplateId).toBe(template.id);
    expect(newVersion.body).toContain("Nova versão");
    expect(previousVersion.archived).toBe(true);

    // Soft delete (archive)
    const delRes = await request.delete(`/api/admin/outbound/templates/${newVersion.id}`);
    expect(delRes.status()).toBe(200);
    const { template: archived } = await delRes.json();
    expect(archived.status).toBe("archived");
  });

  test("Dry-run substitui variáveis sem enviar", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);
    const templateId = await ensureApprovedTemplate(request);

    const dryRunRes = await request.post(
      `/api/admin/outbound/templates/${templateId}/dry-run`,
      {
        data: {
          preview: {
            NOME: "Maria",
            EMPRESA: "Oficina Maria",
            CIDADE: "Recife",
            ESTADO: "PE",
            CATEGORIA: "oficina",
            MOTIVO: "Atende muitos entregadores",
          },
        },
      },
    );
    expect(dryRunRes.status()).toBe(200);
    const data = await dryRunRes.json();
    expect(data.dryRun).toBe(true);
    expect(data.rendered.body).toContain("Maria");
    expect(data.rendered.body).toContain("Oficina Maria");
    expect(data.rendered.body).toContain("Recife/PE");
    expect(data.missingVariables).toEqual([]);
  });

  test("Dry-run detecta variáveis não substituídas", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);
    const templateId = await ensureApprovedTemplate(request);

    const dryRunRes = await request.post(
      `/api/admin/outbound/templates/${templateId}/dry-run`,
      {
        data: {
          preview: { NOME: "João" }, // faltam EMPRESA, CIDADE, etc.
        },
      },
    );
    expect(dryRunRes.status()).toBe(200);
    const data = await dryRunRes.json();
    expect(data.missingVariables).toContain("EMPRESA");
    expect(data.missingVariables).toContain("CIDADE");
    expect(data.warnings.length).toBeGreaterThan(0);
  });

  test("Workflow completo: prepare → approve → send (com feature flag)", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    // Ativa feature flag send
    await request.post("/api/admin/feature-flags", {
      data: { key: "partner_outbound_send_enabled", value: true },
    });

    const { partnerId, contactId } = await ensureTestPartner(request);
    const templateId = await ensureApprovedTemplate(request);

    // Prepare
    const prepareRes = await request.post("/api/admin/outbound/logs/prepare", {
      data: {
        items: [
          {
            partnerId,
            contactId,
            templateId,
            channel: "whatsapp",
          },
        ],
      },
    });
    expect(prepareRes.status()).toBe(201);
    const prepareData = await prepareRes.json();
    expect(prepareData.created).toBe(1);
    expect(prepareData.blocked).toBe(0);

    // Busca o log criado
    const listRes = await request.get(
      `/api/admin/outbound/logs?partnerId=${partnerId}&status=preparado`,
    );
    const listData = await listRes.json();
    expect(listData.logs.length).toBeGreaterThan(0);
    const logId = listData.logs[0].id;

    // Approve
    const approveRes = await request.post(`/api/admin/outbound/logs/${logId}/approve`, {
      data: {},
    });
    expect(approveRes.status()).toBe(200);
    const { log: approved } = await approveRes.json();
    expect(approved.status).toBe("aguardando_aprovacao");
    expect(approved.approvedByEmail).toBeTruthy();

    // Send
    const sendRes = await request.post(`/api/admin/outbound/logs/${logId}/send`, {
      data: {},
    });
    expect(sendRes.status()).toBe(200);
    const { log: sent } = await sendRes.json();
    expect(sent.status).toBe("enviado");
    expect(sent.sentByEmail).toBeTruthy();

    // Limpa
    await request.delete(`/api/admin/partners/${partnerId}`);

    // Desativa flag send
    await request.post("/api/admin/feature-flags", {
      data: { key: "partner_outbound_send_enabled", value: false },
    });
  });

  test("Send bloqueado sem feature flag", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    // Garante que flag está OFF
    await request.post("/api/admin/feature-flags", {
      data: { key: "partner_outbound_send_enabled", value: false },
    });

    const { partnerId, contactId } = await ensureTestPartner(request);
    const templateId = await ensureApprovedTemplate(request);

    // Prepare
    const prepareRes = await request.post("/api/admin/outbound/logs/prepare", {
      data: {
        items: [{ partnerId, contactId, templateId, channel: "whatsapp" }],
      },
    });
    const prepareData = await prepareRes.json();
    const logId = prepareData.created > 0
      ? (await (await request.get(`/api/admin/outbound/logs?partnerId=${partnerId}&status=preparado`)).json()).logs[0].id
      : null;
    expect(logId).toBeTruthy();

    // Approve
    await request.post(`/api/admin/outbound/logs/${logId}/approve`, { data: {} });

    // Tenta send → 403 FEATURE_FLAG_OFF
    const sendRes = await request.post(`/api/admin/outbound/logs/${logId}/send`, {
      data: {},
    });
    expect(sendRes.status()).toBe(403);
    const err = await sendRes.json();
    expect(err.error).toBe("FEATURE_FLAG_OFF");

    await request.delete(`/api/admin/partners/${partnerId}`);
  });

  test("Opt-out é permanente e bloqueia prepare", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    const { partnerId, contactId } = await ensureTestPartner(request);
    const templateId = await ensureApprovedTemplate(request);

    // Marca contato como opt-out via PATCH do contato
    await request.patch(`/api/admin/partners/${partnerId}/contacts/${contactId}`, {
      data: { optOut: true },
    });

    // Tenta prepare → deve ser bloqueado
    const prepareRes = await request.post("/api/admin/outbound/logs/prepare", {
      data: {
        items: [{ partnerId, contactId, templateId, channel: "whatsapp" }],
      },
    });
    expect(prepareRes.status()).toBe(400);
    const data = await prepareRes.json();
    expect(data.blocked).toBe(1);
    expect(data.created).toBe(0);
    expect(data.errorDetails[0].error).toContain("OPT_OUT_BLOCKED");

    await request.delete(`/api/admin/partners/${partnerId}`);
  });

  test("Opt-out via endpoint marca contato PERMANENTE", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    // Ativa flag send para workflow completo
    await request.post("/api/admin/feature-flags", {
      data: { key: "partner_outbound_send_enabled", value: true },
    });

    const { partnerId, contactId } = await ensureTestPartner(request);
    const templateId = await ensureApprovedTemplate(request);

    // Prepare + approve + send
    await request.post("/api/admin/outbound/logs/prepare", {
      data: { items: [{ partnerId, contactId, templateId, channel: "whatsapp" }] },
    });
    const listRes = await request.get(
      `/api/admin/outbound/logs?partnerId=${partnerId}&status=preparado`,
    );
    const logId = (await listRes.json()).logs[0].id;

    await request.post(`/api/admin/outbound/logs/${logId}/approve`, { data: {} });
    await request.post(`/api/admin/outbound/logs/${logId}/send`, { data: {} });

    // Marca opt-out via endpoint
    const optOutRes = await request.post(`/api/admin/outbound/logs/${logId}/opt-out`, {
      data: {},
    });
    expect(optOutRes.status()).toBe(200);
    const data = await optOutRes.json();
    expect(data.contactOptOut).toBe(true);
    expect(data.permanent).toBe(true);
    expect(data.log.status).toBe("opt_out");

    // Verifica que contato está marcado
    const contactRes = await request.get(`/api/admin/partners/${partnerId}`);
    const contactData = await contactRes.json();
    const contact = contactData.partner.contacts.find((c: { id: string }) => c.id === contactId);
    expect(contact.optOut).toBe(true);

    // Tenta preparar novamente → bloqueado
    const prepareAgain = await request.post("/api/admin/outbound/logs/prepare", {
      data: { items: [{ partnerId, contactId, templateId, channel: "whatsapp" }] },
    });
    const prepareData = await prepareAgain.json();
    expect(prepareData.blocked).toBe(1);
    expect(prepareData.created).toBe(0);

    await request.delete(`/api/admin/partners/${partnerId}`);
    await request.post("/api/admin/feature-flags", {
      data: { key: "partner_outbound_send_enabled", value: false },
    });
  });

  test("Classificação manual de resposta", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    // Ativa flag send
    await request.post("/api/admin/feature-flags", {
      data: { key: "partner_outbound_send_enabled", value: true },
    });

    const { partnerId, contactId } = await ensureTestPartner(request);
    const templateId = await ensureApprovedTemplate(request);

    await request.post("/api/admin/outbound/logs/prepare", {
      data: { items: [{ partnerId, contactId, templateId, channel: "whatsapp" }] },
    });
    const listRes = await request.get(
      `/api/admin/outbound/logs?partnerId=${partnerId}&status=preparado`,
    );
    const logId = (await listRes.json()).logs[0].id;

    await request.post(`/api/admin/outbound/logs/${logId}/approve`, { data: {} });
    await request.post(`/api/admin/outbound/logs/${logId}/send`, { data: {} });

    // Classifica manualmente
    const classifyRes = await request.post(`/api/admin/outbound/logs/${logId}/classify`, {
      data: {
        method: "manual",
        classification: "interessado",
        responseText: "Tenho interesse, me manda mais informações",
      },
    });
    expect(classifyRes.status()).toBe(200);
    const data = await classifyRes.json();
    expect(data.classification).toBe("interessado");
    expect(data.classificationLabel).toBe("Interessado");
    expect(data.nextAction).toBeTruthy();
    expect(data.log.status).toBe("interessado");
    expect(data.log.responseClassifiedByMethod).toBe("manual");

    await request.delete(`/api/admin/partners/${partnerId}`);
    await request.post("/api/admin/feature-flags", {
      data: { key: "partner_outbound_send_enabled", value: false },
    });
  });

  test("Classificação inválida rejeitada", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    // Ativa flag send
    await request.post("/api/admin/feature-flags", {
      data: { key: "partner_outbound_send_enabled", value: true },
    });

    const { partnerId, contactId } = await ensureTestPartner(request);
    const templateId = await ensureApprovedTemplate(request);

    await request.post("/api/admin/outbound/logs/prepare", {
      data: { items: [{ partnerId, contactId, templateId, channel: "whatsapp" }] },
    });
    const listRes = await request.get(
      `/api/admin/outbound/logs?partnerId=${partnerId}&status=preparado`,
    );
    const logId = (await listRes.json()).logs[0].id;

    await request.post(`/api/admin/outbound/logs/${logId}/approve`, { data: {} });
    await request.post(`/api/admin/outbound/logs/${logId}/send`, { data: {} });

    // Classificação inválida
    const classifyRes = await request.post(`/api/admin/outbound/logs/${logId}/classify`, {
      data: { method: "manual", classification: "classificacao_inexistente" },
    });
    expect(classifyRes.status()).toBe(400);

    await request.delete(`/api/admin/partners/${partnerId}`);
    await request.post("/api/admin/feature-flags", {
      data: { key: "partner_outbound_send_enabled", value: false },
    });
  });

  test("Validações: campos obrigatórios em template", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    // Sem name
    const res1 = await request.post("/api/admin/outbound/templates", {
      data: { channel: "whatsapp", objective: "permission", body: "test" },
    });
    expect(res1.status()).toBe(400);

    // channel inválido
    const res2 = await request.post("/api/admin/outbound/templates", {
      data: { name: "Test", channel: "telegram", objective: "permission", body: "test" },
    });
    expect(res2.status()).toBe(400);

    // email sem subject
    const res3 = await request.post("/api/admin/outbound/templates", {
      data: { name: "Test", channel: "email", objective: "permission", body: "test" },
    });
    expect(res3.status()).toBe(400);
  });

  test("Prepare rejeita lote > 100", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    const items = Array.from({ length: 101 }, () => ({
      partnerId: "fake",
      contactId: "fake",
      templateId: "fake",
      channel: "whatsapp",
    }));

    const res = await request.post("/api/admin/outbound/logs/prepare", {
      data: { items },
    });
    expect(res.status()).toBe(400);
  });
});
