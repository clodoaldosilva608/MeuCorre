// Extrai info do Supabase da DATABASE_URL
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

  const infoRes = await fetch(`${BASE_URL}/api/admin/supabase-info`, {
    headers: { Cookie: cookie },
  });
  const info = await infoRes.json();
  console.log(JSON.stringify(info, null, 2));
}

main().catch(console.error);
