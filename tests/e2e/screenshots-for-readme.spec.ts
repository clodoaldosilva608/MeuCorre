import { test, expect } from "@playwright/test";
import { mkdirSync } from "fs";
import { join } from "path";

// ===== MeuCorre — Captura de Screenshots para README =====
//
// Captura screenshots de todas as telas principais do MeuCorre em
// produção, para documentação no README.md.
//
// Páginas capturadas (desktop 1440x900 + mobile 390x844):
//   1. Landing page (/) — hero com banner + seções
//   2. Login (/login)
//   3. Cadastro (/register)
//   4. Termos (/termos)
//   5. Privacidade (/privacidade)
//   6. Dashboard guest (/app) — aba Corridas
//   7. Dashboard guest (/app) — aba Despesas
//   8. Dashboard guest (/app) — aba Gráficos
//   9. Perfil (/app/perfil) — redireciona para login sem sessão
//
// Saída: /home/z/my-project/public/screenshots/

const OUT_DIR = "/home/z/my-project/public/screenshots";

async function capture(page, name: string, fullPage = false) {
  const path = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage });
  console.log(`  ✓ ${name}.png`);
}

test.describe("Screenshots para README", () => {
  test.beforeAll(() => {
    try {
      mkdirSync(OUT_DIR, { recursive: true });
    } catch {
      // já existe
    }
  });

  test("captura todas as telas (desktop)", async ({ browser }) => {
    // Desktop 1440x900
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // Navega para home e aguarda Vercel Security Checkpoint
    console.log("\n--- Desktop 1440x900 ---");

    // 1. Landing page — hero (viewport only)
    console.log("1. Landing page (hero)...");
    await page.goto("https://meucorre.vercel.app/", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(8000); // Vercel challenge + animations

    // Se caiu no Vercel challenge, aguarda mais
    const bodyText = await page.content();
    if (bodyText.includes("Vercel Security Checkpoint")) {
      console.log("  Aguardando Vercel challenge resolver...");
      await page.waitForTimeout(10000);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(5000);
    }

    await capture(page, "01-landing-hero");

    // 2. Landing page — full page (com scroll completo)
    console.log("2. Landing page (completa)...");
    await capture(page, "02-landing-full", true);

    // 3. Login
    console.log("3. Login...");
    await page.goto("https://meucorre.vercel.app/login", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3000);
    await capture(page, "03-login");

    // 4. Cadastro
    console.log("4. Cadastro...");
    await page.goto("https://meucorre.vercel.app/register", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3000);
    await capture(page, "04-register");

    // 5. Termos
    console.log("5. Termos...");
    await page.goto("https://meucorre.vercel.app/termos", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(2000);
    await capture(page, "05-termos");

    // 6. Privacidade
    console.log("6. Privacidade...");
    await page.goto("https://meucorre.vercel.app/privacidade", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(2000);
    await capture(page, "06-privacidade");

    // 7. Dashboard guest (/app) — aba Corridas
    console.log("7. Dashboard (aba Corridas)...");
    await page.goto("https://meucorre.vercel.app/app", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(5000); // splash + sync init
    // Fecha popups (trial, share, feedback)
    try {
      const closeBtns = page.locator(
        'button[aria-label="Close"], button[aria-label="Fechar"]',
      );
      const btns = await closeBtns.all();
      for (const btn of btns) {
        if (await btn.isVisible({ timeout: 200 }).catch(() => false)) {
          await btn.click({ timeout: 1000, force: true }).catch(() => {});
          await page.waitForTimeout(300);
        }
      }
      // Botões "Talvez mais tarde" / "Fechar"
      for (const pattern of [
        /talvez mais tarde/i,
        /depois eu compartilho/i,
        /fechar/i,
        /close/i,
      ]) {
        try {
          const btn = page.getByRole("button", { name: pattern }).first();
          if (await btn.isVisible({ timeout: 200 })) {
            await btn.click({ timeout: 1500, force: true });
            await page.waitForTimeout(400);
          }
        } catch {}
      }
    } catch {}
    await page.waitForTimeout(2000);
    await capture(page, "07-dashboard-corridas");

    // 8. Dashboard — aba Despesas
    console.log("8. Dashboard (aba Despesas)...");
    try {
      await page.getByRole("button", { name: /^despesas$/i }).click();
      await page.waitForTimeout(2000);
    } catch {}
    await capture(page, "08-dashboard-despesas");

    // 9. Dashboard — aba Gráficos (vazio sem dados)
    console.log("9. Dashboard (aba Gráficos)...");
    try {
      // Volta para corridas primeiro
      await page.getByRole("button", { name: /^corridas$/i }).click();
      await page.waitForTimeout(1000);

      // Adiciona 1 corrida para ter gráfico
      await page.getByRole("button", { name: /nova corrida/i }).click();
      await page.waitForTimeout(800);
      const dialog = page.locator('[role="dialog"]').filter({
        has: page.locator("h2", { hasText: /nova corrida/i }),
      });
      await dialog.locator("button", { hasText: "iFood" }).first().click({ force: true });
      await page.waitForTimeout(300);
      await dialog.locator("button", { hasText: "R$ 25" }).first().click({ force: true });
      await page.waitForTimeout(300);
      await dialog.getByPlaceholder("0,0", { exact: true }).fill("5,0");
      await dialog.getByPlaceholder(/bairro centro/i).fill("Screenshot README");
      await dialog.getByRole("button", { name: /lançar corrida/i }).click({ force: true });
      await page.waitForTimeout(2000);

      // Vai para aba gráficos
      await page.getByRole("button", { name: /^gráficos$/i }).click();
      await page.waitForTimeout(3000);
    } catch (err) {
      console.log("  Aviso ao adicionar corrida:", err.message);
    }
    await capture(page, "09-dashboard-graficos");

    await context.close();
  });

  test("captura telas mobile (390x844)", async ({ browser }) => {
    console.log("\n--- Mobile 390x844 ---");

    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // Landing mobile (hero)
    console.log("10. Landing mobile (hero)...");
    await page.goto("https://meucorre.vercel.app/", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(8000);

    const bodyText = await page.content();
    if (bodyText.includes("Vercel Security Checkpoint")) {
      await page.waitForTimeout(10000);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(5000);
    }
    await capture(page, "10-landing-mobile-hero");

    // Login mobile
    console.log("11. Login mobile...");
    await page.goto("https://meucorre.vercel.app/login", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3000);
    await capture(page, "11-login-mobile");

    // Dashboard mobile
    console.log("12. Dashboard mobile...");
    await page.goto("https://meucorre.vercel.app/app", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(5000);

    // Fecha popups
    try {
      for (const pattern of [
        /talvez mais tarde/i,
        /depois eu compartilho/i,
        /fechar/i,
        /close/i,
      ]) {
        try {
          const btn = page.getByRole("button", { name: pattern }).first();
          if (await btn.isVisible({ timeout: 200 })) {
            await btn.click({ timeout: 1500, force: true });
            await page.waitForTimeout(400);
          }
        } catch {}
      }
    } catch {}
    await page.waitForTimeout(2000);
    await capture(page, "12-dashboard-mobile");

    await context.close();
  });
});
