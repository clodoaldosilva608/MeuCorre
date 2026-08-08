"""Debug — ver o que tem na página de login da Kiwify."""
import asyncio
from playwright.async_api import async_playwright

INIT_SCRIPT = """
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en'] });
window.chrome = { runtime: {} };
"""

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage",
            ],
        )
        context = await browser.new_context(
            viewport={"width": 1366, "height": 768},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            locale="pt-BR",
        )
        await context.add_init_script(INIT_SCRIPT)
        page = await context.new_page()

        print("Abrindo Kiwify...")
        await page.goto("https://app.kiwify.com.br/", wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(3000)

        url = page.url
        title = await page.title()
        print(f"URL: {url}")
        print(f"Title: {title}")

        # Lista todos os iframes
        frames = page.frames
        print(f"\nFrames ({len(frames)}):")
        for f in frames:
            print(f"  - {f.url} | name={f.name}")

        # Lista todos os inputs da página principal
        print("\nInputs na página principal:")
        inputs = await page.query_selector_all("input")
        for i, inp in enumerate(inputs):
            attrs = await inp.evaluate("""el => ({
                type: el.type, name: el.name, id: el.id,
                placeholder: el.placeholder, value: el.value
            })""")
            print(f"  [{i}] {attrs}")

        # Se houver iframe, lista inputs nele
        for f in frames[1:]:  # skip main
            print(f"\nInputs no frame {f.url}:")
            try:
                inputs = await f.query_selector_all("input")
                for i, inp in enumerate(inputs):
                    attrs = await inp.evaluate("""el => ({
                        type: el.type, name: el.name, id: el.id,
                        placeholder: el.placeholder
                    })""")
                    print(f"  [{i}] {attrs}")
            except Exception as e:
                print(f"  Erro: {e}")

        # Tenta localizar por outros seletores
        print("\nBuscando por texto:")
        for selector in ['h1', 'button', 'a']:
            els = await page.query_selector_all(selector)
            for el in els[:3]:
                txt = await el.text_content()
                if txt and txt.strip():
                    print(f"  {selector}: {txt.strip()[:80]}")

        await page.screenshot(path="/home/z/my-project/download/kiwify-debug.png", full_page=True)
        print("\nScreenshot salvo em download/kiwify-debug.png")

        await browser.close()

asyncio.run(main())
