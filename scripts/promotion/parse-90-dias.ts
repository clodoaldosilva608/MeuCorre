// ===== Parser do Plano de Divulgação 90 Dias =====
//
// Lê upload/PLANO_DIVULGACAO_90_DIAS_COM_IMAGENS.md e extrai as 450 postagens
// (90 dias × 5 posts/dia) para um JSON intermediário.
//
// Saída: scripts/promotion/posts-450.json
//
// Uso: npx tsx scripts/promotion/parse-90-dias.ts

import * as fs from "node:fs";
import * as path from "node:path";

interface ParsedPost {
  editorialDay: number; // 1-90
  sequenceNumber: number; // 1-5
  month: number; // 1-3 (derivado do dia)
  time: string; // "07:30"
  platform: string; // "Instagram" | "TikTok" | "Facebook" | "YouTube"
  format: string; // "Reels ou carrossel" | "Vídeo curto" | etc.
  pillar: string; // "Lucro real" | "Despesas" | etc.
  title: string;
  description: string;
  hashtags: string;
  engagementText: string;
  imageFileName: string; // "M01_D01_P01_Instagram_vendas_ig_feed_1.png"
  baseAssetName: string; // "vendas_ig_feed_1.png"
}

const SOURCE = path.resolve(
  process.cwd(),
  "upload/PLANO_DIVULGACAO_90_DIAS_COM_IMAGENS.md",
);
const OUTPUT = path.resolve(
  process.cwd(),
  "scripts/promotion/posts-450.json",
);

function parsePostBlock(block: string, editorialDay: number, month: number, pillar: string): ParsedPost | null {
  // #### Postagem N — HH:MM | Plataforma | Formato
  const headerMatch = block.match(
    /^#### Postagem (\d+) — (\d{2}:\d{2}) \| ([A-Za-z]+) \| (.+)$/m,
  );
  if (!headerMatch) return null;

  const [, seqStr, time, platform, format] = headerMatch;
  const sequenceNumber = Number(seqStr);

  const getField = (label: string): string => {
    // **Label:** value (até próxima linha em branco ou próximo **Label:**)
    const re = new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+?)(?=\\n\\*\\*|\\n\\n|$)`, "s");
    const m = block.match(re);
    return m ? m[1].trim() : "";
  };

  const title = getField("Título");
  const description = getField("Descrição");
  const hashtags = getField("Hashtags");
  const engagementText = getField("Texto de engajamento");

  // Imagem: **Imagem a compartilhar junto com esta descrição:** [`path`](path)
  const imageMatch = block.match(
    /\*\*Imagem a compartilhar junto com esta descrição:\*\*\s*\[`([^`]+)`\]/,
  );
  const imageFullPath = imageMatch ? imageMatch[1] : "";
  const imageFileName = imageFullPath.split("/").pop() ?? "";

  // Arquivo-base: **Arquivo-base aprovado:** `path`
  const baseMatch = block.match(/\*\*Arquivo-base aprovado:\*\*\s*`([^`]+)`/);
  const baseFullPath = baseMatch ? baseMatch[1] : "";
  const baseAssetName = baseFullPath.split("/").pop() ?? "";

  if (!title || !description) {
    console.warn(`⚠️  Post M??_D${String(editorialDay).padStart(2, "0")}_P${sequenceNumber} sem título ou descrição`);
    return null;
  }

  return {
    editorialDay,
    sequenceNumber,
    month,
    time,
    platform,
    format: format.trim(),
    pillar,
    title,
    description,
    hashtags,
    engagementText,
    imageFileName,
    baseAssetName,
  };
}

function parseDayBlock(block: string): { day: number; month: number; pillar: string } | null {
  // ### Dia NN (Mês N, Dia NN) — Pilar: ...
  const m = block.match(/^### Dia (\d+) \(Mês (\d+), Dia \d+\) — Pilar: (.+)$/m);
  if (!m) return null;
  return { day: Number(m[1]), month: Number(m[2]), pillar: m[3].trim() };
}

function main() {
  console.log("📖 Lendo:", SOURCE);
  const md = fs.readFileSync(SOURCE, "utf8");

  // Quebra por "### Dia " preservando o delimitador
  const dayChunks = md.split(/^### Dia /m).filter((c) => /\d+ \(Mês \d+/.test(c));
  console.log(`📅 Encontrados ${dayChunks.length} dias (esperado: 90)`);

  const posts: ParsedPost[] = [];

  for (const chunk of dayChunks) {
    const fullChunk = "### Dia " + chunk;
    const dayInfo = parseDayBlock(fullChunk);
    if (!dayInfo) {
      console.warn("⚠️  Dia não reconhecido no chunk");
      continue;
    }
    const { day, month, pillar } = dayInfo;

    // Quebra por "#### Postagem " preservando o delimitador
    const postChunks = fullChunk
      .split(/^#### Postagem /m)
      .filter((c) => /^\d+ — \d{2}:\d{2}/.test(c));

    if (postChunks.length !== 5) {
      console.warn(`⚠️  Dia ${day} tem ${postChunks.length} postagens (esperado: 5)`);
    }

    for (const pChunk of postChunks) {
      const post = parsePostBlock(
        "#### Postagem " + pChunk,
        day,
        month,
        pillar,
      );
      if (post) posts.push(post);
    }
  }

  console.log(`\n✅ Total de postagens parseadas: ${posts.length} (esperado: 450)`);

  // Estatísticas
  const byPlatform: Record<string, number> = {};
  const byMonth: Record<number, number> = {};
  const byPillar: Record<string, number> = {};
  for (const p of posts) {
    byPlatform[p.platform] = (byPlatform[p.platform] ?? 0) + 1;
    byMonth[p.month] = (byMonth[p.month] ?? 0) + 1;
    byPillar[p.pillar] = (byPillar[p.pillar] ?? 0) + 1;
  }
  console.log("\n📊 Por plataforma:", byPlatform);
  console.log("📊 Por mês:", byMonth);
  console.log(`📊 ${Object.keys(byPillar).length} pilares diferentes`);

  // Verifica sequência completa
  for (let day = 1; day <= 90; day++) {
    const dayPosts = posts.filter((p) => p.editorialDay === day);
    if (dayPosts.length !== 5) {
      console.warn(`⚠️  Dia ${day} tem ${dayPosts.length} posts`);
    } else {
      for (let seq = 1; seq <= 5; seq++) {
        if (!dayPosts.find((p) => p.sequenceNumber === seq)) {
          console.warn(`⚠️  Dia ${day} sequência ${seq} ausente`);
        }
      }
    }
  }

  // Verifica duplicação de nomes de imagem
  const imageNames = posts.map((p) => p.imageFileName);
  const uniqueImages = new Set(imageNames);
  if (imageNames.length !== uniqueImages.size) {
    console.warn(
      `⚠️  ${imageNames.length - uniqueImages.size} nomes de imagem duplicados (esperado se mesmo asset base for reutilizado)`,
    );
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(posts, null, 2), "utf8");
  console.log(`\n💾 Salvo em: ${OUTPUT}`);
  console.log(`   Tamanho: ${(fs.statSync(OUTPUT).size / 1024).toFixed(1)} KB`);
}

main();
