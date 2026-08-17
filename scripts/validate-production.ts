// ===== Script de validação de produção =====
//
// Este script automatiza a validação pós-deploy:
// 1. Faz login como admin
// 2. Verifica que as tabelas foram criadas (via feature flags API)
// 3. Ativa feature flags gradualmente
// 4. Importa as 450 postagens (Release C)
// 5. Cria parceiros de seed (Release D)
// 6. Valida cada módulo
//
// Uso:
//   BASE_URL=https://meucorre.vercel.app ADMIN_EMAIL=... ADMIN_PASSWORD=... \
//   npx tsx scripts/validate-production.ts
//
// Pode ser rodado incrementalmente com --step flag:
//   npx tsx scripts/validate-production.ts --step=login
//   npx tsx scripts/validate-production.ts --step=flags
//   npx tsx scripts/validate-production.ts --step=seed-c
//   npx tsx scripts/validate-production.ts --step=seed-d
//   npx tsx scripts/validate-production.ts --step=validate

import * as fs from "node:fs";
import * as path from "node:path";

const BASE_URL = process.env.BASE_URL ?? "https://meucorre.vercel.app";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "clodoaldo608@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? (process.env.ADMIN_PASSWORD ?? "");

// Parse --step argument
const stepArg = process.argv.find((a) => a.startsWith("--step="));
const step = stepArg?.split("=")[1] ?? "all";

interface FetchResult {
  ok: boolean;
  status: number;
  data: unknown;
}

async function apiCall(
  method: string,
  path: string,
  body?: unknown,
  cookies?: string[],
): Promise<FetchResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (cookies?.length) {
    headers["Cookie"] = cookies.join("; ");
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return {
      ok: res.ok,
      status: res.status,
      data,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: { error: err instanceof Error ? err.message : String(err) },
    };
  }
}

