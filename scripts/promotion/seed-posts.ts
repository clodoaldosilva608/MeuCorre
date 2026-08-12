// ===== Seed: importar 450 postagens no banco =====
//
// Lê scripts/promotion/posts-450.json e importa para o banco.
// Cria a campanha "Plano 90 Dias MeuCorre" se não existir.
// Idempotente: se a campanha já tem 450 posts, não duplica.
//
// Uso:
//   DATABASE_URL=<supabase_url> DIRECT_URL=<supabase_url> npx tsx scripts/promotion/seed-posts.ts
//
// Antes de rodar: npx prisma db push (para criar as 5 tabelas novas)

import { PrismaClient } from "@prisma/client";
import * as fs from "node:fs";
import * as path from "node:path";

const prisma = new PrismaClient({ log: ["error", "warn"] });

interface ParsedPost {
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
}

const POSTS_JSON = path.resolve(process.cwd(), "scripts/promotion/posts-450.json");

// Horário padrão de Brasília (UTC-3). Para simplicidade, usamos UTC e ajustamos.
// Como publishAt é armazenado em UTC, e BRT = UTC-3, então 07:30 BRT = 10:30 UTC.
// Mas para o seed, usamos a data "editorial" sem timezone real — o admin ajusta depois.
function computePublishAt(startAt: Date, editorialDay: number, time: string): Date {
  const [hh, mm] = time.split(":").map(Number);
  const d = new Date(startAt);
  // editorialDay 1 = dia 0 (data inicial)
  d.setUTCDate(d.getUTCDate() + (editorialDay - 1));
  // Ajuste BRT → UTC: BRT = UTC-3, então UTC = BRT + 3
  d.setUTCHours(hh + 3, mm, 0, 0);
  return d;
}

