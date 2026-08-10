#!/usr/bin/env node
// ===== Verificação de Configuração Vercel + Supabase =====
//
// Testa cada endpoint crítico para inferir o status de cada dependência:
//   - /api/health → DB Postgres + Redis Upstash + Sentry
//   - /api/ads → DB Postgres (cache in-memory)
//   - /api/auth/me sem sessão → USER_JWT_SECRET
//   - /api/sync sem sessão → USER_JWT_SECRET + rate limit Redis
//   - /api/referral/code sem sessão → USER_JWT_SECRET
//   - /api/admin/login sem credenciais → ADMIN_JWT_SECRET
//   - /api/feedback POST → DB Postgres (tabela Feedback)
//   - / → build estático
//   - /login, /register, /termos, /privacidade → páginas estáticas
//
// Usa browser-like headers para evitar Vercel Security Checkpoint.

const https = require("https");

const BASE = "https://meucorre.vercel.app";

function fetch(path, opts = {}) {
  return new Promise((resolve) => {
    const url = new URL(`${BASE}${path}`);
    const start = Date.now();
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: opts.method || "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "application/json,text/html;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9",
          ...(opts.body ? { "Content-Type": "application/json" } : {}),
          ...(opts.headers || {}),
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          resolve({
            status: res.statusCode,
            durationMs: Date.now() - start,
            headers: res.headers,
            body,
          });
        });
      }
    );
    req.on("error", (err) => {
      resolve({
        status: 0,
        durationMs: Date.now() - start,
        error: err.message,
      });
    });
    req.setTimeout(15000, () => req.destroy(new Error("timeout")));
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

