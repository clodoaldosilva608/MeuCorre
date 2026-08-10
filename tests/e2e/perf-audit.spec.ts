import { test, expect } from "@playwright/test";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// ===== Fase 3 — Auditoria de Performance =====
//
// Coleta métricas Core Web Vitals (LCP, CLS, FCP, INP, TTFB) via
// Performance Observer da Web API. Reproduz o que o Lighthouse faz,
// mas sem depender do binário Lighthouse (~500MB).
//
// Páginas auditadas:
//   1. / (landing page) — anônimo
//   2. /login — anônimo
//   3. /register — anônimo
//   4. /app — anônimo (guest mode trial)
//
// Para cada página, coletamos:
//   - TTFB (Time to First Byte) — tempo até primeiro byte do servidor
//   - FCP (First Contentful Paint) — quando primeiro conteúdo aparece
//   - LCP (Largest Contentful Paint) — quando maior elemento aparece
//   - CLS (Cumulative Layout Shift) — estabilidade visual
//   - INP (Interaction to Next Paint) — responsividade (simulado)
//   - Total Bundle Size — soma de todos os JS baixados
//   - Number of Requests — contagem de requests de rede
//
// Metas (Google Web Vitals):
//   - LCP < 2500ms (good), < 4000ms (needs improvement)
//   - CLS < 0.1 (good), < 0.25 (needs improvement)
//   - INP < 200ms (good), < 500ms (needs improvement)
//   - FCP < 1800ms (good), < 3000ms (needs improvement)
//   - TTFB < 800ms (good), < 1800ms (needs improvement)

interface PageMetrics {
  url: string;
  ttfb: number;
  fcp: number;
  lcp: number;
  cls: number;
  inp: number | null;
  totalTransferKB: number;
  totalJSKB: number;
  requestCount: number;
  lcpElement: string;
  domContentLoaded: number;
  loadComplete: number;
}

const TARGETS = [
  { url: "/", name: "Landing Page" },
  { url: "/login", name: "Login" },
  { url: "/register", name: "Cadastro" },
  { url: "/app", name: "Dashboard (guest)" },
];

async function collectMetrics(
  browser: import("@playwright/test").Browser,
  url: string,
): Promise<PageMetrics> {
  // Usa um novo contexto para cada página (evita reusar exposeFunction)
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  let totalTransferKB = 0;
  let totalJSKB = 0;
  let requestCount = 0;

  page.on("response", async (response) => {
    requestCount++;
    try {
      const headers = response.headers();
      const contentLength = parseInt(headers["content-length"] || "0", 10);
      if (contentLength > 0) {
        totalTransferKB += contentLength / 1024;
        if (
          headers["content-type"]?.includes("javascript") ||
          response.url().endsWith(".js")
        ) {
          totalJSKB += contentLength / 1024;
        }
      } else {
        const body = await response.body().catch(() => null);
        if (body) {
          totalTransferKB += body.length / 1024;
          if (
            headers["content-type"]?.includes("javascript") ||
            response.url().endsWith(".js")
          ) {
            totalJSKB += body.length / 1024;
          }
        }
      }
    } catch {
      // ignore
    }
  });

  // Injeta Performance Observers ANTES da página carregar
  // Eles coletam em window.__perf, que lemos no final.
  await page.addInitScript(() => {
    (window as unknown as { __perf: Record<string, unknown> }).__perf = {
      cls: 0,
      lcp: 0,
      lcpElement: "",
      fcp: 0,
      inp: null as number | null,
    };

    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
        };
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value ?? 0;
        }
      }
      (window as unknown as { __perf: { cls: number } }).__perf.cls = clsValue;
    });
    try {
      clsObserver.observe({ type: "layout-shift", buffered: true });
    } catch {
      // alguns browsers não suportam
    }

    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      const element = (lastEntry as PerformanceEntry & { element?: Element })
        .element;
      const elementDesc = element
        ? `<${element.tagName.toLowerCase()}` +
          (element.className ? ` class="${element.className}"` : "") +
          (element.id ? ` id="${element.id}"` : "") +
          ">"
        : "unknown";
      const perf = (window as unknown as { __perf: { lcp: number; lcpElement: string } }).__perf;
      perf.lcp = lastEntry.startTime;
      perf.lcpElement = elementDesc;
    });
    try {
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // alguns browsers não suportam
    }

    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          (window as unknown as { __perf: { fcp: number } }).__perf.fcp = entry.startTime;
        }
      }
    });
    fcpObserver.observe({ type: "paint", buffered: true });

    let worstInp = 0;
    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const duration = (entry as PerformanceEntry & { duration: number }).duration;
        if (duration > worstInp) {
          worstInp = duration;
          (window as unknown as { __perf: { inp: number | null } }).__perf.inp = duration;
        }
      }
    });
    try {
      inpObserver.observe({ type: "event", buffered: true });
    } catch {
      // alguns browsers não suportam event observer
    }
  });

  // Navega
  await page.goto(url, { waitUntil: "load", timeout: 30000 });

  // Aguarda LCP estabilizar
  await page.waitForTimeout(2000);

  // Para páginas com input, simula interação para medir INP
  if (url.includes("/login") || url.includes("/register")) {
    try {
      const input = page.locator("input").first();
      if (await input.isVisible({ timeout: 1000 })) {
        await input.click({ timeout: 1000 });
        await page.waitForTimeout(500);
      }
    } catch {
      // sem input clicável
    }
  }

  // Coleta métricas acumuladas em window.__perf
  const collected = await page.evaluate(() => {
    const perf = (window as unknown as { __perf: Record<string, unknown> }).__perf;
    const [nav] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    return {
      cls: Number(perf.cls) || 0,
      lcp: Number(perf.lcp) || 0,
      lcpElement: String(perf.lcpElement || ""),
      fcp: Number(perf.fcp) || 0,
      inp: perf.inp === null ? null : Number(perf.inp),
      ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : 0,
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : 0,
      loadComplete: nav ? Math.round(nav.loadEventEnd) : 0,
    };
  });

  await context.close();

  return {
    url,
    ...collected,
    totalTransferKB: Math.round(totalTransferKB),
    totalJSKB: Math.round(totalJSKB),
    requestCount,
  };
}

