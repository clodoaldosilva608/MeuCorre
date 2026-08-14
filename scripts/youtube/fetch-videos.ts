// Busca títulos e thumbnails dos vídeos do canal MeuCorre-z4j
const VIDEO_IDS = ["AnE-3QNyxC8", "t98X4NSAGEY", "CSZccZXAlXI", "MqfqmR_BS90", "4g3xumie-G8"];

async function fetchVideoInfo(videoId: string) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`Buscando: ${url}`);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });

    if (!res.ok) {
      console.log(`  ❌ HTTP ${res.status}`);
      return null;
    }

    const html = await res.text();

    // Extrai o título
    const titleMatch =
      html.match(/<title>([^<]+)<\/title>/) ||
      html.match(/"title":\{"runs":\[\{"text":"([^"]+)"/) ||
      html.match(/<meta name="title" content="([^"]+)"/);

    // Extrai a descrição curta
    const descMatch =
      html.match(/<meta name="description" content="([^"]+)"/) ||
      html.match(/"shortDescription":"([^"]+)"/);

    // Extrai a thumbnail
    const thumbMatch =
      html.match(/"thumbnail":\{"thumbnails":\[\{"url":"([^"]+)"/) ||
      html.match(/<link rel="thumbnail" href="([^"]+)"/) ||
      html.match(/<meta property="og:image" content="([^"]+)"/);

    // Extrai duração
    const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);

    const title = titleMatch ? titleMatch[1].replace(/ - YouTube$/, "").trim() : "Sem título";
    const description = descMatch ? descMatch[1].slice(0, 150) : "";
    const thumbnail = thumbMatch
      ? thumbMatch[1].replace(/\\u0026/g, "&")
      : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    const duration = durationMatch
      ? `${Math.floor(parseInt(durationMatch[1]) / 60)}:${String(parseInt(durationMatch[1]) % 60).padStart(2, "0")}`
      : "";

    return { videoId, title, description, thumbnail, duration };
  } catch (e: any) {
    console.log(`  ❌ ${e.message}`);
    return null;
  }
}

async function main() {
  console.log("=== Buscando vídeos do canal MeuCorre-z4j ===\n");

  const videos = [];
  for (const id of VIDEO_IDS) {
    const info = await fetchVideoInfo(id);
    if (info) {
      videos.push(info);
      console.log(`✅ ${info.videoId}`);
      console.log(`   Título: ${info.title}`);
      console.log(`   Duração: ${info.duration}`);
      console.log(`   Thumbnail: ${info.thumbnail}`);
      console.log(`   Descrição: ${info.description.slice(0, 80)}...`);
      console.log();
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("\n=== RESULTADO FINAL ===");
  console.log(JSON.stringify(videos, null, 2));
}

main().catch(console.error);
