import { defineConfig, devices } from "@playwright/test";

// ===== Configuração Playwright — MeuCorre =====
//
// Testes E2E que reproduzem as 3 simulações manuais:
// 1. Usuário trial ("Usar grátis primeiro")
// 2. Compra vitalícia (Kiwify checkout + admin grant)
// 3. Abandono de checkout (cai em trial 14 dias)
//
// Como a app real roda em https://meucorre.vercel.app, os testes apontam
// para lá por padrão. Para rodar localmente, use:
//   BASE_URL=http://localhost:3000 npx playwright test

const baseUrl = process.env.BASE_URL ?? "https://meucorre.vercel.app";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // Serial — simula um usuário por vez
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // Um worker só para evitar race conditions entre contas
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: baseUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1440, height: 900 },
    actionTimeout: 15000,
    navigationTimeout: 30000,
    // Testes que criam usuários + fazem lançamentos precisam de mais tempo
    // (registerUser espera 8s para popups, addCorrida ~5s cada)
    timeout: 120000,
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
      testMatch: /mobile.*\.spec\.ts/,
    },
  ],
});
