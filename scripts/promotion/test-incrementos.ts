// Testa os 3 incrementos da Fase 2
const BASE_URL = "https://meucorre.vercel.app";
const ADMIN_EMAIL = "clodoaldo608@gmail.com";
const ADMIN_PASSWORD = "Silva88677488@#";

async function main() {
  // Login
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

  // 1. Cria um grupo de teste (WhatsApp)
  console.log("\n=== 1. Criando grupo de teste ===");
  const grpRes = await fetch(`${BASE_URL}/api/admin/promotion/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      name: "Teste Fase 2 - Grupo WhatsApp",
      platform: "whatsapp",
      inviteUrl: "https://chat.whatsapp.com/abc123",
      memberCount: 100,
      category: "entregadores",
      city: "São Paulo",
      active: true,
    }),
  });
  const grpData = await grpRes.json();
  if (grpRes.ok) {
    console.log("✅ Grupo criado:", grpData.group?.name);
  } else {
    console.log("❌ Erro:", grpData.error);
  }

  // 2. Lista campanhas pra pegar uma
  console.log("\n=== 2. Listando campanhas ===");
  const campsRes = await fetch(`${BASE_URL}/api/admin/promotion/campaigns`, {
    headers: { Cookie: cookie },
  });
  const campsData = await campsRes.json();
  const firstCampaign = campsData.campaigns?.[0];
  console.log("Campanha:", firstCampaign?.name);

  // 3. Cria um post com platforms (multi-rede)
  console.log("\n=== 3. Criando post com platforms (multi-rede) ===");
  const postRes = await fetch(`${BASE_URL}/api/admin/promotion/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      campaignId: firstCampaign.id,
      editorialDay: 90,
      sequenceNumber: 4,
      platform: "WhatsApp",
      platforms: "WhatsApp,Telegram,Facebook",
      title: "Teste Fase 2 - Multi-rede",
      description: "Post de teste com platforms multi-rede",
      hashtags: "#meucorre #fase2",
      cta: "Baixe grátis",
      destinationUrl: "https://meucorre.vercel.app",
    }),
  });
  const postData = await postRes.json();
  if (postRes.ok) {
    console.log("✅ Post criado! ID:", postData.post?.id);
    console.log("   Platform:", postData.post?.platform);
    console.log("   Platforms (multi-rede):", postData.post?.platforms);
  } else {
    console.log("❌ Erro:", postData.error);
  }

  // 4. Lista grupos (deve retornar o criado)
  console.log("\n=== 4. Listando grupos ===");
  const listRes = await fetch(`${BASE_URL}/api/admin/promotion/groups?active=true`, {
    headers: { Cookie: cookie },
  });
  const listData = await listRes.json();
  console.log(`Total: ${listData.total}`);
  listData.groups?.forEach((g: any) => {
    console.log(`  - ${g.name} (${g.platform}) | ${g.memberCount} membros`);
  });

  // 5. Limpeza
  console.log("\n=== 5. Limpeza ===");
  if (grpData.group?.id) {
    await fetch(`${BASE_URL}/api/admin/promotion/groups/${grpData.group.id}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    console.log("✅ Grupo removido");
  }
  if (postData.post?.id) {
    await fetch(`${BASE_URL}/api/admin/promotion/posts/${postData.post.id}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    console.log("✅ Post removido");
  }
}

main().catch(console.error);
