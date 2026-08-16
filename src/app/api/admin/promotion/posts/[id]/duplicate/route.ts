import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { z } from "zod";

// POST /api/admin/promotion/posts/:id/duplicate
// Duplica uma postagem, atribuindo um novo editorialDay (próximo disponível)
// ou mantém o mesmo dia com nova sequência/plataforma.
//
// Body:
//   { "mode": "next_day" } — copia para o próximo dia editorial disponível
//   { "mode": "same_day_new_seq" } — copia no mesmo dia com próxima sequência livre
//   { "mode": "same_day_new_platform", "platform": "Instagram" } — copia no mesmo dia/sequência com nova plataforma
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const original = await prisma.promotionPost.findUnique({
    where: { id },
    include: { campaign: true },
  });

  if (!original) {
    return NextResponse.json({ error: "Postagem não encontrada" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    mode?: "next_day" | "same_day_new_seq" | "same_day_new_platform";
    platform?: string;
  };

  const mode = body.mode ?? "next_day";
  let newEditorialDay = original.editorialDay;
  let newSequenceNumber = original.sequenceNumber;
  let newPlatform = original.platform;

  if (mode === "next_day") {
    // Acha próximo dia editorial com menos de 5 posts (ou último + 1)
    const maxDay = await prisma.promotionPost.aggregate({
      where: { campaignId: original.campaignId },
      _max: { editorialDay: true },
    });
    const nextDay = (maxDay._max.editorialDay ?? 0) + 1;
    if (nextDay > 90) {
      return NextResponse.json(
        { error: "Limite de 90 dias editoriais atingido" },
        { status: 400 },
      );
    }
    newEditorialDay = nextDay;
    newSequenceNumber = 1;
  } else if (mode === "same_day_new_seq") {
    const count = await prisma.promotionPost.count({
      where: {
        campaignId: original.campaignId,
        editorialDay: original.editorialDay,
      },
    });
    if (count >= 5) {
      return NextResponse.json(
        { error: "Dia já tem 5 postagens (limite máximo)" },
        { status: 400 },
      );
    }
    newSequenceNumber = count + 1;
  } else if (mode === "same_day_new_platform") {
    if (!body.platform) {
      return NextResponse.json(
        { error: "Plataforma é obrigatória para same_day_new_platform" },
        { status: 400 },
      );
    }
    newPlatform = body.platform;
  }

  // Ajusta publishAt: novo dia = +N dias a partir do original
  const publishAt = new Date(original.publishAt);
  if (mode === "next_day") {
    publishAt.setDate(publishAt.getDate() + 1);
  }

  try {
    const duplicated = await prisma.promotionPost.create({
      data: {
        campaignId: original.campaignId,
        editorialDay: newEditorialDay,
        sequenceNumber: newSequenceNumber,
        publishAt,
        timezone: original.timezone,
        platform: newPlatform,
        format: original.format,
        pillar: original.pillar,
        title: `${original.title} (cópia)`,
        description: original.description,
        hashtags: original.hashtags,
        engagementText: original.engagementText,
        cta: original.cta,
        destinationUrl: original.destinationUrl,
        altText: original.altText,
        videoScript: original.videoScript,
        durationSeconds: original.durationSeconds,
        status: "pending",
        notes: original.notes,
        utmQuery: original.utmQuery,
        assetId: original.assetId,
        createdBy: "admin",
      },
    });
    return NextResponse.json({ post: duplicated }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Já existe uma postagem com esta combinação" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Erro ao duplicar" }, { status: 500 });
  }
}
