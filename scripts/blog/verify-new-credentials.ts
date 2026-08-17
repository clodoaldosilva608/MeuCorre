// Testa as novas credenciais OAuth do Google
const CLIENT_ID = process.env.BLOGGER_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.BLOGGER_CLIENT_SECRET ?? "";
const REDIRECT_URI = "https://meucorre.vercel.app/api/blogger-callback";

async function main() {
  console.log("=== Testando novas credenciais ===\n");

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
    console.log("   Pode atualizar na Vercel.");
  } else if (d.error === "invalid_client") {
    console.log("\n❌ CLIENT_ID ou CLIENT_SECRET ainda estão errados.");
  } else {
    console.log("\n⚠️ Resposta inesperada:", d.error);
  }
}

main().catch(console.error);
