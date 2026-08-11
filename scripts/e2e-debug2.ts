import { chromium, type Page } from "@playwright/test";

const BASE = "https://meucorre.vercel.app";
const TEST_EMAIL = `e2e-d2-${Date.now()}@meucorre-test.com`;

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

  // Lança corrida
  console.log("=== Debug lançar corrida ===");
  await clickByText(page, "Nova corrida");
  await page.waitForTimeout(3000);

  // Verifica se dialog abriu
  const dialogInfo = await page.evaluate(() => {
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
    return dialogs.map((d) => ({
      visible: d.getAttribute("data-state"),
      text: (d.textContent || "").substring(0, 200),
    }));
  });
  console.log("Dialogs:", JSON.stringify(dialogInfo, null, 2));

  // Seleciona iFood
  await clickByText(page, "iFood");
  await page.waitForTimeout(1000);
  await clickByText(page, "R$ 25");
  await page.waitForTimeout(1000);

  // Verifica estado do form
  const formState = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return "no dialog";
    const buttons = Array.from(dialog.querySelectorAll("button"));
    const selected = buttons.filter((b) => b.getAttribute("aria-pressed") === "true" || b.classList.toString().includes("emerald")).map((b) => b.textContent?.trim());
    const inputs = Array.from(dialog.querySelectorAll("input")).map((i) => ({ placeholder: i.placeholder, value: (i as HTMLInputElement).value }));
    const launchBtn = dialog.querySelector('button[type="submit"], button:last-of-type');
    return { selected, inputs, launchBtnDisabled: launchBtn?.hasAttribute("disabled"), launchBtnText: launchBtn?.textContent };
  });
  console.log("Form state:", JSON.stringify(formState, null, 2));

  // Preenche km
  await page.evaluate(() => {
    const input = document.querySelector('input[placeholder="0,0"]') as HTMLInputElement;
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      setter?.call(input, "5");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  await page.waitForTimeout(500);

  // Tenta submeter via form submit
  const submitted = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return false;
    const form = dialog.querySelector("form");
    if (form) {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      return true;
    }
    // fallback: clica no botão
    const btn = Array.from(dialog.querySelectorAll("button")).find((b) => b.textContent?.includes("Lançar"));
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log("Submitted:", submitted);
  await page.waitForTimeout(5000);

  // Verifica resultado
  const stats = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll("h2, h3"));
    return headings.map((h) => h.textContent || "").slice(0, 6);
  });
  console.log("Stats após lançar:", stats);

  // Verifica IndexedDB
  const dbData = await page.evaluate(async () => {
    try {
      const dbs = await indexedDB.databases();
      const meucorreDb = dbs.find((d) => d.name?.includes("MeuCorreDB"));
      if (!meucorreDb) return "no MeuCorreDB";
      return { dbName: meucorreDb.name, version: meucorreDb.version };
    } catch (e) {
      return "error: " + (e as Error).message;
    }
  });
  console.log("IndexedDB:", dbData);

  await browser.close();
}

run().catch(console.error);
