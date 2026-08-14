// Testa os 3 checkouts da Kiwify (mensal, anual, vitalício)
const BASE_URL = "https://meucorre.vercel.app";

const PLANS = [
  { plan: "monthly", slug: "TfP70tb", price: "R$ 14,90/mês", url: "https://pay.kiwify.com.br/TfP70tb" },
  { plan: "annual", slug: "H5FQHa4", price: "R$ 97,00/ano", url: "https://pay.kiwify.com.br/H5FQHa4" },
  { plan: "lifetime", slug: "bknZCSZ", price: "R$ 18,90 (vitalício)", url: "https://pay.kiwify.com.br/bknZCSZ" },
];

async function main() {
  console.log("=== Teste dos 3 Checkouts Kiwify ===\n");

  for (const p of PLANS) {
    console.log(`--- ${p.plan.toUpperCase()} ---`);
    console.log(`Slug: ${p.slug}`);
    console.log(`Preço: ${p.price}`);
    console.log(`URL: ${p.url}`);

    // Verifica se a URL responde
    try {
      const res = await fetch(p.url, { method: "HEAD", redirect: "manual" });
      console.log(`HTTP: ${res.status} ${res.ok ? "✅" : "⚠️"}`);
    } catch (e) {
      console.log(`HTTP: erro (${e.message})`);
    }
    console.log();
  }

  // Verifica se a landing page tem os preços corretos
  console.log("=== Verificando preços na landing ===");
  const landingRes = await fetch(BASE_URL);
  const html = await landingRes.text();
  console.log("R$ 14,90 (mensal):", html.includes("14,90") || html.includes("14.90") ? "✅" : "❌");
  console.log("R$ 97,00 (anual):", html.includes("97,00") || html.includes("97.00") || html.includes("R$ 97") ? "✅" : "❌");
  console.log("R$ 18,90 (vitalício):", html.includes("18,90") || html.includes("18.90") ? "✅" : "❌");

  // Verifica email de suporte
  console.log("\n=== Verificando email de suporte ===");
  console.log("suportemeucorre@gmail.com na página de contato:", html.includes("suportemeucorre") ? "✅" : "❌ (não na landing)");
  
  const contatoRes = await fetch(`${BASE_URL}/contato`);
  const contatoHtml = await contatoRes.text();
  console.log("suportemeucorre@gmail.com na /contato:", contatoHtml.includes("suportemeucorre") ? "✅" : "❌");
}

main().catch(console.error);
