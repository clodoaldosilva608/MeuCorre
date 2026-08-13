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

  // Busca todos os assets com URL
  const assetsRes = await fetch(`${BASE_URL}/api/admin/promotion/assets?limit=500`, {
    headers: { Cookie: cookie },
  });
  const assetsData = await assetsRes.json();
  const assets = assetsData.assets.filter((a: { publicUrl: string | null }) => a.publicUrl);
  console.log(`📊 ${assets.length} assets com URL`);

  // Busca todos os posts sem assetId
  const postsRes = await fetch(`${BASE_URL}/api/admin/promotion/posts?limit=500`, {
    headers: { Cookie: cookie },
  });
  const postsData = await postsRes.json();
  const postsWithoutAsset = postsData.posts.filter((p: { assetId: string | null }) => !p.assetId);
  console.log(`📊 ${postsWithoutAsset.length} posts sem assetId (de ${postsData.total} total)`);

  let linked = 0;
  const batchSize = 10;

  for (let i = 0; i < postsWithoutAsset.length; i += batchSize) {
    const batch = postsWithoutAsset.slice(i, i + batchSize);
    const promises = batch.map(async (post: { id: string; editorialDay: number; sequenceNumber: number; platform: string }) => {
      const month = Math.ceil(post.editorialDay / 30);
      const code = `M${String(month).padStart(2, "0")}_D${String(post.editorialDay).padStart(2, "0")}_P${post.sequenceNumber}_${post.platform}`;

      // Encontra asset pelo nome que começa com o code
      const matchingAsset = assets.find((a: { name: string }) => a.name.startsWith(code));
      if (matchingAsset) {
        const r = await fetch(`${BASE_URL}/api/admin/promotion/posts/${post.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: JSON.stringify({ assetId: matchingAsset.id }),
        });
        return r.ok;
      }
      return false;
    });

    const results = await Promise.all(promises);
    linked += results.filter(Boolean).length;
  }

  console.log(`✅ ${linked} posts vinculados a assets`);

  // Verifica resultado
  const checkRes = await fetch(`${BASE_URL}/api/admin/promotion/posts?limit=500`, {
    headers: { Cookie: cookie },
  });
  const checkData = await checkRes.json();
  const withAsset = checkData.posts.filter((p: { assetId: string | null }) => p.assetId).length;
  console.log(`📊 Final: ${withAsset}/${checkData.total} posts com assetId`);
}

main().catch(console.error);
