// Testa o novo fluxo do Blogger
const BASE_URL = "https://meucorre.vercel.app";
const ADMIN_EMAIL = "clodoaldo608@gmail.com";
const ADMIN_PASSWORD = "Silva88677488@#";

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

  console.log("=== 1. Token status (GET /api/admin/blog/blogger-token) ===");
  const statusRes = await fetch(`${BASE_URL}/api/admin/blog/blogger-token`, {
    headers: { Cookie: cookie },
  });
  const status = await statusRes.json();
  console.log(JSON.stringify(status, null, 2));

  console.log("\n=== 2. Lista posts (primeiros 3) ===");
  const listRes = await fetch(`${BASE_URL}/api/admin/blog`, {
    headers: { Cookie: cookie },
  });
  const { posts } = await listRes.json();
  console.log(`Total: ${posts.length}`);
  console.log("Primeiros 3:", posts.slice(0, 3).map((p: any) => ({ slug: p.slug, title: p.title })));

  console.log("\n=== 3. Tenta publicar primeiro post ===");
  const pubRes = await fetch(`${BASE_URL}/api/admin/blog/publish-blogger`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ postId: posts[0].id }),
  });
  const pub = await pubRes.json();
  console.log("Status:", pubRes.status);
  console.log(JSON.stringify(pub, null, 2));
}

main().catch(console.error);
