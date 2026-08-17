// Testa se o CLIENT_SECRET está correto usando o token endpoint
const CLIENT_ID = process.env.BLOGGER_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.BLOGGER_CLIENT_SECRET ?? "";
const REDIRECT_URI = "https://meucorre.vercel.app/api/blogger-callback";

async function main() {
  console.log("=== Testando CLIENT_SECRET com código fake ===");
  console.log("Se retornar 'invalid_grant' → CLIENT_ID + SECRET estão OK");
  console.log("Se retornar 'invalid_client' → SECRET está errado\n");

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: "4/fake_code_for_testing_purposes_only",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const d = await r.json();
  console.log("Status:", r.status);
  console.log("Response:", JSON.stringify(d, null, 2));

  if (d.error === "invalid_grant") {
    console.log("\n✅ CLIENT_ID + CLIENT_SECRET estão corretos!");
    console.log("   O erro que você viu foi problema de sessão ou consent screen.");
  } else if (d.error === "invalid_client") {
    console.log("\n❌ CLIENT_SECRET está errado. Precisa recriar.");
  }
}

main().catch(console.error);
