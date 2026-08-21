// ===== Vitest config =====
//
// Testes unitários para funções críticas do MeuCorre.
// Roda com `npx vitest run` (CI) ou `npx vitest` (watch mode).
//
// Cobertura inicial:
// - env validation (src/lib/env.ts)
// - rate limit (in-memory + Redis)
// - token blacklist
// - input validation (escapeHtml, validateId)
// - sync payload validation
//
// Para rodar:
//   npm install -D vitest @vitest/coverage-v8
//   npx vitest run

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Diretório dos testes
    include: ["src/**/*.test.ts"],
    // Ambiente Node (não DOM)
    environment: "node",
    // Setup global (mocks, etc.)
    setupFiles: [],
    // Coverage
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/lib/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.d.ts"],
    },
    // Timeout (ms)
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
