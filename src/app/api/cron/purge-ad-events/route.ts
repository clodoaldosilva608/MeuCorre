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
// Segurança: protegido por CRON_SECRET (header X-Cron-Secret).
// Configurar Vercel Cron para chamar este endpoint diariamente.
//
// vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/purge-ad-events",
//     "schedule": "0 3 * * *"
//   }]
// }

const PURGE_AFTER_DAYS = 90;

// PUBLIC ROUTE — Esta rota é intencionalmente pública (login/logout/cron usam auth própria)
export async function DELETE(req: NextRequest) {
  // Valida CRON_SECRET
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    logger.warn("CRON_SECRET não configurado — purge não executado");
    return NextResponse.json(
      { error: "CRON_SECRET não configurado" },
      { status: 503 },
    );
  }

  const receivedSecret = req.headers.get("x-cron-secret");
  if (!receivedSecret || receivedSecret !== expectedSecret) {
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
  const receivedSecret = req.headers.get("x-cron-secret");
  if (!receivedSecret || receivedSecret !== expectedSecret) {
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
