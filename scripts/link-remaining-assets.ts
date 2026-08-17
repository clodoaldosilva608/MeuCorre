// Link remaining 46 assets to their .jpg files
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

  // Busca todos os assets sem URL
  const res = await fetch(`${BASE_URL}/api/admin/promotion/assets?limit=500`, {
    headers: { Cookie: cookie },
  });
  const data = await res.json();
  const withoutUrl = data.assets.filter((a: { publicUrl: string | null }) => !a.publicUrl);
  console.log(`${withoutUrl.length} assets sem URL. Vinculando...`);

  let updated = 0;
  // Process in parallel batches of 10
  for (let i = 0; i < withoutUrl.length; i += 10) {
    const batch = withoutUrl.slice(i, i + 10);
    const promises = batch.map(async (asset: { id: string; name: string }) => {
      const baseName = asset.name.replace(/\.png$/, "");
      const jpgUrl = `/promotion/${baseName}.jpg`;
      const r = await fetch(`${BASE_URL}/api/admin/promotion/assets/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({
          publicUrl: jpgUrl,
          storageKey: `promotion/${baseName}.jpg`,
          mimeType: "image/jpeg",
        }),
      });
      return r.ok;
    });
    const results = await Promise.all(promises);
    updated += results.filter(Boolean).length;
  }
  console.log(`✅ ${updated} assets vinculados!`);

  // Verifica resultado
  const check = await fetch(`${BASE_URL}/api/admin/promotion/assets?limit=1`, {
    headers: { Cookie: cookie },
  });
  const checkData = await check.json();
  console.log(`Final: ${checkData.withUrl} com URL, ${checkData.withoutUrl} sem URL, ${checkData.total} total`);
}

main().catch(console.error);
