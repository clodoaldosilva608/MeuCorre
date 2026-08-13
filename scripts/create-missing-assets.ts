import * as fs from "node:fs";
import * as path from "node:path";

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

  // Lista todos os arquivos .jpg em public/promotion/
  const dir = path.resolve(process.cwd(), "public/promotion");
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".jpg"));
  console.log(`${files.length} arquivos .jpg em public/promotion/`);

  // Busca todos os assets existentes
  const assetsRes = await fetch(`${BASE_URL}/api/admin/promotion/assets?limit=500`, {
    headers: { Cookie: cookie },
  });
  const assetsData = await assetsRes.json();
  const existingNames = new Set(assetsData.assets.map((a: { name: string }) => a.name));
  console.log(`${existingNames.size} assets no banco`);

  // Encontra arquivos sem asset correspondente
  const missing = files.filter(f => {
    // O nome do arquivo é .jpg, mas o asset usa .png
    const pngName = f.replace(/\.jpg$/, ".png");
    return !existingNames.has(pngName) && !existingNames.has(f);
  });
  console.log(`${missing.length} arquivos sem asset no banco`);

  // Cria assets para os arquivos faltantes
  let created = 0;
  for (const fileName of missing) {
    const pngName = fileName.replace(/\.jpg$/, ".png");
    const filePath = path.join(dir, fileName);
    const stats = fs.statSync(filePath);
    const publicUrl = `/promotion/${fileName}`;

    const res = await fetch(`${BASE_URL}/api/admin/promotion/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        name: pngName,
        storageKey: `promotion/${fileName}`,
        publicUrl,
        mimeType: "image/jpeg",
        fileSize: stats.size,
        source: "upload_admin",
        altText: pngName.replace(/\.png$/, ""),
      }),
    });

    if (res.ok) {
      created++;
      process.stdout.write(`\r${created}/${missing.length} criados`);
    } else {
      const err = await res.json().catch(() => ({}));
      console.error(`\n❌ ${fileName}: ${err.error}`);
    }
  }

  console.log(`\n✅ ${created} assets criados`);

  // Agora vincula aos posts
  console.log("\n📎 Vinculando aos posts...");
  const assetsRes2 = await fetch(`${BASE_URL}/api/admin/promotion/assets?limit=500`, {
    headers: { Cookie: cookie },
  });
  const assetsData2 = await assetsRes2.json();
  const allAssets = assetsData2.assets.filter((a: { publicUrl: string | null }) => a.publicUrl);

  const postsRes = await fetch(`${BASE_URL}/api/admin/promotion/posts?limit=500`, {
    headers: { Cookie: cookie },
  });
  const postsData = await postsRes.json();
  const postsWithoutAsset = postsData.posts.filter((p: { assetId: string | null }) => !p.assetId);
  console.log(`${postsWithoutAsset.length} posts sem asset`);

  let linked = 0;
  for (const post of postsWithoutAsset) {
    const month = Math.ceil(post.editorialDay / 30);
    const code = `M${String(month).padStart(2, "0")}_D${String(post.editorialDay).padStart(2, "0")}_P${String(post.sequenceNumber).padStart(2, "0")}_${post.platform}`;
    const matchingAsset = allAssets.find((a: { name: string }) =>
      a.name.toLowerCase().startsWith(code.toLowerCase())
    );
    if (matchingAsset) {
      const r = await fetch(`${BASE_URL}/api/admin/promotion/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ assetId: matchingAsset.id }),
      });
      if (r.ok) linked++;
    }
  }

  console.log(`✅ ${linked} posts vinculados`);

  const checkRes = await fetch(`${BASE_URL}/api/admin/promotion/posts?limit=500`, {
    headers: { Cookie: cookie },
  });
  const checkData = await checkRes.json();
  const withAsset = checkData.posts.filter((p: { assetId: string | null }) => p.assetId).length;
  console.log(`\n📊 FINAL: ${withAsset}/${checkData.total} posts com assetId`);
}

main().catch(console.error);
