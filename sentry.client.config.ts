import * as Sentry from "@sentry/nextjs";

// ===== Sentry initialization =====
// Habilitado apenas se SENTRY_DSN estiver configurado.
// Plano grátis: 5.000 errors/mês, 10.000 performance transactions/mês.

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1, // 10% das transações (custo controlado)
    profilesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    // Ignora erros conhecidos que não são críticos
    ignoreErrors: [
      // Client-side: usuário fechou a página no meio de fetch
      "AbortError",
      // Client-side: rede offline
      "Network request failed",
      // Chrome extension noise
      "top.GLOBALS",
      "canvas.contentDocument",
    ],
    // Filtra URLs que não queremos monitorar
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
    ],
  });
}
