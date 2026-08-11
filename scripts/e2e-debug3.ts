import { chromium, type Page } from "@playwright/test";

const BASE = "https://meucorre.vercel.app";
const TEST_EMAIL = `e2e-d3-${Date.now()}@meucorre-test.com`;

async function clickByText(page: Page, text: string): Promise<boolean> {
  return await page.evaluate((t) => {
    const buttons = Array.from(document.querySelectorAll("button, a"));
    const target = buttons.find((b) => {
      const txt = (b.textContent || "");
      if (!txt.includes(t)) return false;
      if (txt.includes("Compartilhar agora") || txt.includes("Indique")) return false;
      return true;
    });
    if (target) { (target as HTMLElement).click(); return true; }
    return false;
  }, text);
}

async function dismissPopups(page: Page) {
  for (let i = 0; i < 15; i++) {
    const closed = await page.evaluate(() => {
      const buttons = document.querySelectorAll("button");
      let clicked = false;
      buttons.forEach((b) => {
        const t = (b.textContent || "").trim();
        if (["Talvez mais tarde", "Pular", "Depois eu compartilho", "Aceitar", "Recusar", "Fechar", "Close", "Talvez depois"].includes(t)) {
          (b as HTMLElement).click(); clicked = true;
        }
      });
      // Também fecha dialogs via Escape
      return clicked;
    });
    if (!closed) break;
    await page.waitForTimeout(400);
  }
  // Pressiona Escape para fechar qualquer dialog restante
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
  });
  const page = await context.newPage();

  // Cria conta
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

  console.log("=== Debug FAB ===");
  // Verifica todos os botões visíveis
  const allButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("button"))
      .map((b) => ({
        text: (b.textContent || "").trim().substring(0, 40),
        ariaLabel: b.getAttribute("aria-label"),
        classes: b.className.substring(0, 60),
        visible: b.offsetParent !== null,
      }))
      .filter((b) => b.visible);
  });
  console.log("Botões visíveis:", JSON.stringify(allButtons, null, 2));

  // Procura o FAB especificamente
  const fab = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const fabBtn = btns.find((b) => {
      const aria = b.getAttribute("aria-label");
      return aria && (aria.includes("Nova corrida") || aria.includes("Nova despesa"));
    });
    return fabBtn ? { aria: fabBtn.getAttribute("aria-label"), text: fabBtn.textContent } : null;
  });
  console.log("FAB encontrado:", fab);

  await browser.close();
}

run().catch(console.error);
