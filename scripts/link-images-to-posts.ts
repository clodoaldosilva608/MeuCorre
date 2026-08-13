// ===== Vincula imagens redimensionadas às 450 postagens =====
//
// Lê os arquivos em public/promotion/ e atualiza PromotionAsset.publicUrl
// para cada imagem, vinculando às postagens pelo nome do arquivo.
//
// Uso: npx tsx scripts/link-images-to-posts.ts

import { PrismaClient } from "@prisma/client";
import * as fs from "node:fs";
import * as path from "node:path";

const prisma = new PrismaClient({ log: ["error"] });
const PROMOTION_DIR = path.resolve(process.cwd(), "public", "promotion");

async function main() {
  console.log("🔗 Vinculando imagens às postagens...\n");

  // Lista todos os arquivos .jpg em public/promotion/
  const files = fs.readdirSync(PROMOTION_DIR).filter((f) => f.endsWith(".jpg"));
  console.log(`📁 ${files.length} imagens encontradas em public/promotion/\n`);

  let linked = 0;
  let created = 0;
  let errors = 0;

  for (const fileName of files) {
    const baseName = fileName.replace(/\.jpg$/, "");
    // Tenta encontrar o nome original (.png) — as postagens usam .png
    // O nome do arquivo no formato: M01_D01_P01_Instagram_vendas_ig_feed_1
    const originalName = baseName + ".png";

    const filePath = path.join(PROMOTION_DIR, fileName);
    const stats = fs.statSync(filePath);
    const publicUrl = `/promotion/${fileName}`;

    try {
      // Verifica se já existe um asset com o nome original (.png)
      let asset = await prisma.promotionAsset.findFirst({
        where: { name: originalName },
      });

      if (asset) {
        // Atualiza o asset existente com a nova URL
        await prisma.promotionAsset.update({
          where: { id: asset.id },
          data: {
            publicUrl,
            storageKey: `promotion/${fileName}`,
            mimeType: "image/jpeg",
            fileSize: stats.size,
          },
        });
        linked++;
      } else {
        // Cria novo asset
        asset = await prisma.promotionAsset.create({
          data: {
            name: originalName,
            storageKey: `promotion/${fileName}`,
            publicUrl,
            mimeType: "image/jpeg",
            fileSize: stats.size,
            source: "upload_admin",
            altText: baseName,
          },
        });
        created++;
      }
    } catch (err) {
      errors++;
      console.error(`❌ ${originalName}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Agora vincula os assets às postagens (PromotionPost.assetId)
  console.log("\n📎 Vinculando assets às postagens...");
  let postsLinked = 0;

  const assets = await prisma.promotionAsset.findMany({
    where: { publicUrl: { not: null } },
  });

  for (const asset of assets) {
    // O nome do asset é M01_D01_P01_Plataforma_base.png
    // Extrai M01_D01_P01_Plataforma para buscar a postagem
    const nameWithoutExt = asset.name.replace(/\.png$/, "");
    // Parse: M01_D01_P01_Instagram_vendas_ig_feed_1
    const match = nameWithoutExt.match(/^(M\d{2}_D\d{2}_P\d{2})_(.+)$/);
    if (!match) continue;

    const [, code, rest] = match;
    // Plataforma é a próxima parte: Instagram, TikTok, Facebook, YouTube
    const platformMatch = rest.match(/^(Instagram|TikTok|Facebook|YouTube)/);
    if (!platformMatch) continue;

    const platform = platformMatch[1];

    // Busca a postagem pelo code + plataforma
    const post = await prisma.promotionPost.findFirst({
      where: {
        // Não temos editorialDay/sequenceNumber direto, mas podemos buscar
        // por matches no título ou usar outra estratégia
      },
    });

    // Atualiza todas as postagens que ainda não têm assetId
    // e cujo nome do asset corresponde
    const result = await prisma.promotionPost.updateMany({
      where: {
        assetId: null,
        OR: [
          { altText: { contains: code, mode: "insensitive" } },
        ],
      },
      data: { assetId: asset.id },
    });

    if (result.count > 0) {
      postsLinked += result.count;
    }
  }

  // Relatório
  const totalAssets = await prisma.promotionAsset.count();
  const assetsWithUrl = await prisma.promotionAsset.count({
    where: { publicUrl: { not: null } },
  });
  const postsWithAsset = await prisma.promotionPost.count({
    where: { assetId: { not: null } },
  });

  console.log("\n" + "=".repeat(60));
  console.log("📊 RELATÓRIO");
  console.log("=".repeat(60));
  console.log(`   ✅ Assets atualizados: ${linked}`);
  console.log(`   ➕ Assets criados:     ${created}`);
  console.log(`   ❌ Erros:              ${errors}`);
  console.log(`   📎 Posts vinculados:   ${postsLinked}`);
  console.log(`\n   📁 Total assets:       ${totalAssets}`);
  console.log(`   🔗 Com URL:            ${assetsWithUrl}`);
  console.log(`   📝 Posts com imagem:   ${postsWithAsset}`);
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