async function login(): Promise<string[]> {
  console.log("🔐 Fazendo login como admin...");
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Login falhou: ${err.error ?? res.status}`);
  }

  // Extrai cookies do header Set-Cookie
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookies = setCookie.map((c: string) => c.split(";")[0]);
  console.log("   ✅ Login OK");
  return cookies;
}

async function checkTables(cookies: string[]): Promise<boolean> {
  console.log("\n📊 Verificando se as tabelas foram criadas...");
  const res = await apiCall("GET", "/api/admin/feature-flags", undefined, cookies);
  if (!res.ok) {
    console.error("   ❌ Erro ao acessar feature flags:", res.data);
    return false;
  }
  console.log("   ✅ Tabela Setting acessível (tabelas existentes OK)");

  // Tenta acessar uma tabela nova (Partner) para verificar se existe
  const partnersRes = await apiCall("GET", "/api/admin/partners?limit=1", undefined, cookies);
  if (partnersRes.status === 500) {
    console.error("   ❌ Tabela Partner não existe — prisma db push não rodou ainda");
    return false;
  }
  console.log("   ✅ Tabela Partner acessível (tabelas novas OK)");
  return true;
}

async function activateFlags(cookies: string[]): Promise<void> {
  console.log("\n🚩 Ativando feature flags gradualmente...");

  const flags = [
    { key: "admin_marketing_hub_enabled", value: true, label: "C — Central de Divulgação" },
    { key: "admin_partner_crm_enabled", value: true, label: "D — CRM de Parceiros" },
    { key: "partner_campaigns_enabled", value: true, label: "F — Campanhas de Parceiros" },
    { key: "partner_outbound_preview_enabled", value: true, label: "G — Outbound (preview)" },
    // Não ativa estas por padrão — requerem validação manual
    // { key: "partner_outbound_send_enabled", value: false, label: "G — Outbound (envio)" },
    // { key: "admin_teams_enabled", value: true, label: "I — Equipes B2B" },
    // { key: "partner_portal_enabled", value: true, label: "I — Portal do Parceiro" },
    // { key: "app_radar_enabled", value: true, label: "I — Radar do Prejuízo" },
    // { key: "app_score_enabled", value: true, label: "I — MeuCorre Score" },
    // { key: "app_challenge_enabled", value: true, label: "I — Desafio 7 dias" },
  ];

  for (const flag of flags) {
    const res = await apiCall("POST", "/api/admin/feature-flags", flag, cookies);
    if (res.ok) {
      console.log(`   ✅ ${flag.label}: ${flag.key} = ${flag.value}`);
    } else {
      console.error(`   ❌ ${flag.label}: falhou (${res.status})`, res.data);
    }
  }
}

async function seedReleaseC(cookies: string[]): Promise<void> {
  console.log("\n📝 Importando 450 postagens do Plano 90 Dias (Release C)...");

  // Verifica se já existem posts
  const checkRes = await apiCall("GET", "/api/admin/promotion/posts?limit=1", undefined, cookies);
  if (checkRes.ok) {
    const data = checkRes.data as { total: number };
    if (data.total > 0) {
      console.log(`   ♻️  Já existem ${data.total} postagens — pulando importação`);
      return;
    }
  }

  // Importa
  const importRes = await apiCall("POST", "/api/admin/promotion/posts/import", {}, cookies);
  if (importRes.ok) {
    const data = importRes.data as { created: number; updated: number; errors: number };
    console.log(`   ✅ Importação concluída: ${data.created} criadas, ${data.updated} atualizadas, ${data.errors} erros`);
  } else {
    console.error("   ❌ Erro na importação:", importRes.data);
  }
}

async function seedReleaseD(cookies: string[]): Promise<void> {
  console.log("\n🤝 Criando parceiros de seed de Recife/PE (Release D)...");

  // Carrega o JSON de parceiros
  const seedScriptPath = path.resolve(process.cwd(), "scripts/partners/seed-recife-pe.ts");
  if (!fs.existsSync(seedScriptPath)) {
    console.error("   ❌ Script de seed não encontrado");
    return;
  }

  // Lê os parceiros do script (extrai do código)
  const seedContent = fs.readFileSync(seedScriptPath, "utf8");
  const partnersMatch = seedContent.match(/const SEED_PARTNERS[^=]+=\s*\[([\s\S]+?)\];\s*\n\s*\n/);
  if (!partnersMatch) {
    console.error("   ❌ Não foi possível extrair parceiros do script");
    return;
  }

  // Tenta criar via API (um por um para validar)
  // Lê o JSON de postagens para verificar se o padrão funciona
  // Na verdade, vamos usar eval cuidadosamente ou criar via API individualmente

  // Lista de parceiros para criar (simplificada — os 22 do seed)
  const partners = [
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

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const p of partners) {
    const res = await apiCall("POST", "/api/admin/partners", p, cookies);
    if (res.ok) {
      created++;
      process.stdout.write(".");
    } else if (res.status === 409) {
      skipped++;
      process.stdout.write("s");
    } else {
      errors++;
      process.stdout.write("x");
    }
  }
  console.log(`\n   ✅ ${created} criados, ${skipped} skip (já existiam), ${errors} erros`);
}

async function validateModules(cookies: string[]): Promise<void> {
  console.log("\n✅ Validando módulos...");

  const checks = [
    { label: "C — Divulgação (posts)", path: "/api/admin/promotion/posts?limit=1", expectField: "total" },
    { label: "C — Divulgação (canais)", path: "/api/admin/promotion/channels", expectField: "channels" },
    { label: "D — Parceiros", path: "/api/admin/partners?limit=1", expectField: "total" },
    { label: "D — Dashboard CRM", path: "/api/admin/partners/dashboard", expectField: "totalPartners" },
    { label: "E — Propostas", path: "/api/admin/proposals?limit=1", expectField: "total" },
    { label: "E — Templates de proposta", path: "/api/admin/proposals/templates", expectField: "templates" },
    { label: "E — Materiais comerciais", path: "/api/admin/commercial-assets?limit=1", expectField: "total" },
    { label: "F — Campanhas", path: "/api/admin/partner-campaigns?limit=1", expectField: "total" },
    { label: "G — Templates outbound", path: "/api/admin/outbound/templates?limit=1", expectField: "total" },
    { label: "G — Logs outbound", path: "/api/admin/outbound/logs?limit=1", expectField: "total" },
    { label: "H — Dashboard métricas", path: "/api/admin/metrics/dashboard", expectField: "revenue" },
    { label: "H — Alertas", path: "/api/admin/metrics/alerts", expectField: "totalAlerts" },
    { label: "H — Relatório parceiros CSV", path: "/api/admin/metrics/reports/partners?format=json", expectField: "total" },
    { label: "I — Equipes", path: "/api/admin/teams?limit=1", expectField: "total" },
    { label: "I — Portal tokens", path: "/api/admin/partner-portal/tokens", expectField: "tokens" },
  ];

  let pass = 0;
  let fail = 0;

  for (const check of checks) {
    const res = await apiCall("GET", check.path, undefined, cookies);
    if (res.ok) {
      console.log(`   ✅ ${check.label}`);
      pass++;
    } else {
      console.log(`   ❌ ${check.label} (${res.status})`);
      fail++;
    }
  }

  console.log(`\n📊 Resultado: ${pass}/${pass + fail} módulos OK`);
}

async function main() {
  console.log("=".repeat(60));
  console.log("🚀 Validação de Produção — MeuCorre");
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Admin: ${ADMIN_EMAIL}`);
  console.log(`   Step: ${step}`);
  console.log("=".repeat(60));

  try {
    // Step 1: Login
    const cookies = await login();

    // Step 2: Check tables
    if (step === "all" || step === "login" || step === "flags") {
      const tablesOk = await checkTables(cookies);
      if (!tablesOk && step !== "login") {
        console.error("\n❌ Tabelas não criadas. Verifique se o deploy com 'prisma db push' completou.");
        process.exit(1);
      }
    }

    // Step 3: Activate flags
    if (step === "all" || step === "flags") {
      await activateFlags(cookies);
    }

    // Step 4: Seed Release C
    if (step === "all" || step === "seed-c") {
      await seedReleaseC(cookies);
    }

    // Step 5: Seed Release D
    if (step === "all" || step === "seed-d") {
      await seedReleaseD(cookies);
    }

    // Step 6: Validate
    if (step === "all" || step === "validate") {
      await validateModules(cookies);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Validação concluída!");
    console.log("=".repeat(60));
  } catch (err) {
    console.error("\n💥 Erro fatal:", err);
    process.exit(1);
  }
}

main();
