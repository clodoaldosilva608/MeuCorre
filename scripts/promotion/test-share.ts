// Verifica feature flag e testa share endpoints
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
  console.log("✅ Login OK");

  // Verifica feature flag
  console.log("\n=== Feature flags ===");
  const flagsRes = await fetch(`${BASE_URL}/api/admin/feature-flags`, {
    headers: { Cookie: cookie },
  });
  const flagsData = await flagsRes.json();
  console.log("Flags response:", JSON.stringify(flagsData).slice(0, 200));
  const flags = flagsData.flags || flagsData;
  const flagsArr = Array.isArray(flags) ? flags : Object.entries(flags).map(([k, v]) => ({ key: k, value: v }));
  const marketingFlag = flagsArr.find(
    (f: any) => f.key === "admin_marketing_hub_enabled"
  );
  console.log(
    "admin_marketing_hub_enabled:",
    marketingFlag ? marketingFlag.value : "NÃO ENCONTRADA"
  );

  // Lista canais pra ver se aceita WhatsApp/Telegram
  console.log("\n=== Canais ===");
  const chanRes = await fetch(`${BASE_URL}/api/admin/promotion/channels`, {
    headers: { Cookie: cookie },
  });
  const chanData = await chanRes.json();
  console.log(`Total: ${chanData.channels?.length || 0}`);
  if (chanData.channels?.length > 0) {
    console.log("Plataformas:");
    chanData.channels.forEach((c: any) => {
      console.log(`  - ${c.name} (${c.platform})`);
    });
  }

  // Testa criar um canal WhatsApp (deve funcionar agora)
  console.log("\n=== Testando criar canal WhatsApp ===");
  const testRes = await fetch(`${BASE_URL}/api/admin/promotion/channels`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      name: "Grupo MeuCorre WhatsApp",
      platform: "whatsapp",
      profileUrl: "https://wa.me/5581987654321",
      promoTitle: "Grupo dos Entregadores",
      promoText: "Dicas e suporte no WhatsApp",
      active: true,
      sortOrder: 99,
    }),
  });
  const testData = await testRes.json();
  if (testRes.ok) {
    console.log("✅ Canal WhatsApp criado! ID:", testData.channel?.id);
  } else {
    console.log("❌ Erro:", testData.error);
  }

  // Testa criar um post com platform=WhatsApp
  console.log("\n=== Testando criar post WhatsApp ===");
  // Primeiro precisa de uma campanha
  const campsRes = await fetch(`${BASE_URL}/api/admin/promotion/campaigns`, {
    headers: { Cookie: cookie },
  });
  const campsData = await campsRes.json();
  const firstCampaign = campsData.campaigns?.[0];
  if (firstCampaign) {
    const postRes = await fetch(`${BASE_URL}/api/admin/promotion/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        campaignId: firstCampaign.id,
        editorialDay: 90,
        sequenceNumber: 5,
        platform: "WhatsApp",
        title: "Teste Share WhatsApp",
        description: "Post de teste pra validar share no WhatsApp",
        hashtags: "#meucorre #entregador #teste",
        cta: "Baixe grátis: meucorre.vercel.app",
        destinationUrl: "https://meucorre.vercel.app",
      }),
    });
    const postData = await postRes.json();
    if (postRes.ok) {
      console.log("✅ Post WhatsApp criado! ID:", postData.post?.id);
      console.log("   Platform aceita:", postData.post?.platform);
    } else {
      console.log("❌ Erro:", postData.error);
    }
  } else {
    console.log("⚠️ Sem campanhas pra testar");
  }
}

main().catch(console.error);
