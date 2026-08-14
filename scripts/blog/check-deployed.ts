// Testa o novo fluxo do Blogger depois do deploy
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

  console.log("=== Token status (depois do deploy) ===");
  const statusRes = await fetch(`${BASE_URL}/api/admin/blog/blogger-token`, {
    headers: { Cookie: cookie },
  });
  const status = await statusRes.json();
  console.log(JSON.stringify(status, null, 2));

  if (status.configured && !status.hasToken && status.authUrl) {
    console.log("\n✅ Credenciais OAuth reconhecidas!");
    console.log("🔗 Link de autorização:");
    console.log(status.authUrl);
  }
}

main().catch(console.error);
