// Troca o code OAuth por token e salva no banco
const BASE_URL = "https://meucorre.vercel.app";
const ADMIN_EMAIL = "clodoaldo608@gmail.com";
const ADMIN_PASSWORD = "Silva88677488@#";

// Code que o usuário colou (vem do clipboard)
const OAUTH_CODE = process.argv[2] || "4/0AXEQxIDYxozm87jKgN01Z2G4PFaUCsMEFYYOFgtSlVJqab6aoGE5i2IR7pgn3Vs71hEmoA";

async function main() {
  console.log("=== 1. Login ===");
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login falhou: ${res.status}`);
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c: string) => c.split(";")[0]).join("; ");
  console.log("✅ Login OK");

  console.log("\n=== 2. Trocar code por token ===");
  console.log("Code:", OAUTH_CODE.slice(0, 30) + "...");
  const exchangeRes = await fetch(`${BASE_URL}/api/admin/blog/blogger-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ code: OAUTH_CODE }),
  });
  const exchangeData = await exchangeRes.json();
  console.log("Status:", exchangeRes.status);
  console.log("Response:", JSON.stringify(exchangeData, null, 2));

  if (!exchangeRes.ok) {
    console.log("\n❌ Falha ao trocar code por token");
    return;
  }

  console.log("\n=== 3. Verificar token salvo ===");
  const statusRes = await fetch(`${BASE_URL}/api/admin/blog/blogger-token`, {
    headers: { Cookie: cookie },
  });
  const status = await statusRes.json();
  console.log(JSON.stringify(status, null, 2));

  if (status.hasToken && !status.expired) {
    console.log("\n✅ Token salvo com sucesso! Blogger pronto pra publicar.");
  }
}

main().catch(console.error);
