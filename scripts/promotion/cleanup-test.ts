// Limpa canais e posts de teste criados
const BASE_URL = "https://meucorre.vercel.app";
const ADMIN_EMAIL = "clodoaldo608@gmail.com";
const ADMIN_PASSWORD = "Silva88677488@#";

async function main() {
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c: string) => c.split(";")[0]).join("; ");

  // Lista canais
  const chanRes = await fetch(`${BASE_URL}/api/admin/promotion/channels`, {
    headers: { Cookie: cookie },
  });
  const chanData = await chanRes.json();
  const testChannels = (chanData.channels || []).filter(
    (c: any) => c.name === "Grupo MeuCorre WhatsApp"
  );
  console.log(`Limpando ${testChannels.length} canais de teste...`);
  for (const c of testChannels) {
    await fetch(`${BASE_URL}/api/admin/promotion/channels/${c.id}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    process.stdout.write(".");
  }
  console.log(" done");

  // Lista posts e deleta os de teste (platform=WhatsApp AND title starts with "Teste Share")
  const postsRes = await fetch(
    `${BASE_URL}/api/admin/promotion/posts?platform=WhatsApp`,
    { headers: { Cookie: cookie } }
  );
  const postsData = await postsRes.json();
  const testPosts = (postsData.posts || []).filter((p: any) =>
    p.title?.startsWith("Teste Share")
  );
  console.log(`Limpando ${testPosts.length} posts de teste...`);
  for (const p of testPosts) {
    await fetch(`${BASE_URL}/api/admin/promotion/posts/${p.id}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    process.stdout.write(".");
  }
  console.log(" done");
}

main().catch(console.error);
