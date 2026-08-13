// Testa se o client ID está acessível no Google
const CLIENT_ID = "402530830806-s5vo56507sm0tjqmv8s8bqidvfjbgb55.apps.googleusercontent.com";
const REDIRECT_URI = "https://meucorre.vercel.app/api/blogger-callback";

async function main() {
  // Test 1: OpenID configuration (deve funcionar se o client existe)
  console.log("=== Test 1: Google OpenID config ===");
  try {
    const r1 = await fetch(
      `https://accounts.google.com/.well-known/openid-configuration`
    );
    const d1 = await r1.json();
    console.log("Status:", r1.status, "| issuer:", d1.issuer);
  } catch (e) {
    console.log("Error:", e);
  }

  // Test 2: Token endpoint (vai falhar com invalid_client se o client não existir)
  console.log("\n=== Test 2: Try to get token with invalid code ===");
  try {
    const r2 = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: "fake_code_for_testing",
        client_id: CLIENT_ID,
        client_secret: "fake_secret",
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    const d2 = await r2.json();
    console.log("Status:", r2.status);
    console.log("Response:", JSON.stringify(d2, null, 2));
    if (d2.error === "invalid_client") {
      console.log("\n❌ CONFIRMADO: Google não reconhece esse CLIENT_ID");
      console.log("   O OAuth client precisa ser recriado no Google Cloud Console");
    } else if (d2.error === "invalid_grant") {
      console.log("\n✅ CLIENT_ID é válido! (erro é só do código fake)");
    }
  } catch (e) {
    console.log("Error:", e);
  }

  // Test 3: Direct OAuth auth endpoint (sem seguir redirect)
  console.log("\n=== Test 3: OAuth auth endpoint ===");
  try {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fblogger&prompt=consent&response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    const r3 = await fetch(authUrl, { redirect: "manual" });
    console.log("Status:", r3.status);
    console.log("Location:", r3.headers.get("location"));
  } catch (e) {
    console.log("Error:", e);
  }
}

main().catch(console.error);
