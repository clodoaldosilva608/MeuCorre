// Testa endpoint publish-blogger
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
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c: string) => c.split(";")[0]).join("; ");

  // Lista posts pra achar um ID
  const listRes = await fetch(`${BASE_URL}/api/admin/blog`, {
    headers: { Cookie: cookie },
  });
  const { posts } = await listRes.json();
  const firstPost = posts[0];
  console.log("Testando publish-blogger com post:", firstPost?.title);

  // Tenta publicar
  const pubRes = await fetch(`${BASE_URL}/api/admin/blog/publish-blogger`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ postId: firstPost.id }),
  });
  const data = await pubRes.json();
  console.log("Status:", pubRes.status);
  console.log("Response:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
