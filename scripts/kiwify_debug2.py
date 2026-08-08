"""Tenta login e captura TODA a resposta (HTML + mensagem de erro)."""
import asyncio
from playwright.async_api import async_playwright

EMAIL = "clodoaldo608@gmail.com"
PASSWORD = "Silva88677488@#"

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
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        context = await browser.new_context(
            viewport={"width": 1366, "height": 768},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            locale="pt-BR",
        )
        await context.add_init_script(INIT_SCRIPT)
        page = await context.new_page()

        # Captura TODAS as responses de rede
        responses = []
        page.on("response", lambda r: responses.append({
            "url": r.url,
            "status": r.status,
            "method": r.request.method,
        }))

        await page.goto("https://app.kiwify.com.br/", wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(2000)

        print("Preenchendo campos...")
        await page.locator('input[name="username"]').fill(EMAIL)
        await page.locator('input[name="password"]').fill(PASSWORD)
        await page.wait_for_timeout(500)

        # Captura valor real
        email_val = await page.locator('input[name="username"]').input_value()
        pass_val = await page.locator('input[name="password"]').input_value()
        print(f"Email: '{email_val}' (len={len(email_val)})")
        print(f"Senha: '{pass_val}' (len={len(pass_val)})")
        print(f"Senha bytes: {pass_val.encode('utf-8')}")

        print("\nClicando Continuar...")
        await page.locator('button:has-text("Continuar")').click()

        # Espera pra ver resultado
        await page.wait_for_timeout(5000)

        # Captura mensagem de erro específica
        error_msg = await page.evaluate("""() => {
            const errs = document.querySelectorAll('[class*=error], [class*=alert], [role=alert]');
            return Array.from(errs).map(e => e.textContent.trim()).filter(Boolean);
        }""")
        print(f"\nMensagens de erro: {error_msg}")

        # Pega todo o texto visível
        body_text = await page.evaluate("() => document.body.innerText")
        print(f"\nTexto da página (primeiros 500 chars):\n{body_text[:500]}")

        # Filtra responses de auth
        print("\n=== Respostas de rede (auth) ===")
        for r in responses:
            if "auth" in r["url"] or "login" in r["url"]:
                print(f"  {r['method']} {r['status']} {r['url'][:100]}")

        await browser.close()

asyncio.run(main())
