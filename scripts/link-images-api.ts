// Vincula imagens via API (production database)
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

  // Busca todos os assets sem URL
  const assetsRes = await fetch(`${BASE_URL}/api/admin/promotion/assets?limit=500`, {
    headers: { Cookie: cookie },
  });
  const assetsData = await assetsRes.json();
  console.log(`📊 ${assetsData.total} assets no banco, ${assetsData.withoutUrl} sem URL\n`);

  let updated = 0;
  let skipped = 0;

  for (const asset of assetsData.assets) {
    // O nome do asset é M01_D01_P01_Instagram_vendas_ig_feed_1.png
    // A imagem em public/promotion/ é M01_D01_P01_Instagram_vendas_ig_feed_1.jpg
    const baseName = asset.name.replace(/\.png$/, "");
    const jpgUrl = `/promotion/${baseName}.jpg`;

    // Atualiza o asset com a nova URL
    const res = await fetch(`${BASE_URL}/api/admin/promotion/assets/${asset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        publicUrl: jpgUrl,
        storageKey: `promotion/${baseName}.jpg`,
        mimeType: "image/jpeg",
      }),
    });

    if (res.ok) {
      updated++;
      if (updated % 50 === 0) console.log(`   ${updated} atualizados...`);
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ ${updated} assets atualizados, ${skipped} skip`);

  // Verifica resultado
  const checkRes = await fetch(`${BASE_URL}/api/admin/promotion/assets?limit=1`, {
    headers: { Cookie: cookie },
  });
  const checkData = await checkRes.json();
  console.log(`\n📊 Final: ${checkData.withUrl} com URL, ${checkData.withoutUrl} sem URL`);
}

main().catch(console.error);
