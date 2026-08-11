import { chromium, type Page } from "@playwright/test";

const BASE = "https://meucorre.vercel.app";
const TEST_EMAIL = `e2e-debug-${Date.now()}@meucorre-test.com`;

async function clickByText(page: Page, text: string): Promise<boolean> {
  return await page.evaluate((t) => {
    const buttons = Array.from(document.querySelectorAll("button, a"));
    const target = buttons.find((b) => (b.textContent || "").includes(t));
    if (target) { (target as HTMLElement).click(); return true; }
    return false;
  }, text);
}

async function dismissPopups(page: Page) {
  for (let i = 0; i < 10; i++) {
    const closed = await page.evaluate(() => {
      const buttons = document.querySelectorAll("button");
      let clicked = false;
      buttons.forEach((b) => {
        const t = (b.textContent || "").trim();
        if (["Talvez mais tarde", "Pular", "Depois eu compartilho", "Aceitar", "Recusar", "Fechar", "Close", "Talvez depois"].includes(t)) {
          (b as HTMLElement).click(); clicked = true;
        }
      });
      return clicked;
    });
    if (!closed) break;
    await page.waitForTimeout(400);
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
    geolocation: { latitude: -23.5505, longitude: -46.6333 },
    permissions: ["geolocation"],
  });
  const page = await context.newPage();

  // Cria conta via quiz
  await page.goto(`${BASE}/quiz?v=${Date.now()}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  await clickByText(page, "10 a 20"); await page.waitForTimeout(2000);
  await clickByText(page, "iFood"); await page.waitForTimeout(2000);
  await clickByText(page, "Não faço ideia"); await page.waitForTimeout(2000);
  await clickByText(page, "gasolina"); await page.waitForTimeout(3000);

  await page.fill('input[placeholder="João Silva"]', "Debug User");
  await page.fill('input[placeholder="seu@email.com"]', TEST_EMAIL);
  await page.fill('input[placeholder="(11) 99999-9999"]', "(11) 99999-0001");
  await page.fill('input[placeholder="Mínimo 6 caracteres"]', "teste123456");
  await page.waitForTimeout(500);
  await clickByText(page, "Ver resultado e ativar trial");
  await page.waitForTimeout(6000);
  await clickByText(page, "Começar a usar");
  await page.waitForTimeout(7000);
  await dismissPopups(page);
  await page.waitForTimeout(2000);

  // DEBUG 1: Corre do dia - finalizar
  console.log("\n=== DEBUG Corre do dia ===");
  await clickByText(page, "Iniciar corre");
  await page.waitForTimeout(3000);

  let correText = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll("section"));
    const corre = sections.find((s) => s.querySelector("h3")?.textContent === "Corre do dia");
    return corre ? corre.innerText : "";
  });
  console.log("Após iniciar:", correText.substring(0, 200));

  await clickByText(page, "Finalizar corre");
  await page.waitForTimeout(2000);

  // Verifica se dialog de confirmação apareceu
  const dialogText = await page.evaluate(() => {
    const dialogs = Array.from(document.querySelectorAll('[role="alertdialog"], [role="dialog"]'));
    return dialogs.map((d) => ({ role: d.getAttribute("role"), text: (d.textContent || "").substring(0, 100) }));
  });
  console.log("Dialogs abertos:", JSON.stringify(dialogText, null, 2));

  // Tenta clicar no botão Finalizar do dialog
  const clicked = await clickByText(page, "Finalizar");
  console.log("Clicou Finalizar no dialog:", clicked);
  await page.waitForTimeout(3000);

  correText = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll("section"));
    const corre = sections.find((s) => s.querySelector("h3")?.textContent === "Corre do dia");
    return corre ? corre.innerText : "";
  });
  console.log("Após finalizar:", correText.substring(0, 200));

  // DEBUG 2: Gráficos
  console.log("\n=== DEBUG Gráficos ===");
  await page.evaluate(() => {
    document.querySelectorAll("nav button").forEach((b) => {
      if ((b.textContent || "").includes("Gráficos")) (b as HTMLElement).click();
    });
  });
  await page.waitForTimeout(5000);

  const chartsDebug = await page.evaluate(() => {
    const svgs = document.querySelectorAll("svg");
    const recharts = document.querySelectorAll(".recharts-surface, .recharts-responsive-container");
    const mainText = document.querySelector("main")?.textContent?.substring(0, 300) || "";
    return {
      svgs: svgs.length,
      recharts: recharts.length,
      mainText,
      svgClasses: Array.from(svgs).map((s) => s.getAttribute("class") || "").slice(0, 3),
    };
  });
  console.log("Charts debug:", JSON.stringify(chartsDebug, null, 2));

  await browser.close();
}

run().catch(console.error);
