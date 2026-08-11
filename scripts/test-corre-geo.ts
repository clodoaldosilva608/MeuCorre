import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    geolocation: { latitude: -23.5505, longitude: -46.6333 },
    permissions: ['geolocation'],
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('[console]', msg.text()));
  page.on('pageerror', err => console.log('[pageerror]', err.message));

  console.log('Navegando para /app...');
  await page.goto('https://meucorre.vercel.app/app', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  console.log('Fechando popups...');
  for (let i = 0; i < 8; i++) {
    const closed = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      let clicked = false;
      buttons.forEach(b => {
        const t = b.textContent.trim();
        if (['Talvez mais tarde', 'Pular', 'Depois eu compartilho', 'Fechar', 'Aceitar'].includes(t)) {
          b.click();
          clicked = true;
        }
      });
      return clicked;
    });
    if (!closed) break;
    await page.waitForTimeout(500);
  }

  await page.waitForTimeout(2000);

  const correSection = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('section'));
    const corre = sections.find(s => s.querySelector('h3')?.textContent === 'Corre do dia');
    return corre ? corre.innerText : 'NOT FOUND';
  });
  console.log('=== Corre do dia (antes) ===');
  console.log(correSection);

  console.log('\nClicando em Iniciar corre...');
  await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(b => {
      if (b.textContent.trim() === 'Iniciar corre') b.click();
    });
  });

  await page.waitForTimeout(4000);

  const afterClick = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('section'));
    const corre = sections.find(s => s.querySelector('h3')?.textContent === 'Corre do dia');
    return corre ? corre.innerText : 'NOT FOUND';
  });
  console.log('=== Após clicar Iniciar corre ===');
  console.log(afterClick);

  await page.screenshot({ path: '/home/z/my-project/screenshots/test-corre-geoperm.png', fullPage: false });
  console.log('\nScreenshot salvo');

  await browser.close();
})();
