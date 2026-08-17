// Verificação final: quantos posts estão no Blogger
const BASE_URL = "https://meucorre.vercel.app";
const ADMIN_EMAIL = "clodoaldo608@gmail.com";
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD ?? "");

async function main() {
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c: string) => c.split(";")[0]).join("; ");

  const listRes = await fetch(`${BASE_URL}/api/admin/blog`, {
    headers: { Cookie: cookie },
  });
  const { posts } = await listRes.json();

  const published = posts.filter((p: any) => p.bloggerPostId);
  const unpublished = posts.filter((p: any) => !p.bloggerPostId);

  console.log("=== VERIFICAÇÃO FINAL ===");
  console.log(`📊 Total de posts: ${posts.length}`);
  console.log(`✅ Publicados no Blogger: ${published.length}`);
  console.log(`❌ Pendentes: ${unpublished.length}`);

  if (unpublished.length > 0) {
    console.log("\nPosts pendentes:");
    for (const p of unpublished) {
      console.log(`  - ${p.slug}`);
    }
  }

  // Mostra 5 URLs de exemplo
  console.log("\nExemplos de URLs no Blogger:");
  for (const p of published.slice(0, 5)) {
    console.log(`  - ${p.title}`);
    console.log(`    ${p.bloggerUrl}`);
  }
}

main().catch(console.error);
