// Busca info dos vídeos via page_reader do z-ai (que já funcionou)
import ZAI from "z-ai-web-dev-sdk";

const VIDEO_IDS = ["AnE-3QNyxC8", "t98X4NSAGEY", "CSZccZXAlXI", "MqfqmR_BS90", "4g3xumie-G8"];

async function main() {
  const zai = await ZAI.create();
  const videos = [];

  for (const videoId of VIDEO_IDS) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`\nBuscando: ${videoId}`);
    try {
      const result = await zai.functions.invoke("page_reader", { url });
      const data = (result as any).data || result;
      const title = (data as any).title || "";
      const html = (data as any).html || "";
      const text = (data as any).text || "";

      // Descrição
      let description = "";
      const descMatch = text.match(/^(.{50,300})$/m);
      if (descMatch) description = descMatch[1].slice(0, 150);

      // Duração (procura por padrão MM:SS no HTML)
      const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
      let duration = "";
      if (durationMatch) {
        const secs = parseInt(durationMatch[1]);
        duration = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
      }

      const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

      videos.push({
        videoId,
        title: title.replace(/ - YouTube$/, "").trim(),
        description,
        thumbnail,
        duration,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      });

      console.log(`✅ ${title}`);
      console.log(`   Duration: ${duration}`);
      console.log(`   Desc: ${description.slice(0, 80)}...`);
    } catch (e: any) {
      console.log(`❌ ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("\n=== RESULTADO FINAL ===");
  console.log(JSON.stringify(videos, null, 2));
}

main().catch(console.error);
