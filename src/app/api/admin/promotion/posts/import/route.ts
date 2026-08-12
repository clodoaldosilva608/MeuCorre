import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import * as fs from "node:fs";
import * as path from "node:path";

// POST /api/admin/promotion/posts/import
// Importa as 450 postagens do plano 90 dias (idempotente).
// Body opcional:
//   { "campaignId": "..." } — se informado, importa para a campanha especificada.
//                              Senão, usa (ou cria) "Plano 90 Dias MeuCorre".
//
// Lê scripts/promotion/posts-450.json se existir.
// Caso contrário, retorna erro pedindo para rodar o parser primeiro.
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    campaignId?: string;
  };

  // Localiza o JSON com as 450 postagens
  const jsonPath = path.resolve(
    process.cwd(),
    "scripts/promotion/posts-450.json",
  );
  if (!fs.existsSync(jsonPath)) {
    return NextResponse.json(
      {
        error:
          "Arquivo scripts/promotion/posts-450.json não encontrado. Rode `npx tsx scripts/promotion/parse-90-dias.ts` primeiro.",
      },
      { status: 400 },
    );
  }

  const posts = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as Array<{
    editorialDay: number;
    sequenceNumber: number;
    month: number;
    time: string;
    platform: string;
    format: string;
    pillar: string;
    title: string;
    description: string;
    hashtags: string;
    engagementText: string;
    imageFileName: string;
    baseAssetName: string;
  }>;

  if (!Array.isArray(posts) || posts.length === 0) {
    return NextResponse.json(
      { error: "JSON de postagens vazio ou inválido" },
      { status: 400 },
    );
  }

  // 1. Campanha alvo
  let campaign = body.campaignId
    ? await prisma.campaign.findUnique({ where: { id: body.campaignId } })
    : await prisma.campaign.findFirst({ where: { name: "Plano 90 Dias MeuCorre" } });

  if (!campaign) {
    const startAt = new Date();
    startAt.setUTCHours(0, 0, 0, 0);
    const endAt = new Date(startAt);
    endAt.setUTCDate(endAt.getUTCDate() + 89);
    campaign = await prisma.campaign.create({
      data: {
        name: "Plano 90 Dias MeuCorre",
        description:
          "Calendário editorial completo de 90 dias com 450 postagens (5/dia).",
        objective:
          "Tornar evidente a diferença entre faturamento e lucro real.",
        startAt,
        endAt,
        timezone: "America/Sao_Paulo",
        status: "active",
        color: "#10b981",
        defaultUtm:
          "utm_source=organico&utm_medium=social&utm_campaign=plano90dias",
      },
    });
  }

  // 2. Registra assets únicos
  const imageToAssetId = new Map<string, string>();
  for (const p of posts) {
    if (imageToAssetId.has(p.imageFileName)) continue;
    let asset = await prisma.promotionAsset.findFirst({
      where: { name: p.imageFileName },
    });
    if (!asset) {
      asset = await prisma.promotionAsset.create({
        data: {
          name: p.imageFileName,
          storageKey: `promotion/${p.imageFileName}`,
          publicUrl: null,
          mimeType: "image/png",
          altText: p.title,
          source: "importado",
          baseAssetName: p.baseAssetName || null,
          tags: `${p.platform.toLowerCase()},${p.pillar.toLowerCase().replace(/\s+/g, "-")}`,
        },
      });
    }
    imageToAssetId.set(p.imageFileName, asset.id);
  }

  // 3. Upsert idempotente
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const p of posts) {
    try {
      const [hh, mm] = p.time.split(":").map(Number);
      const publishAt = new Date(campaign.startAt ?? new Date());
      publishAt.setUTCDate(publishAt.getUTCDate() + (p.editorialDay - 1));
      publishAt.setUTCHours(hh + 3, mm, 0, 0); // BRT = UTC-3

      const assetId = imageToAssetId.get(p.imageFileName) ?? null;

      const result = await prisma.promotionPost.upsert({
        where: {
          campaignId_editorialDay_sequenceNumber_platform: {
            campaignId: campaign.id,
            editorialDay: p.editorialDay,
            sequenceNumber: p.sequenceNumber,
            platform: p.platform,
          },
        },
        create: {
          campaignId: campaign.id,
          editorialDay: p.editorialDay,
          sequenceNumber: p.sequenceNumber,
          publishAt,
          timezone: "America/Sao_Paulo",
          platform: p.platform,
          format: p.format,
          pillar: p.pillar,
          title: p.title,
          description: p.description,
          hashtags: p.hashtags || null,
          engagementText: p.engagementText || null,
          cta: "Baixe o app e faça seu primeiro teste",
          destinationUrl: "https://meucorre.vercel.app/",
          altText: p.title,
          status: "pending",
          utmQuery:
            "utm_source=organico&utm_medium=social&utm_campaign=plano90dias",
          assetId,
          createdBy: "system",
        },
        update: {
          format: p.format,
          pillar: p.pillar,
          title: p.title,
          description: p.description,
          hashtags: p.hashtags || null,
          engagementText: p.engagementText || null,
          assetId,
          updatedBy: "system",
        },
      });
      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        created++;
      } else {
        updated++;
      }
    } catch {
      errors++;
    }
  }

  return NextResponse.json({
    campaignId: campaign.id,
    campaignName: campaign.name,
    totalProcessed: posts.length,
    created,
    updated,
    errors,
  });
}
