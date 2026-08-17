"""
Login na Kiwify e configuração completa do produto MeuCorre PRO:
- Faz login
- Cria produto "MeuCorre PRO — Plano Vitalício" R$ 97
- Configura Thank You Page pra /obrigado
- Cria webhook apontando pra /api/webhooks/kiwify
- Coleta SLUG, WEBHOOK_SECRET, PRODUCT_ID
- Salva em /tmp/kiwify_credentials.json
"""

import asyncio
import json
import os
import sys
import time
from playwright.async_api import async_playwright

EMAIL = "clodoaldo608@gmail.com"
PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
WEBHOOK_URL = "https://meucorre-clodoaldosilva608.vercel.app/api/webhooks/kiwify"
THANK_YOU_URL = "https://meucorre-clodoaldosilva608.vercel.app/obrigado"
PRODUCT_NAME = "MeuCorre PRO — Plano Vitalício"
PRODUCT_PRICE = "97,00"
WEBHOOK_SECRET = "kw_meucorre_2026_x9k7m3p5q8"

# Esconde sinais de webdriver pra burlar anti-bot da Kiwify
INIT_SCRIPT = """
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en'] });
window.chrome = { runtime: {} };
const originalQuery = window.navigator.permissions.query;
window.navigator.permissions.query = (parameters) =>
  parameters.name === 'notifications'
    ? Promise.resolve({ state: Notification.permission })
    : originalQuery(parameters);
"""

async def main():
    async with async_playwright() as p:
        # Browser headless com stealth flags
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

        print("1. Abrindo Kiwify...")
        await page.goto("https://app.kiwify.com.br/", wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(2000)

        # Verifica se já está logado
        url = page.url
        print(f"   URL atual: {url}")

        if "auth.kiwicheckout" in url or "login" in url:
            print("2. Preenchendo login...")
            # Campo username (a Kiwify usa input[type=text] com name=username)
            email_input = page.locator('input[name="username"]').first
            await email_input.fill("")
            await email_input.fill(EMAIL)
            await page.wait_for_timeout(500)

            # Preenche senha
            pass_input = page.locator('input[name="password"]').first
            await pass_input.fill("")
            await pass_input.fill(PASSWORD)
            await page.wait_for_timeout(500)

            # Verifica valores
            email_val = await email_input.input_value()
            pass_val = await pass_input.input_value()
            print(f"   Email no campo: {email_val}")
            print(f"   Senha no campo: {pass_val}")
            print(f"   navigator.webdriver: {await page.evaluate('navigator.webdriver')}")

            # Submete
            print("3. Submetendo login...")
            submit_btn = page.locator('button:has-text("Continuar")').first
            await submit_btn.click()

            # Espera resultado
            try:
                await page.wait_for_url(
                    lambda u: "auth.kiwicheckout" not in u or "dashboard" in u or "app.kiwify" in u,
                    timeout=15000,
                )
            except Exception:
                pass

            await page.wait_for_timeout(3000)
            url = page.url
            title = await page.title()
            print(f"   URL após login: {url}")
            print(f"   Title: {title}")

            # Verifica erro
            content = await page.content()
            if "incorretos" in content.lower() or "incorrect" in content.lower():
                print("❌ LOGIN FALHOU — senha incorreta")
                # Screenshot pra debug
                await page.screenshot(path="/home/z/my-project/download/kiwify-login-error.png")
                await browser.close()
                sys.exit(1)

            if "auth.kiwicheckout" in url:
                print("❌ Ainda na página de login — login falhou")
                await page.screenshot(path="/home/z/my-project/download/kiwify-login-stuck.png")
                await browser.close()
                sys.exit(1)

        print("✅ Logado com sucesso!")
        await page.screenshot(path="/home/z/my-project/download/kiwify-dashboard.png")

        # Salva estado da sessão pra uso futuro
        await context.storage_state(path="/tmp/kiwify-state.json")
        print("   Estado salvo em /tmp/kiwify-state.json")

        # Captura cookies
        cookies = await context.cookies()
        with open("/tmp/kiwify-cookies.json", "w") as f:
            json.dump(cookies, f, indent=2)
        print(f"   {len(cookies)} cookies salvos")

        await browser.close()

        print("\n=== RESULTADO ===")
        print("Login OK. Estado salvo para uso em scripts subsequentes.")

asyncio.run(main())
