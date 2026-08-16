import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/debug-auth
// Endpoint temporário de diagnóstico — NÃO requer auth.
// Retorna o estado das variáveis de ambiente e do banco para identificar
// por que o login do admin não está funcionando.
//
// ⚠️ REMOVER este endpoint após resolver o problema de login.

export async function GET() {
  const envStatus = {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL ? "✓ configurado" : "✗ AUSENTE",
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? "✓ configurado" : "✗ AUSENTE",
    ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET ? "✓ configurado" : "✗ AUSENTE",
    DATABASE_URL: process.env.DATABASE_URL
      ? `✓ configurado (começa com: ${process.env.DATABASE_URL.substring(0, 10)}...)`
      : "✗ AUSENTE",
    NODE_ENV: process.env.NODE_ENV ?? "undefined",
  };

  // Testa conexão com banco e tabela AdminUser
  let dbStatus = "não testado";
  let adminUserTableExists = false;
  let adminCount = 0;

  try {
    const count = await prisma.adminUser.count();
    adminUserTableExists = true;
    adminCount = count;
    dbStatus = "✓ conectado";
  } catch (err) {
    dbStatus = `✗ erro: ${(err as Error).message}`;
  }

  // Testa se consegue ler a tabela Ad (mais básica)
  let adTableStatus = "não testado";
  try {
    await prisma.ad.count();
    adTableStatus = "✓ tabela Ad acessível";
  } catch (err) {
    adTableStatus = `✗ erro: ${(err as Error).message}`;
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: envStatus,
    database: {
      status: dbStatus,
      adminUserTableExists,
      adminCount,
      adTable: adTableStatus,
    },
    diagnosis: getDiagnosis(envStatus, dbStatus, adminUserTableExists),
    nextSteps: getNextSteps(envStatus, dbStatus, adminUserTableExists),
  });
}

function getDiagnosis(
  env: Record<string, string>,
  db: string,
  adminTableExists: boolean,
): string {
  if (env.ADMIN_EMAIL.includes("AUSENTE") || env.ADMIN_PASSWORD.includes("AUSENTE")) {
    return "Credenciais de admin (ADMIN_EMAIL/ADMIN_PASSWORD) não estão configuradas nas env vars. Configure isso na Vercel Project Settings → Environment Variables.";
  }
  if (env.ADMIN_JWT_SECRET.includes("AUSENTE")) {
    return "ADMIN_JWT_SECRET não está configurado. Sem ele, o JWT não pode ser assinado. Configure na Vercel Project Settings.";
  }
  if (db.includes("erro")) {
    return "Banco de dados inacessível. Como o schema usa SQLite, o DATABASE_URL deve começar com 'file:'. Na Vercel, SQLite não persiste — considere migrar para Postgres (Supabase) ou usar o login via env vars (que já é o fallback).";
  }
  if (!adminTableExists) {
    return "Tabela AdminUser não existe no banco. Login via env vars (ADMIN_EMAIL/ADMIN_PASSWORD) deve funcionar como fallback. Se não funciona, verifique se as credenciais digitadas conferem com as env vars.";
  }
  return "Configuração parece OK. Se login ainda falha, verifique se email/senha digitados conferem exatamente com ADMIN_EMAIL/ADMIN_PASSWORD.";
}

function getNextSteps(
  env: Record<string, string>,
  db: string,
  adminTableExists: boolean,
): string[] {
  const steps: string[] = [];

  if (env.ADMIN_EMAIL.includes("AUSENTE") || env.ADMIN_PASSWORD.includes("AUSENTE")) {
    steps.push("1. Vá em https://vercel.com/[seu-projeto]/settings/environment-variables");
    steps.push("2. Adicione ADMIN_EMAIL com o email do admin (ex: admin@meucorre.com)");
    steps.push("3. Adicione ADMIN_PASSWORD com a senha do admin");
    steps.push("4. Faça redeploy (Deployments → Redeploy)");
  }
  if (env.ADMIN_JWT_SECRET.includes("AUSENTE")) {
    steps.push("1. Gere um secret aleatório: rode `openssl rand -hex 32` no terminal");
    steps.push("2. Adicione ADMIN_JWT_SECRET na Vercel com esse valor");
    steps.push("3. Faça redeploy");
  }
  if (db.includes("erro")) {
    steps.push("Banco SQLite não funciona na Vercel (filesystem efêmero). Para resolver:");
    steps.push("  Opção A (rápida): usar apenas login via env vars (já é o fallback atual)");
    steps.push("  Opção B (recomendado): migrar para Postgres — criar projeto no Supabase e atualizar DATABASE_URL");
  }
  if (steps.length === 0) {
    steps.push("Tudo configurado. Se login ainda falha:");
    steps.push("1. Verifique se está digitando email/senha exatamente como nas env vars");
    steps.push("2. Limpe cookies do navegador e tente novamente");
    steps.push("3. Tente em aba anônima");
  }

  return steps;
}
