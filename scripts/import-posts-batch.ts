import * as fs from "node:fs";

const BASE_URL = "https://meucorre.vercel.app";

async function login() {
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "clodoaldo608@gmail.com", password: "Silva88677488@#" }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  return setCookie.map((c: string) => c.split(";")[0]).join("; ");
}

async function main() {
  const cookie = await login();
  console.log("✅ Login OK\n");

  // Lê o JSON das 450 postagens
  const posts = JSON.parse(fs.readFileSync("scripts/promotion/posts-450.json", "utf8"));
  console.log(`📊 ${posts.length} postagens para importar\n`);

  // Cria a campanha primeiro
  const campRes = await fetch(`${BASE_URL}/api/admin/promotion/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      name: "Plano 90 Dias MeuCorre",
      description: "Calendário editorial 90 dias",
      status: "active",
      startAt: new Date().toISOString(),
    }),
  });
  const campData = await campRes.json();
  const campaignId = campData.campaign?.id;
  console.log(`📝 Campanha: ${campaignId}\n`);

  if (!campaignId) {
    console.error("❌ Não foi possível criar campanha");
    return;
  }

  // Importa em lotes de 10 (via POST direto)
  let created = 0;
  let errors = 0;
  const batchSize = 10;

  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    const promises = batch.map(async (p: any) => {
      const [hh, mm] = p.time.split(":").map(Number);
      const publishAt = new Date();
      publishAt.setUTCHours(hh + 3, mm, 0, 0);

      const body = {
        campaignId,
        editorialDay: p.editorialDay,
        sequenceNumber: p.sequenceNumber,
        publishAt: publishAt.toISOString(),
        platform: p.platform,
        format: p.format,
        pillar: p.pillar,
        title: p.title,
        description: p.description,
        hashtags: p.hashtags,
        engagementText: p.engagementText,
        cta: "Baixe o app e faça seu primeiro teste",
        destinationUrl: "https://meucorre.vercel.app/",
        altText: p.title,
        status: "pending",
        utmQuery: "utm_source=organico&utm_medium=social&utm_campaign=plano90dias",
      };

      const res = await fetch(`${BASE_URL}/api/admin/promotion/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify(body),
      });
      return res.ok;
    });

    const results = await Promise.all(promises);
    created += results.filter(Boolean).length;
    errors += results.filter(Boolean).length === 0 ? batchSize : (batchSize - results.filter(Boolean).length);

    process.stdout.write(`\r${created}/${posts.length} criadas`);
  }

  console.log(`\n\n✅ ${created} postagens criadas, ${errors} erros`);

  // Agora vincula os assets às postagens
  console.log("\n📎 Vinculando assets...");
  const assetsRes = await fetch(`${BASE_URL}/api/admin/promotion/assets?limit=500`, {
    headers: { Cookie: cookie },
  });
  const assetsData = await assetsRes.json();

  // Busca todos os posts
  const postsRes = await fetch(`${BASE_URL}/api/admin/promotion/posts?limit=500`, {
    headers: { Cookie: cookie },
  });
  const postsData = await postsRes.json();

  let linked = 0;
  for (const asset of assetsData.assets) {
    if (!asset.publicUrl) continue;
    const baseName = asset.name.replace(/\.png$/, "");

    // Encontra o post correspondente
    const matchingPost = postsData.posts.find((p: any) => {
      const postBaseName = `M${String(Math.ceil(p.editorialDay / 30)).padStart(2, "0")}_D${String(p.editorialDay).padStart(2, "0")}_P${p.sequenceNumber}_${p.platform}`;
      return baseName.startsWith(postBaseName);
    });

    if (matchingPost && !matchingPost.assetId) {
      await fetch(`${BASE_URL}/api/admin/promotion/posts/${matchingPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ assetId: asset.id }),
      });
      linked++;
    }
  }

  console.log(`✅ ${linked} posts vinculados a assets`);
}

main().catch(console.error);
