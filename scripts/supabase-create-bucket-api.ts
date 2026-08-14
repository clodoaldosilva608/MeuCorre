// Cria o bucket promotion-assets no Supabase via API
const BASE_URL = "https://meucorre.vercel.app";
const ADMIN_EMAIL = "clodoaldo608@gmail.com";
const ADMIN_PASSWORD = "Silva88677488@#";

async function main() {
  console.log("=== Login ===");
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login falhou: ${res.status}`);
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c: string) => c.split(";")[0]).join("; ");
  console.log("✅ Login OK");

  // 1. Verifica status atual
  console.log("\n=== 1. Status atual do bucket ===");
  const statusRes = await fetch(`${BASE_URL}/api/admin/supabase-bucket`, {
    headers: { Cookie: cookie },
  });
  const status = await statusRes.json();
  console.log(JSON.stringify(status, null, 2));

  // 2. Cria bucket
  console.log("\n=== 2. Criando bucket ===");
  const createRes = await fetch(`${BASE_URL}/api/admin/supabase-bucket`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  const createData = await createRes.json();
  console.log("Status:", createRes.status);
  console.log(JSON.stringify(createData, null, 2));

  // 3. Verifica status final
  console.log("\n=== 3. Status final ===");
  const finalRes = await fetch(`${BASE_URL}/api/admin/supabase-bucket`, {
    headers: { Cookie: cookie },
  });
  const finalData = await finalRes.json();
  console.log(JSON.stringify(finalData, null, 2));
}

main().catch(console.error);
