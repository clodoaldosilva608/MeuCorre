import { test } from "@playwright/test";

test("diagnóstico iPhone 3D — captura detalhada", async ({ page }) => {
  console.log("\n=== Acessando landing page ===");
  await page.goto("https://meucorre.vercel.app/", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(8000);

  // Vercel challenge
  const bodyText = await page.content();
  if (bodyText.includes("Vercel Security Checkpoint")) {
    console.log("  Aguardando Vercel challenge...");
    await page.waitForTimeout(10000);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);
  }

  // Rola até a seção do iPhone
  console.log("=== Procurando seção do iPhone ===");
  const heading = page.getByRole("heading", { name: /não é promessa.*é tela/i });
  await heading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);

  // Scroll adicional para garantir que o iPhone inteiro está visível
  await page.evaluate(() => {
    window.scrollBy({ top: 200, behavior: "smooth" });
  });
  await page.waitForTimeout(2000);

  // Captura 1: viewport atual
  console.log("=== Captura 1: viewport ===");
  await page.screenshot({
    path: "/home/z/my-project/public/screenshots/diag-01-viewport.png",
  });

  // Captura 2: aguarda mais 10s para o iframe carregar completamente
  console.log("=== Aguardando 10s para iframe carregar ===");
  await page.waitForTimeout(10000);

  await page.screenshot({
    path: "/home/z/my-project/public/screenshots/diag-02-after-10s.png",
  });

  // Captura 3: scroll para baixo para ver o iPhone completo
  console.log("=== Captura 3: scroll para ver iPhone completo ===");
  await page.evaluate(() => {
    const phone = document.querySelector('[style*="perspective"]');
    if (phone) {
      phone.scrollIntoView({ block: "center", behavior: "smooth" });
    } else {
      window.scrollBy({ top: 300, behavior: "smooth" });
    }
  });
  await page.waitForTimeout(3000);

  await page.screenshot({
    path: "/home/z/my-project/public/screenshots/diag-03-centered.png",
  });

  // Captura 4: full page para ver tudo
  console.log("=== Captura 4: full page ===");
  await page.screenshot({
    path: "/home/z/my-project/public/screenshots/diag-04-fullpage.png",
    fullPage: true,
  });

  // Análise do iframe
  console.log("=== Análise do iframe ===");
  const iframe = page.locator('iframe[src*="/app"]').first();
  const iframeVisible = await iframe.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`  Iframe visível: ${iframeVisible}`);

  if (iframeVisible) {
    const box = await iframe.boundingBox();
    console.log(`  Iframe bounding box:`, JSON.stringify(box));

    const frame = iframe.contentFrame();
    if (frame) {
      // Aguarda mais tempo
      await page.waitForTimeout(5000);

      // Verifica o que tem dentro do iframe
      const innerHTML = await frame.evaluate(() => {
        return document.body?.innerHTML?.substring(0, 500) || "vazio";
      }).catch(() => "erro ao acessar");
      console.log(`  Iframe innerHTML (primeiros 500 chars): ${innerHTML.substring(0, 200)}`);

      // Verifica cor de fundo
      const bgColor = await frame.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      }).catch(() => "erro");
      console.log(`  Iframe background-color: ${bgColor}`);
    }
  }

  // Verifica o container do iPhone
  console.log("=== Análise do container do iPhone ===");
  const phoneContainer = page.locator('[style*="perspective"]').first();
  const phoneVisible = await phoneContainer.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`  Container visível: ${phoneVisible}`);

  if (phoneVisible) {
    const box = await phoneContainer.boundingBox();
    console.log(`  Container bounding box:`, JSON.stringify(box));
  }

  // Verifica o frame do iPhone (border-zinc-700)
  const phoneFrame = page.locator('.rounded-\\[2\\.5rem\\]').first();
  const frameVisible = await phoneFrame.isVisible({ timeout: 3000 }).catch(() => false);
  if (frameVisible) {
    const box = await phoneFrame.boundingBox();
    console.log(`  Phone frame bounding box:`, JSON.stringify(box));
  }

  console.log("\n=== Diagnóstico concluído ===");
});
