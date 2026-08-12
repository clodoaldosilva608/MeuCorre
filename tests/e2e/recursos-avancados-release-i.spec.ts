import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { TEST_ACCOUNTS, clearBrowserState } from "./helpers";

// ===== Smoke test — Recursos Avançados (Release I) =====

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

test.describe("Recursos Avançados — Release I", () => {
  // ===== Equipes B2B =====
  test("página /admin/equipes mostra aviso quando flag OFF", async ({ page }) => {
    await adminLogin(page);
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_teams_enabled", value: false },
    });
    await page.goto("/admin/equipes");
    await expect(page.locator("h1")).toContainText("Equipes B2B");
    await expect(page.locator("text=Módulo desativado")).toBeVisible({ timeout: 10000 });
  });

  test("após ativar flag, equipes carrega", async ({ page }) => {
    await adminLogin(page);
    await page.request.post("/api/admin/feature-flags", {
      data: { key: "admin_teams_enabled", value: true },
    });
    await page.goto("/admin/equipes");
    await expect(page.locator("h1")).toContainText("Equipes B2B");
    await page.waitForTimeout(2000);
    const hasButton = await page.getByText(/Novo time/).count();
    const hasEmpty = await page.locator("text=Nenhum time encontrado").count();
    expect(hasButton + hasEmpty).toBeGreaterThan(0);
  });

  test("API /api/admin/teams responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/admin/teams");
    expect(res.status()).toBe(401);
  });

  test("CRUD completo de time via API", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    // Cria time
    const createRes = await request.post("/api/admin/teams", {
      data: {
        name: `E2E Team ${Date.now()}`,
        companyName: "Empresa Teste E2E",
        managerName: "Gestor Teste",
        managerEmail: `gestor-${Date.now()}@test.com`,
        maxMembers: 10,
      },
    });
    expect(createRes.status()).toBe(201);
    const { team } = await createRes.json();
    expect(team.id).toBeTruthy();
    expect(team.maxMembers).toBe(10);

    // Busca por ID
    const getRes = await request.get(`/api/admin/teams/${team.id}`);
    expect(getRes.status()).toBe(200);

    // Atualiza
    const patchRes = await request.patch(`/api/admin/teams/${team.id}`, {
      data: { name: `E2E Team Updated ${Date.now()}` },
    });
    expect(patchRes.status()).toBe(200);

    // Cria convite
    const inviteRes = await request.post(`/api/admin/teams/${team.id}/invites`, {
      data: {
        email: `convidado-${Date.now()}@test.com`,
        name: "Convidado Teste",
        role: "member",
      },
    });
    expect(inviteRes.status()).toBe(201);
    const { invite } = await inviteRes.json();
    expect(invite.token).toBeTruthy();
    expect(invite.token.length).toBe(32);
    expect(invite.status).toBe("pending");

    // Dashboard agregado
    const dashRes = await request.get(`/api/admin/teams/${team.id}/dashboard`);
    expect(dashRes.status()).toBe(200);
    const dashData = await dashRes.json();
    expect(dashData.stats.totalMembers).toBe(0);
    expect(dashData.stats.pendingInvites).toBe(1);

    // Adiciona membro diretamente
    const memberRes = await request.post(`/api/admin/teams/${team.id}/members`, {
      data: {
        name: "Membro Direto",
        email: `membro-${Date.now()}@test.com`,
        role: "admin",
      },
    });
    expect(memberRes.status()).toBe(201);

    // Deleta (soft delete)
    const delRes = await request.delete(`/api/admin/teams/${team.id}`);
    expect(delRes.status()).toBe(200);
    const { team: deleted } = await delRes.json();
    expect(deleted.active).toBe(false);
  });

  test("Convite rejeita email duplicado", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    const createRes = await request.post("/api/admin/teams", {
      data: { name: `E2E Dup Test ${Date.now()}` },
    });
    const { team } = await createRes.json();
    const email = `dup-${Date.now()}@test.com`;

    // Primeiro convite
    const invite1 = await request.post(`/api/admin/teams/${team.id}/invites`, {
      data: { email },
    });
    expect(invite1.status).toBe(201);

    // Segundo convite mesmo email → 409
    const invite2 = await request.post(`/api/admin/teams/${team.id}/invites`, {
      data: { email },
    });
    expect(invite2.status).toBe(409);

    await request.delete(`/api/admin/teams/${team.id}`);
  });

  test("Convite público: GET retorna detalhes, POST accept cria membro", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    // Cria time + convite
    const teamRes = await request.post("/api/admin/teams", {
      data: { name: `E2E Invite Test ${Date.now()}`, maxMembers: 5 },
    });
    const { team } = await teamRes.json();

    const inviteRes = await request.post(`/api/admin/teams/${team.id}/invites`, {
      data: { email: `accept-${Date.now()}@test.com`, name: "Convidado", role: "member" },
    });
    const { invite } = await inviteRes.json();

    // GET público retorna detalhes
    const publicGet = await request.get(`/api/public/teams/invite/${invite.token}`);
    expect(publicGet.status()).toBe(200);
    const publicData = await publicGet.json();
    expect(publicData.invite.team.name).toBeTruthy();
    expect(publicData.invite.role).toBe("member");

    // POST accept cria membro
    const acceptRes = await request.post(`/api/public/teams/invite/${invite.token}/accept`, {
      data: { name: "Convidado Aceito", phone: "(81) 99999-9999" },
    });
    expect(acceptRes.status()).toBe(201);
    const acceptData = await acceptRes.json();
    expect(acceptData.accepted).toBe(true);
    expect(acceptData.member.status).toBe("active");

    // Segundo accept → 409 (já é membro)
    const accept2 = await request.post(`/api/public/teams/invite/${invite.token}/accept`, {
      data: { name: "Tentativa 2" },
    });
    expect(accept2.status()).toBe(409);

    await request.delete(`/api/admin/teams/${team.id}`);
  });

  test("Convite público: token inválido retorna 404", async ({ request }) => {
    const fakeToken = "a".repeat(32);
    const res = await request.get(`/api/public/teams/invite/${fakeToken}`);
    expect(res.status()).toBe(404);
  });

  // ===== Portal do Parceiro =====
  test("API /api/admin/partner-portal/tokens responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/admin/partner-portal/tokens");
    expect(res.status()).toBe(401);
  });

  test("Portal: cria token + acesso público retorna dados", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    // Cria parceiro
    const partnerRes = await request.post("/api/admin/partners", {
      data: {
        companyName: `E2E Portal Partner ${Date.now()}`,
        city: "Recife",
        state: "PE",
      },
    });
    const { partner } = await partnerRes.json();

    // Cria token de portal
    const tokenRes = await request.post("/api/admin/partner-portal/tokens", {
      data: {
        partnerId: partner.id,
        canViewCampaigns: true,
        canViewMetrics: true,
        canViewProposals: true,
      },
    });
    expect(tokenRes.status()).toBe(201);
    const { token: portalToken } = await tokenRes.json();
    expect(portalToken.token).toBeTruthy();
    expect(portalToken.token.length).toBe(32);

    // Acesso público retorna dados do parceiro
    const publicRes = await request.get(`/api/public/portal/${portalToken.token}`);
    expect(publicRes.status()).toBe(200);
    const publicData = await publicRes.json();
    expect(publicData.partner.companyName).toContain("E2E Portal Partner");
    expect(publicData.permissions.canViewCampaigns).toBe(true);
    expect(publicData.metrics).toBeTruthy();
    expect(Array.isArray(publicData.campaigns)).toBe(true);

    // Limpa
    await request.delete(`/api/admin/partners/${partner.id}`);
  });

  test("Portal: token inválido retorna 404", async ({ request }) => {
    const fakeToken = "b".repeat(32);
    const res = await request.get(`/api/public/portal/${fakeToken}`);
    expect(res.status()).toBe(404);
  });

  test("Portal: token revogado retorna 403", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);

    const partnerRes = await request.post("/api/admin/partners", {
      data: { companyName: `E2E Revoke ${Date.now()}` },
    });
    const { partner } = await partnerRes.json();

    const tokenRes = await request.post("/api/admin/partner-portal/tokens", {
      data: { partnerId: partner.id },
    });
    const { token: portalToken } = await tokenRes.json();

    // Revoga
    await request.patch(`/api/admin/partner-portal/tokens/${portalToken.id}`, {
      data: { active: false },
    });

    // Acesso → 403
    const publicRes = await request.get(`/api/public/portal/${portalToken.token}`);
    expect(publicRes.status()).toBe(403);

    await request.delete(`/api/admin/partners/${partner.id}`);
  });

  // ===== Radar do Prejuízo =====
  test("API /api/app/radar/alerts responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/app/radar/alerts");
    expect(res.status()).toBe(401);
  });

  test("Radar scan responde 401 sem auth", async ({ request }) => {
    const res = await request.post("/api/app/radar/scan");
    expect(res.status()).toBe(401);
  });

  // ===== MeuCorre Score =====
  test("API /api/app/score/current responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/app/score/current");
    expect(res.status()).toBe(401);
  });

  test("API /api/app/score/history responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/app/score/history");
    expect(res.status()).toBe(401);
  });

  // ===== Desafio 7 dias =====
  test("API /api/app/challenge/status responde 401 sem auth", async ({ request }) => {
    const res = await request.get("/api/app/challenge/status");
    expect(res.status()).toBe(401);
  });

  test("API /api/app/challenge/start responde 401 sem auth", async ({ request }) => {
    const res = await request.post("/api/app/challenge/start");
    expect(res.status()).toBe(401);
  });

  // ===== Página de convite público =====
  test("página /equipes/convite/[token] carrega (token inexistente mostra erro)", async ({ page }) => {
    await page.goto(`/equipes/convite/${"a".repeat(32)}`);
    await expect(page.locator("text=Convite indisponível")).toBeVisible({ timeout: 10000 });
  });

  // ===== Página do portal público =====
  test("página /portal/[token] carrega (token inexistente mostra erro)", async ({ page }) => {
    await page.goto(`/portal/${"b".repeat(32)}`);
    await expect(page.locator("text=Portal indisponível")).toBeVisible({ timeout: 10000 });
  });

  // ===== Validações =====
  test("Equipes: cria time sem name retorna 400", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);
    const res = await request.post("/api/admin/teams", {
      data: { companyName: "Sem nome" },
    });
    expect(res.status()).toBe(400);
  });

  test("Equipes: convite sem email retorna 400", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);
    const teamRes = await request.post("/api/admin/teams", {
      data: { name: `E2E Validation ${Date.now()}` },
    });
    const { team } = await teamRes.json();

    const inviteRes = await request.post(`/api/admin/teams/${team.id}/invites`, {
      data: { name: "Sem email" },
    });
    expect(inviteRes.status).toBe(400);

    await request.delete(`/api/admin/teams/${team.id}`);
  });

  test("Portal: cria token sem partnerId retorna 400", async ({ request }) => {
    expect(await adminLoginAPI(request)).toBe(true);
    const res = await request.post("/api/admin/partner-portal/tokens", {
      data: { canViewCampaigns: true },
    });
    expect(res.status()).toBe(400);
  });
});
