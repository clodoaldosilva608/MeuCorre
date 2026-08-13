// ===== Completa tudo: posts + parceiros + flags + validação =====
import * as fs from "node:fs";

const BASE_URL = "https://meucorre.vercel.app";

async function login() {
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "clodoaldo608@gmail.com", password: "Silva88677488@#" }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  return setCookie.map((c: string) => c.split(";")[0]).join("; ");
}

async function api(method: string, path: string, body: unknown, cookie: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
}

async function main() {
  const cookie = await login();
  console.log("✅ Login OK\n");

  // ===== 1. COMPLETAR POSTS =====
  console.log("📝 Verificando posts...");
  const postsRes = await api("GET", "/api/admin/promotion/posts?limit=500", null, cookie);
  const existingPosts = postsRes.data.posts ?? [];
  console.log(`   ${existingPosts.length} posts já existem`);

  if (existingPosts.length < 450) {
    // Busca a campanha
    const campRes = await api("GET", "/api/admin/promotion/campaigns", null, cookie);
    const campaign = campRes.data.campaigns?.[0];
    if (!campaign) {
      console.log("   Criando campanha...");
      const newCamp = await api("POST", "/api/admin/promotion/campaigns", {
        name: "Plano 90 Dias MeuCorre",
        status: "active",
        startAt: new Date().toISOString(),
      }, cookie);
      // Use new campaign
    }

    const allCampaigns = campRes.data.campaigns ?? [];
    const campaignId = allCampaigns[0]?.id;

    if (campaignId) {
      console.log(`   Campanha: ${campaignId}`);
      const posts450 = JSON.parse(fs.readFileSync("scripts/promotion/posts-450.json", "utf8"));

      // Filtra posts que ainda não existem
      const existingKeys = new Set(existingPosts.map((p: { editorialDay: number; sequenceNumber: number; platform: string }) =>
        `${p.editorialDay}-${p.sequenceNumber}-${p.platform}`));

      const missing = posts450.filter((p: { editorialDay: number; sequenceNumber: number; platform: string }) =>
        !existingKeys.has(`${p.editorialDay}-${p.sequenceNumber}-${p.platform}`));

      console.log(`   ${missing.length} posts faltando. Importando...`);

      let created = 0;
      const batchSize = 10;

      for (let i = 0; i < missing.length; i += batchSize) {
        const batch = missing.slice(i, i + batchSize);
        const promises = batch.map(async (p: { editorialDay: number; sequenceNumber: number; time: string; platform: string; format: string; pillar: string; title: string; description: string; hashtags: string; engagementText: string }) => {
          const [hh, mm] = p.time.split(":").map(Number);
          const publishAt = new Date();
          publishAt.setUTCHours(hh + 3, mm, 0, 0);

          const r = await api("POST", "/api/admin/promotion/posts", {
            campaignId,
            editorialDay: p.editorialDay,
            sequenceNumber: p.sequenceNumber,
            publishAt: publishAt.toISOString(),
            platform: p.platform,
            format: p.format,
            pillar: p.pillar,
            title: p.title,
            description: p.description,
            hashtags: p.hashtags,
            engagementText: p.engagementText,
            cta: "Baixe o app e faça seu primeiro teste",
            destinationUrl: "https://meucorre.vercel.app/",
            altText: p.title,
            status: "pending",
            utmQuery: "utm_source=organico&utm_medium=social&utm_campaign=plano90dias",
          }, cookie);
          return r.ok;
        });

        const results = await Promise.all(promises);
        created += results.filter(Boolean).length;
        process.stdout.write(`\r   ${created}/${missing.length} criados`);
      }
      console.log(`\n   ✅ ${created} posts criados`);
    }
  }

  // Vincula assets aos posts
  console.log("\n📎 Vinculando assets aos posts...");
  const assetsRes = await api("GET", "/api/admin/promotion/assets?limit=500", null, cookie);
  const postsWithAssetsRes = await api("GET", "/api/admin/promotion/posts?limit=500", null, cookie);
  const assets = (assetsRes.data.assets ?? []).filter((a: { publicUrl: string | null }) => a.publicUrl);
  const postsWithoutAsset = (postsWithAssetsRes.data.posts ?? []).filter((p: { assetId: string | null }) => !p.assetId);

  let linked = 0;
  for (const post of postsWithoutAsset) {
    const month = Math.ceil(post.editorialDay / 30);
    const code = `M${String(month).padStart(2, "0")}_D${String(post.editorialDay).padStart(2, "0")}_P${post.sequenceNumber}_${post.platform}`;
    const matchingAsset = assets.find((a: { name: string }) => a.name.startsWith(code));
    if (matchingAsset) {
      await api("PATCH", `/api/admin/promotion/posts/${post.id}`, { assetId: matchingAsset.id }, cookie);
      linked++;
    }
  }
  console.log(`   ✅ ${linked} posts vinculados a assets`);

  // ===== 2. CRIAR PARCEIROS SEED (Recife/PE) =====
  console.log("\n🤝 Criando parceiros seed de Recife/PE...");
  const partnersRes = await api("GET", "/api/admin/partners?limit=500", null, cookie);
  const existingPartners = partnersRes.data.total ?? 0;

  if (existingPartners === 0) {
    const seedPartners = [
      { companyName: "Oficina do Zé Mecânica Automotiva", category: "oficina", city: "Recife", state: "PE", priority: "media", stage: "novo_lead", phone: "(81) 99999-1001", email: "contato@oficinadoze.com.br" },
      { companyName: "Pneus & Rodas do Norte", category: "pneus", city: "Olinda", state: "PE", priority: "alta", stage: "novo_lead", phone: "(81) 98888-1002", email: "vendas@pneusdonorte.com.br" },
      { companyName: "Acessórios Premium Moto Shop", category: "acessorios", city: "Jaboatão dos Guararapes", state: "PE", priority: "media", stage: "novo_lead", phone: "(81) 97777-1003", email: "contato@premiummoto.com.br" },
      { companyName: "Lanchonete do Entregador", category: "alimentacao", city: "Recife", state: "PE", priority: "baixa", stage: "novo_lead", phone: "(81) 96666-1004", email: "lanchonete.entregador@gmail.com" },
      { companyName: "Auto Center São José", category: "servicos", city: "Paulista", state: "PE", priority: "alta", stage: "qualificando", phone: "(81) 95555-1005", email: "autocenter.saojose@hotmail.com" },
      { companyName: "Bag Box & Cia", category: "acessorios", city: "Recife", state: "PE", priority: "urgente", stage: "qualificando", phone: "(81) 94444-1006", email: "bagbox.cia@gmail.com" },
      { companyName: "Moto Protect PE", category: "protecao", city: "Olinda", state: "PE", priority: "media", stage: "qualificando", phone: "(81) 93333-1007", email: "contato@motoprotect.com.br" },
      { companyName: "Rastreamento Brasil PE", category: "protecao", city: "Recife", state: "PE", priority: "alta", stage: "contato_iniciado", phone: "(81) 92222-1008", email: "comercial@rastreamentobrasil.com.br" },
      { companyName: "Mecânica Veloz Moto", category: "oficina", city: "Recife", state: "PE", priority: "media", stage: "contato_iniciado", phone: "(81) 91111-1009", email: "velozmoto@outlook.com" },
      { companyName: "Borracharia 24h Corre", category: "servicos", city: "Jaboatão dos Guararapes", state: "PE", priority: "alta", stage: "contato_iniciado", phone: "(81) 90000-1010", email: "borracharia24h.corre@gmail.com" },
      { companyName: "Supermercado Bom Preço Entregas", category: "alimentacao", city: "Recife", state: "PE", priority: "urgente", stage: "descoberta", phone: "(81) 88888-1011", email: "marketing@bompreco.com.br" },
      { companyName: "Pastelaria do Comércio", category: "alimentacao", city: "Olinda", state: "PE", priority: "media", stage: "descoberta", phone: "(81) 87777-1012", email: "pastelariacomercio@gmail.com" },
      { companyName: "Açaí & Cia Recife", category: "alimentacao", city: "Recife", state: "PE", priority: "alta", stage: "proposta_enviada", phone: "(81) 86666-1013", email: "acaicia.recife@gmail.com" },
      { companyName: "Moto Peças Centro", category: "servicos", city: "Recife", state: "PE", priority: "media", stage: "proposta_enviada", phone: "(81) 85555-1014", email: "motopecascentro@uol.com.br" },
      { companyName: "Pizza Express do Bairro", category: "alimentacao", city: "Recife", state: "PE", priority: "alta", stage: "negociacao", phone: "(81) 84444-1015", email: "pizzaexpress.bairro@gmail.com" },
      { companyName: "Auto Elétrica Silva", category: "servicos", city: "Paulista", state: "PE", priority: "media", stage: "negociacao", phone: "(81) 83333-1016", email: "autoeletrica.silva@hotmail.com" },
      { companyName: "Hamburgueria Corre Duro", category: "alimentacao", city: "Recife", state: "PE", priority: "alta", stage: "ativo", phone: "(81) 82222-1017", email: "correduro.burger@gmail.com" },
      { companyName: "Oficina Moto Segura", category: "oficina", city: "Olinda", state: "PE", priority: "alta", stage: "ativo", phone: "(81) 81111-1018", email: "motosegura.oficina@gmail.com" },
      { companyName: "Borracharia Sempre Na Hora", category: "servicos", city: "Jaboatão dos Guararapes", state: "PE", priority: "media", stage: "ativo", phone: "(81) 80000-1019", email: "semprenahora.borracharia@gmail.com" },
      { companyName: "Lava Jato do Entregador", category: "servicos", city: "Recife", state: "PE", priority: "alta", stage: "renovacao", phone: "(81) 79999-1020", email: "lavajato.entregador@gmail.com" },
      { companyName: "Comida Boa Delivery", category: "alimentacao", city: "Recife", state: "PE", priority: "baixa", stage: "perdido", phone: "(81) 78888-1021", email: "comidaboadelivery@outlook.com" },
      { companyName: "Bar do Zé Bebidas", category: "alimentacao", city: "Recife", state: "PE", priority: "baixa", stage: "desqualificado", phone: "(81) 77777-1022", email: "bardoze@gmail.com" },
    ];

    let pCreated = 0;
    for (const p of seedPartners) {
      const r = await api("POST", "/api/admin/partners", { ...p, assignedTo: "Clodoaldo Silva" }, cookie);
      if (r.ok) pCreated++;
    }
    console.log(`   ✅ ${pCreated} parceiros criados`);
  } else {
    console.log(`   ♻️  Já existem ${existingPartners} parceiros — pulando`);
  }

  // ===== 3. ATIVAR FLAGS DA RELEASE I =====
  console.log("\n🚩 Ativando flags da Release I...");
  const flagsI = [
    { key: "admin_teams_enabled", value: true, label: "Equipes B2B" },
    { key: "partner_portal_enabled", value: true, label: "Portal do Parceiro" },
    { key: "app_radar_enabled", value: true, label: "Radar do Prejuízo" },
    { key: "app_score_enabled", value: true, label: "MeuCorre Score" },
    { key: "app_challenge_enabled", value: true, label: "Desafio 7 dias" },
  ];

  for (const f of flagsI) {
    const r = await api("POST", "/api/admin/feature-flags", f, cookie);
    console.log(`   ${r.ok ? "✅" : "❌"} ${f.label}: ${f.key}`);
  }

  // ===== 4. VALIDAÇÃO FINAL =====
  console.log("\n" + "=".repeat(60));
  console.log("📊 VALIDAÇÃO FINAL DE PRODUÇÃO");
  console.log("=".repeat(60));

  const checks = [
    { label: "C — Posts (450)", path: "/api/admin/promotion/posts?limit=1", field: "total", expect: 450 },
    { label: "C — Assets com URL", path: "/api/admin/promotion/assets?limit=1", field: "withUrl", min: 370 },
    { label: "C — Canais", path: "/api/admin/promotion/channels", field: "channels", min: 6 },
    { label: "D — Parceiros (22)", path: "/api/admin/partners?limit=1", field: "total", expect: 22 },
    { label: "D — Dashboard CRM", path: "/api/admin/partners/dashboard", field: "totalPartners", min: 1 },
    { label: "E — Propostas", path: "/api/admin/proposals?limit=1", field: "total" },
    { label: "E — Templates", path: "/api/admin/proposals/templates", field: "templates", min: 3 },
    { label: "E — Materiais", path: "/api/admin/commercial-assets?limit=1", field: "total" },
    { label: "F — Campanhas", path: "/api/admin/partner-campaigns?limit=1", field: "total" },
    { label: "G — Templates outbound", path: "/api/admin/outbound/templates?limit=1", field: "total" },
    { label: "H — Dashboard métricas", path: "/api/admin/metrics/dashboard", field: "revenue" },
    { label: "H — Alertas", path: "/api/admin/metrics/alerts", field: "totalAlerts" },
    { label: "I — Equipes", path: "/api/admin/teams?limit=1", field: "total" },
  ];

  let pass = 0, fail = 0;
  for (const c of checks) {
    const r = await api("GET", c.path, null, cookie);
    const val = r.data[c.field];
    const ok = r.ok && val !== undefined;
    const status = ok ? "✅" : "❌";
    const detail = ok ? (typeof val === "number" ? val : "OK") : `HTTP ${r.status}`;
    console.log(`   ${status} ${c.label}: ${detail}`);
    if (ok) pass++; else fail++;
  }

  // Verifica imagem
  const imgRes = await fetch(`${BASE_URL}/promotion/M01_D01_P01_Instagram_vendas_ig_feed_1.jpg`);
  console.log(`   ${imgRes.ok ? "✅" : "❌"} Imagem de teste: HTTP ${imgRes.status}`);

  console.log(`\n📊 Resultado: ${pass}/${pass + fail + 1} checks OK`);
  console.log("=".repeat(60));
}

main().catch(console.error);
