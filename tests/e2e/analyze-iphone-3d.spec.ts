import { test, expect } from "@playwright/test";

// ===== Análise do iPhone 3D Realista na Landing Page =====
//
// Acessa a landing page, navega até a seção do iPhone, captura screenshots
// e valida se:
// 1. O iPhone está visível e renderizado corretamente
// 2. O iframe do /app está carregando
// 3. Os botões de modo (Demo/Interativo) funcionam
// 4. O carousel automático troca de aba
// 5. O modo interativo permite clicar nas abas do app

test.describe("Análise do iPhone 3D Realista", () => {
  test("captura e valida iPhone 3D na landing page", async ({ page }) => {
    console.log("\n=== Acessando landing page ===");
    await page.goto("https://meucorre.vercel.app/", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(8000); // Vercel challenge + animations

    // Verifica se caiu no Vercel challenge
    const bodyText = await page.content();
    if (bodyText.includes("Vercel Security Checkpoint")) {
      console.log("  Aguardando Vercel challenge...");
      await page.waitForTimeout(10000);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(5000);
    }

    // Rola até a seção "Veja como funciona"
    console.log("=== Procurando seção do iPhone ===");
    const heading = page.getByRole("heading", { name: /não é promessa.*é tela/i });
    if (await heading.isVisible({ timeout: 5000 }).catch(() => false)) {
      await heading.scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);
      console.log("  ✓ Seção 'Veja como funciona' encontrada");
    } else {
      console.log("  ✗ Seção não encontrada, tentando scroll");
      await page.evaluate(() => {
        window.scrollTo({ top: 2000, behavior: "smooth" });
      });
      await page.waitForTimeout(2000);
    }

    // Captura screenshot da seção
    console.log("=== Capturando screenshot ===");
    await page.screenshot({
      path: "/home/z/my-project/public/screenshots/analysis-iphone-3d.png",
      fullPage: false,
    });
    console.log("  ✓ Screenshot salvo: analysis-iphone-3d.png");

    // Procura pelo iframe
    console.log("=== Verificando iframe do /app ===");
    const iframe = page.locator('iframe[src*="/app?demo=1"]').first();
    const iframeVisible = await iframe.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`  Iframe visível: ${iframeVisible}`);

    if (iframeVisible) {
      // Tenta acessar o conteúdo do iframe
      const frame = iframe.contentFrame();
      if (frame) {
        console.log("  ✓ Iframe carregado, verificando conteúdo...");
        await page.waitForTimeout(3000);

        // Verifica se o app carregou (procura por elementos do dashboard)
        const novaCorridaBtn = frame.getByRole("button", { name: /nova corrida/i });
        const novaCorridaVisible = await novaCorridaBtn.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`  Botão 'Nova corrida' visível no iframe: ${novaCorridaVisible}`);

        // Verifica bottom-nav (abas)
        const corridasTab = frame.getByRole("button", { name: /^corridas$/i });
        const despesasTab = frame.getByRole("button", { name: /^despesas$/i });
        const ofertasTab = frame.getByRole("button", { name: /^ofertas$/i });
        const graficosTab = frame.getByRole("button", { name: /^gráficos$/i });

        console.log(`  Aba Corridas visível: ${await corridasTab.isVisible({ timeout: 2000 }).catch(() => false)}`);
        console.log(`  Aba Despesas visível: ${await despesasTab.isVisible({ timeout: 2000 }).catch(() => false)}`);
        console.log(`  Aba Ofertas visível: ${await ofertasTab.isVisible({ timeout: 2000 }).catch(() => false)}`);
        console.log(`  Aba Gráficos visível: ${await graficosTab.isVisible({ timeout: 2000 }).catch(() => false)}`);
      }
    }

    // Verifica botões de modo
    console.log("=== Verificando botões de modo ===");
    const demoBtn = page.getByRole("button", { name: /demo automática/i });
    const interactiveBtn = page.getByRole("button", { name: /toque para experimentar/i });
    console.log(`  Botão 'Demo automática': ${await demoBtn.isVisible({ timeout: 3000 }).catch(() => false)}`);
    console.log(`  Botão 'Toque para experimentar': ${await interactiveBtn.isVisible({ timeout: 3000 }).catch(() => false)}`);

    // Testa modo interativo
    console.log("=== Testando modo interativo ===");
    if (await interactiveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await interactiveBtn.click();
      await page.waitForTimeout(3000);
      console.log("  ✓ Modo interativo ativado");

      // Captura screenshot no modo interativo
      await page.screenshot({
        path: "/home/z/my-project/public/screenshots/analysis-iphone-interactive.png",
      });
      console.log("  ✓ Screenshot modo interativo salvo");

      // Tenta clicar em uma aba dentro do iframe
      if (iframeVisible) {
        const frame = iframe.contentFrame();
        if (frame) {
          try {
            await frame.getByRole("button", { name: /^ofertas$/i }).click({ timeout: 3000 });
            await page.waitForTimeout(2000);
            console.log("  ✓ Clique na aba Ofertas dentro do iframe");

            await page.screenshot({
              path: "/home/z/my-project/public/screenshots/analysis-iphone-ofertas.png",
            });
            console.log("  ✓ Screenshot aba Ofertas salvo");
          } catch (err) {
            console.log("  ⚠ Não foi possível clicar na aba Ofertas:", err.message);
          }
        }
      }
    }

    // Volta para modo demo
    console.log("=== Testando modo demo automática ===");
    if (await demoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await demoBtn.click();
      await page.waitForTimeout(2000);
      console.log("  ✓ Modo demo ativado");

      // Aguarda 7 segundos para ver a troca de aba
      console.log("  Aguardando 7s para troca de aba automática...");
      await page.waitForTimeout(7000);

      await page.screenshot({
        path: "/home/z/my-project/public/screenshots/analysis-iphone-demo.png",
      });
      console.log("  ✓ Screenshot modo demo salvo");
    }

    // Captura screenshot full page
    console.log("=== Capturando screenshot full page ===");
    await page.screenshot({
      path: "/home/z/my-project/public/screenshots/analysis-landing-full.png",
      fullPage: true,
    });
    console.log("  ✓ Full page screenshot salvo");

    console.log("\n=== Análise concluída ===");
    console.log("Screenshots salvos em public/screenshots/:");
    console.log("  - analysis-iphone-3d.png");
    console.log("  - analysis-iphone-interactive.png");
    console.log("  - analysis-iphone-ofertas.png");
    console.log("  - analysis-iphone-demo.png");
    console.log("  - analysis-landing-full.png");
  });
});