function tryParseJSON(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

async function main() {
  console.log("=== Verificação Vercel + Supabase ===\n");
  const results = [];

  // 1. /api/health — verifica DB + Redis + Sentry
  console.log("1. /api/health (DB + Redis + Sentry)...");
  const health = await fetch("/api/health");
  const healthBody = tryParseJSON(health.body);
  console.log(
    `   Status: ${health.status} | DB: ${healthBody?.checks?.database} | Redis: ${healthBody?.checks?.redis} | Sentry: ${healthBody?.checks?.sentry}`
  );
  console.log(`   Version: ${healthBody?.build?.version} | Env: ${healthBody?.build?.environment} | Region: ${healthBody?.build?.region}`);
  results.push({
    endpoint: "/api/health",
    expected: "200 healthy DB=ok Redis=ok Sentry=configured",
    actual: `${health.status} ${healthBody?.status} DB=${healthBody?.checks?.database} Redis=${healthBody?.checks?.redis} Sentry=${healthBody?.checks?.sentry}`,
    ok:
      health.status === 200 &&
      healthBody?.status === "healthy" &&
      healthBody?.checks?.database === "ok" &&
      healthBody?.checks?.redis === "ok" &&
      healthBody?.checks?.sentry === "configured",
  });

  // 2. /api/ads — DB (tabela Ad)
  console.log("\n2. /api/ads?placement=banner_top (DB Postgres - tabela Ad)...");
  const ads = await fetch("/api/ads?placement=banner_top");
  const adsBody = tryParseJSON(ads.body);
  console.log(`   Status: ${ads.status} | Ads count: ${adsBody?.ads?.length ?? "n/a"}`);
  results.push({
    endpoint: "/api/ads",
    expected: "200 com array de ads",
    actual: `${ads.status} ads=${adsBody?.ads?.length ?? "null"}`,
    ok: ads.status === 200 && Array.isArray(adsBody?.ads),
  });

  // 3. /api/auth/me sem sessão — USER_JWT_SECRET
  console.log("\n3. /api/auth/me sem cookie (USER_JWT_SECRET)...");
  const me = await fetch("/api/auth/me");
  const meBody = tryParseJSON(me.body);
  console.log(`   Status: ${me.status} | user: ${meBody?.user}`);
  results.push({
    endpoint: "/api/auth/me",
    expected: "200 com user=null",
    actual: `${me.status} user=${meBody?.user}`,
    ok: me.status === 200 && meBody?.user === null,
  });

  // 4. /api/sync GET sem sessão — USER_JWT_SECRET + rate limit
  console.log("\n4. /api/sync?since=0 sem cookie (USER_JWT_SECRET + rate limit)...");
  const sync = await fetch("/api/sync?since=0");
  const syncBody = tryParseJSON(sync.body);
  console.log(`   Status: ${sync.status} | error: ${syncBody?.error}`);
  results.push({
    endpoint: "/api/sync GET",
    expected: "401 não autorizado",
    actual: `${sync.status} ${syncBody?.error}`,
    ok: sync.status === 401 && /não autorizado/i.test(syncBody?.error || ""),
  });

  // 5. /api/sync?since=invalid — Achado #3 corrigido
  console.log("\n5. /api/sync?since=invalid (validação BigInt - Achado #3)...");
  const syncInvalid = await fetch("/api/sync?since=invalid");
  const syncInvalidBody = tryParseJSON(syncInvalid.body);
  console.log(`   Status: ${syncInvalid.status} | error: ${syncInvalidBody?.error}`);
  results.push({
    endpoint: "/api/sync?since=invalid",
    expected: "400 parâmetro inválido",
    actual: `${syncInvalid.status} ${syncInvalidBody?.error}`,
    ok: syncInvalid.status === 400 && /inválido/i.test(syncInvalidBody?.error || ""),
  });

  // 6. /api/referral/code sem sessão — USER_JWT_SECRET
  console.log("\n6. /api/referral/code sem cookie (USER_JWT_SECRET)...");
  const ref = await fetch("/api/referral/code");
  const refBody = tryParseJSON(ref.body);
  console.log(`   Status: ${ref.status} | error: ${refBody?.error}`);
  results.push({
    endpoint: "/api/referral/code",
    expected: "401 não autorizado",
    actual: `${ref.status} ${refBody?.error}`,
    ok: ref.status === 401 && /não autorizado/i.test(refBody?.error || ""),
  });

  // 7. /api/admin/login sem credenciais — ADMIN_JWT_SECRET
  console.log("\n7. /api/admin/login sem body (ADMIN_JWT_SECRET)...");
  const adminLogin = await fetch("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({}),
  });
  const adminLoginBody = tryParseJSON(adminLogin.body);
  console.log(`   Status: ${adminLogin.status} | error: ${adminLoginBody?.error}`);
  results.push({
    endpoint: "/api/admin/login",
    expected: "400 (validação de input)",
    actual: `${adminLogin.status} ${adminLoginBody?.error}`,
    ok: adminLogin.status === 400,
  });

  // 8. /api/feedback POST — DB (tabela Feedback) + Resend não acionado
  console.log("\n8. /api/feedback POST (DB tabela Feedback)...");
  const feedback = await fetch("/api/feedback", {
    method: "POST",
    body: JSON.stringify({
      rating: 5,
      message: "Verification test - please ignore",
      page: "verification",
    }),
  });
  const feedbackBody = tryParseJSON(feedback.body);
  console.log(`   Status: ${feedback.status} | ok: ${feedbackBody?.ok}`);
  results.push({
    endpoint: "/api/feedback",
    expected: "200 com ok=true (DB write)",
    actual: `${feedback.status} ok=${feedbackBody?.ok}`,
    ok: feedback.status === 200 && feedbackBody?.ok === true,
  });

  // 9. Páginas estáticas
  console.log("\n9. Páginas estáticas (build do Next.js)...");
  const staticPages = ["/", "/login", "/register", "/termos", "/privacidade"];
  for (const p of staticPages) {
    const r = await fetch(p);
    console.log(`   ${p}: ${r.status} (${r.durationMs}ms, ${r.body.length} bytes)`);
    results.push({
      endpoint: p,
      expected: "200",
      actual: `${r.status} ${r.durationMs}ms`,
      ok: r.status === 200,
    });
  }

  // 10. Service Worker v2
  console.log("\n10. /sw.js (Service Worker v2)...");
  const sw = await fetch("/sw.js");
  const swHasV2 = sw.body.includes("meucorre-v2");
  const swHasApiBypass = sw.body.includes('url.pathname.startsWith("/api/")');
  console.log(`   Status: ${sw.status} | v2: ${swHasV2} | /api/ bypass: ${swHasApiBypass}`);
  results.push({
    endpoint: "/sw.js",
    expected: "200 com meucorre-v2 e bypass /api/",
    actual: `${sw.status} v2=${swHasV2} bypass=${swHasApiBypass}`,
    ok: sw.status === 200 && swHasV2 && swHasApiBypass,
  });

  // Resumo
  console.log("\n=== RESUMO ===");
  console.log("Endpoint                          | Status esperado        | Status real                          | OK");
  console.log("----------------------------------|------------------------|--------------------------------------|----");
  let passCount = 0;
  for (const r of results) {
    if (r.ok) passCount++;
    console.log(
      `${r.endpoint.padEnd(33)} | ${r.expected.padEnd(22)} | ${r.actual.padEnd(36)} | ${r.ok ? "✓" : "✗"}`
    );
  }
  console.log(`\n${passCount}/${results.length} verificações passaram.`);
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
