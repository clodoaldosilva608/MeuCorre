// ===== Validação de variáveis de ambiente on boot =====
//
// Carga inicial (lazy) na primeira vez que o servidor recebe uma request.
// Se variáveis obrigatórias estiverem ausentes, lança erro explícito em
// vez de deixar o sistema rodar com configuração quebrada (modo "silently
// insecure").
//
// Uso:
//   import { assertRequiredEnv } from "@/lib/env";
//   assertRequiredEnv(); // chamar no início de rotas críticas (uma vez por cold start)
//
// OU:
//   import { env } from "@/lib/env";
//   const dbUrl = env.DATABASE_URL; // já validado

import { z } from "zod";

// Schema de env vars obrigatórias em produção.
// Em desenvolvimento/test, mais permissivo (algumas podem ser opcionais).
const isProd = process.env.NODE_ENV === "production";

const envSchema = z.object({
  // ===== Banco de dados (CRÍTICO) =====
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL é obrigatório (Supabase pooler URL)"),
  DIRECT_URL: z
    .string()
    .min(1, "DIRECT_URL é obrigatório (Supabase direct URL para migrations)"),

  // ===== Autenticação (CRÍTICO) =====
  USER_JWT_SECRET: z
    .string()
    .min(32, "USER_JWT_SECRET deve ter no mínimo 32 caracteres"),
  ADMIN_JWT_SECRET: z
    .string()
    .min(32, "ADMIN_JWT_SECRET deve ter no mínimo 32 caracteres"),

  // ===== App =====
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),

  // ===== Opcionais (com avisos se ausentes) =====
  CRON_SECRET: z.string().optional(),
  KIWIFY_WEBHOOK_SECRET: z.string().optional(),
  KIWIFY_CLIENT_ID: z.string().optional(),
  KIWIFY_CLIENT_SECRET: z.string().optional(),
  KIWIFY_ACCOUNT_ID: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;
let validationError: Error | null = null;

// Valida as env vars uma única vez (cacheia resultado).
// Em produção, lança erro se obrigatórias ausentes.
// Em dev, apenas loga warnings.
export function assertRequiredEnv(): Env {
  if (cachedEnv) return cachedEnv;
  if (validationError) throw validationError;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    const err = new Error(
      `[env] Variáveis de ambiente inválidas/ausentes:\n${issues}\n\n` +
        `Em produção, corrija as env vars na Vercel antes do deploy.`,
    );
    validationError = err;

    if (isProd) {
      // Produção: lança erro e quebra a request — fail closed.
      console.error(err.message);
      throw err;
    } else {
      // Dev: apenas avisa, não bloqueia (para não atrapalhar dev local).
      console.warn(err.message);
    }
  }

  cachedEnv = result.success ? result.data : (process.env as unknown as Env);

  // Avisos de opcionais ausentes que podem impactar funcionalidades
  if (!process.env.CRON_SECRET) {
    console.warn("[env] CRON_SECRET não configurado — cron jobs não funcionarão");
  }
  if (!process.env.KIWIFY_WEBHOOK_SECRET) {
    console.warn(
      "[env] KIWIFY_WEBHOOK_SECRET não configurado — webhook Kiwify rejeitará todas as requests",
    );
  }
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn(
      "[env] Upstash Redis não configurado — rate limit cai para in-memory (ineficiente em serverless)",
    );
  }
  if (!process.env.RESEND_API_KEY) {
    console.warn("[env] RESEND_API_KEY não configurado — reset de senha não enviará email");
  }

  return cachedEnv;
}

// Helper: valida uma env var específica (útil para rotas que precisam de algo específico)
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[env] Variável de ambiente obrigatória ausente: ${key}`,
    );
  }
  return value;
}

// Helper: lê env var opcional com fallback (sem lançar erro)
export function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}
