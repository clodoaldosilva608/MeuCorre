import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// ===== Cron job: Purge de AdEvent =====
//
// DELETE /api/cron/purge-ad-events
//
// Arquiva eventos de anúncios (views/clicks) com mais de 90 dias.
// Previne crescimento infinito da tabela AdEvent.
//
// SEGURANÇA (P0-7 corrigido):
// Antes, esperava header `x-cron-secret` mas Vercel Cron envia
// `Authorization: Bearer <CRON_SECRET>`. Resultado: purge nunca rodava,
// AdEvent crescia indefinidamente.
// Agora aceita `Authorization: Bearer` (padrão Vercel) e ainda mantém
// `x-cron-secret` para backward compat.
//
// vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/purge-ad-events",
//     "schedule": "0 3 * * *"
//   }]
// }

const PURGE_AFTER_DAYS = 90;

// Helper: valida se a request vem do cron legítimo (Vercel envia Authorization: Bearer)
function isCronAuthorized(req: NextRequest): boolean {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) return false;

  // Formato 1: Authorization: Bearer <secret> (padrão Vercel Cron)
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${expectedSecret}`) return true;

  // Formato 2: x-cron-secret: <secret> (legacy, mantido para compat)
  const cronHeader = req.headers.get("x-cron-secret");
  if (cronHeader === expectedSecret) return true;

  return false;
}

export async function DELETE(req: NextRequest) {
  // Valida CRON_SECRET — fail closed
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    logger.warn("CRON_SECRET não configurado — purge não executado");
    return NextResponse.json(
      { error: "CRON_SECRET não configurado" },
      { status: 503 },
    );
  }

  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Calcula cutoff date (90 dias atrás)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - PURGE_AFTER_DAYS);

  try {
    // Conta eventos a serem deletados (para log)
    const count = await prisma.adEvent.count({
      where: { createdAt: { lt: cutoffDate } },
    });

    if (count === 0) {
      logger.info("Purge AdEvent: nenhum evento para deletar");
      return NextResponse.json({ ok: true, deleted: 0 });
    }

    // Deleta em batches de 1000 para não sobrecarregar o banco
    const BATCH_SIZE = 1000;
    let totalDeleted = 0;
    let batchDeleted = 0;

    do {
      // Busca IDs dos eventos a deletar
      const events = await prisma.adEvent.findMany({
        where: { createdAt: { lt: cutoffDate } },
        select: { id: true },
        take: BATCH_SIZE,
      });

      if (events.length === 0) break;

      const ids = events.map((e) => e.id);
      const result = await prisma.adEvent.deleteMany({
        where: { id: { in: ids } },
      });

      batchDeleted = result.count;
      totalDeleted += batchDeleted;
    } while (batchDeleted === BATCH_SIZE); // continua se deletou batch cheio

    logger.info("Purge AdEvent concluído", {
      deleted: totalDeleted,
      cutoffDate: cutoffDate.toISOString(),
    });

    return NextResponse.json({
      ok: true,
      deleted: totalDeleted,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    logger.error("Erro no purge AdEvent", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Erro ao purgar eventos" },
      { status: 500 },
    );
  }
}

// GET para health check do cron
export async function GET(req: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ ok: true, configured: false });
  }
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - PURGE_AFTER_DAYS);

  const count = await prisma.adEvent.count({
    where: { createdAt: { lt: cutoffDate } },
  });

  return NextResponse.json({
    ok: true,
    configured: true,
    eventsToPurge: count,
    cutoffDate: cutoffDate.toISOString(),
  });
}
