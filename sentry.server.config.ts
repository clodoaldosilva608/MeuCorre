import * as Sentry from "@sentry/nextjs";

// ===== Sentry server-side init =====
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    // Captura erros não tratados em serverless functions
    integrations: [],
  });
}
