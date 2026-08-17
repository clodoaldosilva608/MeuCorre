const BASE_URL = "https://meucorre.vercel.app";

async function login() {
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "clodoaldo608@gmail.com", password: (process.env.ADMIN_PASSWORD ?? "") }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  return setCookie.map((c: string) => c.split(";")[0]).join("; ");
}

async function main() {
  const cookie = await login();

  const assetsRes = await fetch(`${BASE_URL}/api/admin/promotion/assets?limit=500`, {
    headers: { Cookie: cookie },
  });
  const assetsData = await assetsRes.json();
  const assets = assetsData.assets.filter((a: { publicUrl: string | null }) => a.publicUrl);

  const postsRes = await fetch(`${BASE_URL}/api/admin/promotion/posts?limit=500`, {
    headers: { Cookie: cookie },
  });
  const postsData = await postsRes.json();
  const postsWithoutAsset = postsData.posts.filter((p: { assetId: string | null }) => !p.assetId);
  console.log(`${postsWithoutAsset.length} posts sem asset`);

  // Para cada post sem asset, encontra o asset pelo baseAssetName
  // O post tem pillar (ex: "Lucro real") que corresponde ao baseAssetName
  let linked = 0;
  for (const post of postsWithoutAsset) {
    const month = Math.ceil(post.editorialDay / 30);
    const code = `M${String(month).padStart(2, "0")}_D${String(post.editorialDay).padStart(2, "0")}_P${String(post.sequenceNumber).padStart(2, "0")}_${post.platform}`;
    
    // Tenta casar ignorando case
    let matchingAsset = assets.find((a: { name: string }) => 
      a.name.toLowerCase().startsWith(code.toLowerCase())
    );

    // Se não encontrou, tenta casar apenas pelo dia + plataforma (sem o número da sequência exato)
    if (!matchingAsset) {
      const looseCode = `D${String(post.editorialDay).padStart(2, "0")}_${post.platform}`;
      matchingAsset = assets.find((a: { name: string }) => 
        a.name.toLowerCase().includes(looseCode.toLowerCase())
      );
    }

    if (matchingAsset) {
      const r = await fetch(`${BASE_URL}/api/admin/promotion/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ assetId: matchingAsset.id }),
      });
      if (r.ok) linked++;
    } else {
      console.log(`  ⚠️  D${post.editorialDay} P${post.sequenceNumber} ${post.platform}: nenhum asset encontrado`);
    }
  }
  console.log(`✅ ${linked} posts adicionais vinculados`);

  const checkRes = await fetch(`${BASE_URL}/api/admin/promotion/posts?limit=500`, {
    headers: { Cookie: cookie },
  });
  const checkData = await checkRes.json();
  const withAsset = checkData.posts.filter((p: { assetId: string | null }) => p.assetId).length;
  console.log(`📊 Final: ${withAsset}/${checkData.total} posts com assetId`);
}

main().catch(console.error);
