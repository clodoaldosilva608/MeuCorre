import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { z } from "zod";

// POST /api/admin/promotion/posts/bulk-update
// Atualiza várias postagens de uma vez.
// Body:
//   {
//     "ids": ["id1", "id2", ...],
//     "updates": { "status": "published", "pillar": "Comunidade", ... }
//   }
//
// Campos atualizáveis em bulk: status, pillar, format, cta, destinationUrl,
// utmQuery, notes, assetId
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as {
    ids?: string[];
    updates?: Record<string, unknown>;
  };

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json(
      { error: "ids deve ser um array não vazio" },
      { status: 400 },
    );
  }

  if (!body.updates || Object.keys(body.updates).length === 0) {
    return NextResponse.json(
      { error: "updates deve ter pelo menos um campo" },
      { status: 400 },
    );
  }

  // Filtra apenas campos permitidos para bulk update
  const data: Record<string, unknown> = {};
  const u = body.updates;

  if (u.status !== undefined) {
    const validStatuses = ["pending", "published", "skipped", "failed"];
    if (validStatuses.includes(u.status as string)) data.status = u.status;
  }
  if (u.pillar !== undefined)
    data.pillar = sanitizeString(u.pillar as string, 100) || null;
  if (u.format !== undefined)
    data.format = sanitizeString(u.format as string, 100) || null;
  if (u.cta !== undefined)
    data.cta = sanitizeString(u.cta as string, 200) || null;
  if (u.destinationUrl !== undefined)
    data.destinationUrl =
      sanitizeString(u.destinationUrl as string, 500) || null;
  if (u.utmQuery !== undefined)
    data.utmQuery = sanitizeString(u.utmQuery as string, 500) || null;
  if (u.notes !== undefined)
    data.notes = sanitizeString(u.notes as string, 500) || null;
  if (u.assetId !== undefined)
    data.assetId = typeof u.assetId === "string" ? u.assetId : null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Nenhum campo válido para atualização em bulk" },
      { status: 400 },
    );
  }

  // Limita a 500 ids por requisição
  const ids = body.ids.slice(0, 500);

  const result = await prisma.promotionPost.updateMany({
    where: { id: { in: ids } },
    data,
  });

  return NextResponse.json({
    updated: result.count,
    requested: ids.length,
  });
}
