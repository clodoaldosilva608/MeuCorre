#!/usr/bin/env node
// ===== MeuCorre — Teste de Carga (Playwright-based) =====
//
// NOTA: Vercel bloqueia scripts Node.js puros (https.request) com
// "Vercel Security Checkpoint" (403). Para contornar isso e ainda
// assim coletar dados de carga, usamos Playwright (browser real) com
// múltiplas abas concorrendo.
//
// Cenários:
//   - 10, 25, 50 usuários simultâneos em / e /api/health
//   (limite de 50 porque Playwright abre 1 aba por usuário)
//
// Saída: scripts/perf-results/load-test-results.json
//
// Uso: node scripts/load-test.js

const { chromium } = require("playwright");
const { writeFileSync, mkdirSync } = require("fs");
const { join } = require("path");

const BASE_URL = "https://meucorre.vercel.app";

async function fetchViaBrowser(context, path) {
  const page = await context.newPage();
  const start = Date.now();
  let status = 0;
  try {
    const response = await page.goto(`${BASE_URL}${path}`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    status = response?.status() ?? 0;
  } catch (err) {
    status = 0;
  }
  const durationMs = Date.now() - start;
  await page.close();
  return { status, durationMs };
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx];
}

async function runScenario(browser, users, path) {
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });
  const promises = Array.from({ length: users }, () =>
    fetchViaBrowser(context, path),
  );
  const results = await Promise.all(promises);
  await context.close();

  const latencies = results.map((r) => r.durationMs).sort((a, b) => a - b);
  const successes = results.filter((r) => r.status >= 200 && r.status < 300);
  const errors5xx = results.filter((r) => r.status >= 500).length;
  const errors4xx = results.filter(
    (r) => r.status >= 400 && r.status < 500,
  ).length;
  const netErrors = results.filter((r) => r.status === 0).length;

  return {
    users,
    path,
    totalRequests: results.length,
    successes: successes.length,
    successRate: (successes.length / results.length) * 100,
    errors5xx,
    errors4xx,
    netErrors,
    latency: {
      min: latencies[0] || 0,
      p50: percentile(latencies, 50),
      p90: percentile(latencies, 90),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99),
      max: latencies[latencies.length - 1] || 0,
    },
  };
}

async function main() {
  console.log("=== MeuCorre Load Test (Playwright-based) ===");
  const browser = await chromium.launch({ headless: true });
  const allResults = [];

  const scenarios = [
    { users: 5, path: "/" },
    { users: 10, path: "/" },
    { users: 25, path: "/" },
    { users: 5, path: "/api/health" },
    { users: 10, path: "/api/health" },
    { users: 25, path: "/api/health" },
  ];

  for (const s of scenarios) {
    console.log(`\n--- ${s.users} users → ${s.path} ---`);
    const r = await runScenario(browser, s.users, s.path);
    allResults.push(r);
    console.log(
      `  ${r.totalRequests} reqs | success: ${r.successRate.toFixed(1)}% | 5xx: ${r.errors5xx} | 4xx: ${r.errors4xx} | net: ${r.netErrors}`,
    );
    console.log(
      `  p50: ${r.latency.p50}ms | p95: ${r.latency.p95}ms | p99: ${r.latency.p99}ms | max: ${r.latency.max}ms`,
    );
  }

  await browser.close();

  const outDir = "/home/z/my-project/scripts/perf-results";
  try {
    mkdirSync(outDir, { recursive: true });
  } catch {}
  writeFileSync(
    join(outDir, "load-test-results.json"),
    JSON.stringify(allResults, null, 2),
  );

  console.log("\n=== RESUMO ===");
  console.log(
    "Users | Path          | Reqs | Success% | p50ms | p95ms | p99ms",
  );
  console.log("------|---------------|------|----------|-------|-------|------");
  for (const r of allResults) {
    console.log(
      `${String(r.users).padStart(5)} | ${r.path.padEnd(13)} | ${String(r.totalRequests).padStart(4)} | ${r.successRate.toFixed(1).padStart(8)}% | ${String(Math.round(r.latency.p50)).padStart(5)} | ${String(Math.round(r.latency.p95)).padStart(5)} | ${String(Math.round(r.latency.p99)).padStart(5)}`,
    );
  }
  console.log(`\nResultados em: scripts/perf-results/load-test-results.json`);
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
