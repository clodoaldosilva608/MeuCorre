import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { cachedFetch } from "@/lib/redis-cache";

// ===== GET /api/lifetime-status =====
//
// Retorna o status atual da oferta vitalícia:
//   - totalSold: quantos vitalícios já foram vendidos
//   - maxSales: limite máximo (500 por padrão, configurável via Setting)
//   - remaining: vagas restantes
//   - cutoffDate: data limite (now + 90 dias por padrão, configurável)
//   - available: true se ainda há vagas E não passou da data
//
// Pública — não requer auth (a landing page precisa saber se mostra o vitalício).
//
// SEGURANÇA/PERFORMANCE (P1-1, P1-3):
// - Rate limit 60/IP/15min (cada view da landing chama esta rota)
// - Cache Redis 5min (count em tabela Subscription é caro em escala)
//
// Configuração via model Setting (chaves):
//   - lifetime_max_sales: número máximo de vitalícios (default 500)
//   - lifetime_cutoff_date: data limite ISO (default now + 90 dias)

const DEFAULT_MAX_SALES = 500;
const DEFAULT_CUTOFF_DAYS = 90;

export async function GET(req: NextRequest) {
  // Rate limit por IP
  const limited = await applyRateLimit(req, {
    windowMs: 15 * 60 * 1000,
    maxRequests: 60,
  });
  if (limited) return limited;

  // Cache 5 min — totalSold não muda rápido (só quando nova venda aprovada)
  const CACHE_TTL = 5 * 60 * 1000;

  const data = await cachedFetch("lifetime-status", async () => {
    const now = new Date();

    // Busca configurações do banco (se existirem)
    const settings = await prisma.setting.findMany({
      where: {
        key: { in: ["lifetime_max_sales", "lifetime_cutoff_date"] },
      },
      select: { key: true, value: true },
    });

    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    const maxSales = settingsMap.lifetime_max_sales
      ? parseInt(settingsMap.lifetime_max_sales, 10)
      : DEFAULT_MAX_SALES;

    // Data de cutoff: se configurada, usa; senão, now + 90 dias
    let cutoffDate: Date;
    if (settingsMap.lifetime_cutoff_date) {
      cutoffDate = new Date(settingsMap.lifetime_cutoff_date);
    } else {
      cutoffDate = new Date(now.getTime() + DEFAULT_CUTOFF_DAYS * 24 * 60 * 60 * 1000);
    }

    // Conta quantos vitalícios já foram aprovados
    const totalSold = await prisma.subscription.count({
      where: {
        status: "approved",
        plan: "lifetime",
      },
    });

    const remaining = Math.max(0, maxSales - totalSold);
    const cutoffPassed = now > cutoffDate;
    const available = remaining > 0 && !cutoffPassed;

    return {
      available,
      totalSold,
      maxSales,
      remaining,
      cutoffDate: cutoffDate.toISOString(),
      cutoffPassed,
      message: !available
        ? cutoffPassed
          ? "Oferta vitalício encerrada"
          : "Vagas esgotadas"
        : `${remaining} vagas restantes`,
    };
  }, CACHE_TTL);

  return NextResponse.json(data);
}