async function main() {
  console.log("📖 Lendo:", POSTS_JSON);
  const posts: ParsedPost[] = JSON.parse(fs.readFileSync(POSTS_JSON, "utf8"));
  console.log(`📊 ${posts.length} postagens para importar`);

  // 1. Cria campanha se não existir
  const campaignName = "Plano 90 Dias MeuCorre";
  let campaign = await prisma.campaign.findFirst({
    where: { name: campaignName },
  });

  if (!campaign) {
    console.log(`➕ Criando campanha "${campaignName}"...`);
    const startAt = new Date();
    startAt.setUTCHours(0, 0, 0, 0);
    const endAt = new Date(startAt);
    endAt.setUTCDate(endAt.getUTCDate() + 89);
    campaign = await prisma.campaign.create({
      data: {
        name: campaignName,
        description:
          "Calendário editorial completo de 90 dias com 450 postagens (5/dia) para Instagram, TikTok, Facebook e YouTube.",
        objective:
          "Tornar evidente a diferença entre faturamento e lucro real, apresentar o MeuCorre e estimular o primeiro teste gratuito.",
        startAt,
        endAt,
        timezone: "America/Sao_Paulo",
        status: "active",
        color: "#10b981",
        defaultUtm: "utm_source=organico&utm_medium=social&utm_campaign=plano90dias",
      },
    });
    console.log(`   ✅ Campanha criada: ${campaign.id}`);
  } else {
    console.log(`   ♻️  Campanha já existe: ${campaign.id}`);
  }

  // 2. Verifica posts já importados
  const existingCount = await prisma.promotionPost.count({
    where: { campaignId: campaign.id },
  });
  console.log(`\n📦 Posts já importados: ${existingCount}`);
  if (existingCount >= 450) {
    console.log("   ✅ Já tem 450 posts — pulando importação (idempotente)");
    return;
  }

  // 3. Cria assets únicos (por baseAssetName) e mapeia imageFileName → assetId
  console.log("\n🎨 Registrando assets únicos por baseAssetName...");
  const uniqueAssets = new Map<string, ParsedPost[]>();
  for (const p of posts) {
    if (!p.imageFileName) continue;
    const existing = uniqueAssets.get(p.imageFileName) ?? [];
    existing.push(p);
    uniqueAssets.set(p.imageFileName, existing);
  }
  console.log(`   ${uniqueAssets.size} nomes de imagem únicos`);

  const imageToAssetId = new Map<string, string>();
  for (const [imageName, relatedPosts] of uniqueAssets) {
    const first = relatedPosts[0];
    // Verifica se já existe asset com este nome
    let asset = await prisma.promotionAsset.findFirst({
      where: { name: imageName },
    });
    if (!asset) {
      asset = await prisma.promotionAsset.create({
        data: {
          name: imageName,
          storageKey: `promotion/${imageName}`,
          publicUrl: null, // será preenchido quando admin fizer upload da imagem
          mimeType: "image/png",
          altText: first.title,
          source: "importado",
          baseAssetName: first.baseAssetName || null,
          tags: `${first.platform.toLowerCase()},${first.pillar.toLowerCase().replace(/\s+/g, "-")}`,
        },
      });
    }
    imageToAssetId.set(imageName, asset.id);
  }
  console.log(`   ✅ ${imageToAssetId.size} assets registrados`);

  // 4. Importa as 450 postagens (idempotente via upsert na chave única)
  console.log("\n📝 Importando 450 postagens...");
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const p of posts) {
    try {
      const publishAt = computePublishAt(campaign.startAt ?? new Date(), p.editorialDay, p.time);
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
          // Atualiza apenas campos que podem ter mudado no parse
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
    } catch (err) {
      errors++;
      console.error(
        `   ❌ Erro no post D${p.editorialDay} P${p.sequenceNumber} (${p.platform}):`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  console.log(`\n✅ Importação concluída:`);
  console.log(`   Criados: ${created}`);
  console.log(`   Atualizados: ${updated}`);
  console.log(`   Erros: ${errors}`);

  // 5. Cria canais oficiais se não existirem
  console.log("\n📺 Criando canais oficiais...");
  const channels = [
    {
      name: "Instagram",
      platform: "instagram",
      profileUrl: "https://www.instagram.com/meucorr",
      promoTitle: "MeuCorre no Instagram",
      promoText: "Dicas diárias para entregadores organizarem o corre",
      sortOrder: 1,
    },
    {
      name: "TikTok",
      platform: "tiktok",
      profileUrl: "https://www.tiktok.com/@meucorr",
      promoTitle: "MeuCorre no TikTok",
      promoText: "Vídeos curtos com dicas práticas para o dia a dia",
      sortOrder: 2,
    },
    {
      name: "YouTube",
      platform: "youtube",
      profileUrl: "https://youtube.com/@meucorre-z4j",
      promoTitle: "MeuCorre no YouTube",
      promoText: "Shorts e tutoriais completos sobre finanças do entregador",
      sortOrder: 3,
    },
    {
      name: "Facebook",
      platform: "facebook",
      profileUrl: "https://www.facebook.com/share/1QqGSn22NC/",
      promoTitle: "MeuCorre no Facebook",
      promoText: "Comunidade e discussões sobre o dia a dia do entregador",
      sortOrder: 4,
    },
    {
      name: "Aplicação",
      platform: "app",
      profileUrl: "https://meucorre.vercel.app/",
      promoTitle: "MeuCorre App",
      promoText: "Baixe o app e comece a organizar seu corre hoje",
      sortOrder: 5,
    },
    {
      name: "Quiz",
      platform: "quiz",
      profileUrl: "https://meucorre.vercel.app/quiz",
      promoTitle: "Quiz: Quanto você está perdendo?",
      promoText: "Descubra em 2 minutos quanto dinheiro escapa do seu corre",
      sortOrder: 6,
    },
  ];

  for (const c of channels) {
    const existing = await prisma.socialChannel.findFirst({
      where: { platform: c.platform },
    });
    if (!existing) {
      await prisma.socialChannel.create({ data: c });
      console.log(`   ➕ ${c.name}`);
    } else {
      console.log(`   ♻️  ${c.name} já existe`);
    }
  }

  // 6. Relatório final
  const finalCount = await prisma.promotionPost.count({
    where: { campaignId: campaign.id },
  });
  const assetCount = await prisma.promotionAsset.count();
  const channelCount = await prisma.socialChannel.count();

  console.log("\n" + "=".repeat(60));
  console.log("📊 RELATÓRIO FINAL");
  console.log("=".repeat(60));
  console.log(`Campanha: ${campaign.name} (${campaign.id})`);
  console.log(`Posts no banco: ${finalCount} (esperado: 450)`);
  console.log(`Assets no banco: ${assetCount}`);
  console.log(`Canais no banco: ${channelCount} (esperado: 6)`);
  console.log("=".repeat(60));
}

main()
  .catch((e) => {
    console.error("💥 Erro fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
