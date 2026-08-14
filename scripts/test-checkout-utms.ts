// Testa se UTMs e referral code são propagados no checkout Kiwify
const BASE_URL = "https://meucorre.vercel.app";

async function main() {
  console.log("=== Teste de propagação de UTMs no checkout Kiwify ===\n");

  // Simula o que o handleSubmit faria com UTMs na URL
  const slug = "bknZCSZ"; // slug padrão (pode estar vazio se env não configurada)
  const utmParams = {
    utm_source: "instagram",
    utm_medium: "social",
    utm_campaign: "lancamento_pro",
  };
  const referralCode = "MEUCORRE-ABC123";

  // Constrói a URL como buildKiwifyCheckoutUrl faria
  const queryParams = new URLSearchParams({
    email: "teste@example.com",
    name: "Teste Usuario",
    plan: "lifetime",
    phone: "5581987654321",
    utm_source: utmParams.utm_source,
    utm_medium: utmParams.utm_medium,
    utm_campaign: utmParams.utm_campaign,
    sck: referralCode, // referral code via campo sck do Kiwify
  });

  const checkoutUrl = `https://pay.kiwify.com.br/${slug}?${queryParams.toString()}`;

  console.log("URL de checkout gerada:");
  console.log(checkoutUrl);
  console.log("\nParâmetros propagados:");
  console.log("  email:", queryParams.get("email"));
  console.log("  name:", queryParams.get("name"));
  console.log("  plan:", queryParams.get("plan"));
  console.log("  phone:", queryParams.get("phone"));
  console.log("  utm_source:", queryParams.get("utm_source"));
  console.log("  utm_medium:", queryParams.get("utm_medium"));
  console.log("  utm_campaign:", queryParams.get("utm_campaign"));
  console.log("  sck (referral):", queryParams.get("sck"));

  // Verifica se a URL do Kiwify responde (não completa compra)
  console.log("\n=== Verificando se URL do Kiwify responde ===");
  try {
    const res = await fetch(checkoutUrl, { method: "HEAD", redirect: "manual" });
    console.log("HTTP:", res.status);
    console.log("Location:", res.headers.get("location") || "(sem redirect)");
    if (res.status === 200 || res.status === 301 || res.status === 302) {
      console.log("✅ URL do Kiwify acessível");
    } else {
      console.log("⚠️ URL respondeu com status:", res.status);
    }
  } catch (e) {
    console.log("⚠️ Não foi possível verificar (pode ser redirect):", e.message);
  }

  // Verifica preço R$ 18,90 na landing
  console.log("\n=== Verificando preço R$ 18,90 na landing ===");
  const landingRes = await fetch(BASE_URL);
  const landingHtml = await landingRes.text();
  const hasPrice = landingHtml.includes("18,90") || landingHtml.includes("18.90");
  console.log("Preço R$ 18,90 visível na landing:", hasPrice ? "✅ SIM" : "❌ NÃO");
}

main().catch(console.error);
