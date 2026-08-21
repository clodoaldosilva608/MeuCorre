// ===== Multi-region deployment (P4-2) =====
//
// P4-2: Multi-region deployment para reduzir latência global.
//
// Estratégia:
// - Vercel Edge Functions rodam em 19+ regiões globalmente
// - API Routes rodam em 1 região (vercel.json `regions`)
// - Para Brasil: já configurado `regions: ["gru1"]` (São Paulo)
// - Para US/EU: deploy separado em `iad1` ou `fra1`
//
// Para DB multi-region (read replicas regionais):
// - Supabase Pro tem 1 read replica incluída
// - Supabase Enterprise tem até 3 read replicas
// - Configurar SUPABASE_READ_REPLICA_BR_URL e SUPABASE_READ_REPLICA_US_URL
// - Helper detecta região do cliente e usa replica mais próxima
//
// Detecção de região:
// - Vercel seta `x-vercel-ip-country` header (código ISO do país)
// - BR → gru1 (replica BR)
// - US → iad1 (primary, US-East)
// - Outros → primary (US-East, fallback)

import { prisma } from "@/lib/prisma";

// Lê região do cliente a partir do header da Vercel
export function getClientRegion(req: Request): "BR" | "US" | "EU" | "OTHER" {
  const country = req.headers.get("x-vercel-ip-country")?.toUpperCase();
  if (country === "BR") return "BR";
  if (country === "US" || country === "CA" || country === "MX") return "US";
  if (
    country &&
    ["GB", "DE", "FR", "ES", "IT", "NL", "PT", "IE"].includes(country)
  ) {
    return "EU";
  }
  return "OTHER";
}

// Cliente Prisma para read replica BR (se configurado)
// Em Vercel com `regions: ["gru1"]`, todo o tráfego BR já roda em São Paulo
// mas DB está em Washington DC. Esta réplica (se configurada) reduz latência
// de leitura admin em ~200ms (era ~250ms, fica ~50ms).
let prismaBr: typeof prisma | null = null;
let prismaUs: typeof prisma | null = null;
let prismaEu: typeof prisma | null = null;

// Inicializa replicas regionais (lazy)
async function getRegionalPrisma(region: "BR" | "US" | "EU" | "OTHER"): Promise<typeof prisma> {
  if (region === "US") {
    if (!prismaUs) {
      const { PrismaClient } = await import("@prisma/client");
      const url = process.env.SUPABASE_READ_REPLICA_US_URL;
      prismaUs = url ? new PrismaClient({ datasources: { db: { url } } }) : prisma;
    }
    return prismaUs;
  }

  if (region === "BR") {
    if (!prismaBr) {
      const { PrismaClient } = await import("@prisma/client");
      const url = process.env.SUPABASE_READ_REPLICA_BR_URL;
      prismaBr = url ? new PrismaClient({ datasources: { db: { url } } }) : prisma;
    }
    return prismaBr;
  }

  if (region === "EU") {
    if (!prismaEu) {
      const { PrismaClient } = await import("@prisma/client");
      const url = process.env.SUPABASE_READ_REPLICA_EU_URL;
      prismaEu = url ? new PrismaClient({ datasources: { db: { url } } }) : prisma;
    }
    return prismaEu;
  }

  // OTHER → primary (fallback)
  return prisma;
}

// Helper para queries de leitura admin — usa replica mais próxima do cliente
// ATENÇÃO: NUNCA usar para escritas (somente leitura)
export async function getRegionalReadPrisma(
  req: Request,
): Promise<typeof prisma> {
  const region = getClientRegion(req);
  return getRegionalPrisma(region);
}

// Configuração para Vercel multi-region:
//
// vercel.json:
//   {
//     "regions": ["gru1", "iad1", "fra1"]  // 3 regiões: BR, US, EU
//   }
//
// Em cada região, Vercel cria uma function separada. Custo:
// - 3x function invocations (mas cache Edge reduz drasticamente)
// - DB connections: Supabase Pro aguenta (PgBouncer com 200 connections)
//
// Para DB regional:
// - BR (gru1): SUPABASE_READ_REPLICA_BR_URL
// - US (iad1): DATABASE_URL (primary, Washington DC)
// - EU (fra1): SUPABASE_READ_REPLICA_EU_URL
//
// Importante: escritas SEMPRE vão para o primary (US-East).
// Leituras admin vão para replica regional (latência menor).
