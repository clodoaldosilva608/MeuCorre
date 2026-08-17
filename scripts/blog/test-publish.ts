// Testa a publicação no Blogger
const BASE_URL = "https://meucorre.vercel.app";
const ADMIN_EMAIL = "clodoaldo608@gmail.com";
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD ?? "");

async function main() {
  // Login
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login falhou: ${res.status}`);
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c: string) => c.split(";")[0]).join("; ");

  // Lista posts pra achar um ID
  console.log("=== Listando posts ===");
  const listRes = await fetch(`${BASE_URL}/api/admin/blog`, {
    headers: { Cookie: cookie },
  });
  const { posts } = await listRes.json();
  console.log(`Total: ${posts.length} posts`);

  // Pega o primeiro post que ainda NÃO foi publicado no Blogger
  const unpublishedPost = posts.find((p: any) => !p.bloggerPostId) || posts[0];
  console.log(`\nTestando publish no post: "${unpublishedPost.title}"`);
  console.log(`ID: ${unpublishedPost.id}`);
  console.log(`Já publicado no Blogger: ${unpublishedPost.bloggerPostId ? "SIM" : "NÃO"}`);

  console.log("\n=== Publicando no Blogger ===");
  const pubRes = await fetch(`${BASE_URL}/api/admin/blog/publish-blogger`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ postId: unpublishedPost.id }),
  });
  const pub = await pubRes.json();
  console.log("Status:", pubRes.status);
  console.log("Response:", JSON.stringify(pub, null, 2));

  if (pubRes.ok && pub.bloggerUrl) {
    console.log("\n🎉 PUBLICADO COM SUCESSO!");
    console.log("URL no Blogger:", pub.bloggerUrl);
  } else if (pub.needsAuth) {
    console.log("\n⚠️ Token expirado ou inválido");
  } else {
    console.log("\n❌ Falha ao publicar");
  }
}

main().catch(console.error);