test.describe("Fase 3 — Auditoria de Performance", () => {
  test("coleta Core Web Vitals das 4 páginas principais", async ({ browser }) => {
    const allMetrics: PageMetrics[] = [];

    for (const target of TARGETS) {
      const url = `https://meucorre.vercel.app${target.url}`;
      console.log(`\n--- Auditando ${target.name} (${target.url}) ---`);

      try {
        const metrics = await collectMetrics(browser, url);
        allMetrics.push(metrics);
        console.log(
          `  TTFB: ${metrics.ttfb}ms | FCP: ${metrics.fcp}ms | LCP: ${metrics.lcp}ms | CLS: ${metrics.cls} | INP: ${metrics.inp ?? "n/a"}ms`,
        );
        console.log(
          `  Requests: ${metrics.requestCount} | Transfer: ${metrics.totalTransferKB}KB | JS: ${metrics.totalJSKB}KB`,
        );
        console.log(`  LCP element: ${metrics.lcpElement}`);
      } catch (err) {
        console.error(`  ERRO ao auditar ${target.url}:`, err);
      }
    }

    // Salva resultados em JSON
    const outDir = "/home/z/my-project/scripts/perf-results";
    try {
      mkdirSync(outDir, { recursive: true });
    } catch {
      // já existe
    }
    const outPath = join(outDir, "lighthouse-audit.json");
    writeFileSync(outPath, JSON.stringify(allMetrics, null, 2));
    console.log(`\nResultados salvos em: ${outPath}`);

    // Resumo
    console.log("\n=== RESUMO CORE WEB VITALS ===");
    console.log("Page            | TTFB  | FCP   | LCP   | CLS   | INP   | JS KB");
    console.log("-----------------|-------|-------|-------|-------|-------|------");
    for (const m of allMetrics) {
      const page = m.url.replace("https://meucorre.vercel.app", "") || "/";
      console.log(
        `${page.padEnd(16)} | ${String(m.ttfb).padStart(5)} | ${String(m.fcp).padStart(5)} | ${String(m.lcp).padStart(5)} | ${m.cls.toFixed(3).padStart(5)} | ${String(m.inp ?? "n/a").padStart(5)} | ${String(m.totalJSKB).padStart(5)}`,
      );
    }

    // Validações mínimas: LCP < 4000ms, CLS < 0.25 (Google "needs improvement")
    for (const m of allMetrics) {
      const page = m.url.replace("https://meucorre.vercel.app", "") || "/";
      if (m.lcp > 0) {
        expect(
          m.lcp,
          `LCP de ${page} (${m.lcp}ms) deve ser < 4000ms`,
        ).toBeLessThan(4000);
      }
      expect(m.cls, `CLS de ${page} (${m.cls}) deve ser < 0.25`).toBeLessThan(0.25);
    }

    expect(allMetrics.length).toBe(TARGETS.length);
  });
});
