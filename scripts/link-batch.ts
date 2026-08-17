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
  console.log(`${withoutUrl.length} assets sem URL`);

  // Atualiza em paralelo (5 por vez)
  const batchSize = 5;
  let updated = 0;

  for (let i = 0; i < withoutUrl.length; i += batchSize) {
    const batch = withoutUrl.slice(i, i + batchSize);
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
    process.stdout.write(`\r${updated}/${withoutUrl.length} atualizados`);
  }

  console.log(`\n✅ Concluído: ${updated} assets atualizados`);
}

main().catch(console.error);
