// Cadastra grupos de teste e cria posts de teste
const BASE_URL = "https://meucorre.vercel.app";
const ADMIN_EMAIL = "clodoaldo608@gmail.com";
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD ?? "");

async function main() {
  // Login
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c: string) => c.split(";")[0]).join("; ");
  console.log("✅ Login OK");

  // ===== 1. CADASTRAR GRUPOS DE TESTE =====
  console.log("\n=== Cadastrando grupos de teste ===");

  const testGroups = [
    {
      name: "Entregadores SP — WhatsApp",
      platform: "whatsapp",
      inviteUrl: "https://chat.whatsapp.com/abc123sp",
      memberCount: 250,
      category: "entregadores",
      city: "São Paulo",
    },
    {
      name: "Motoboys Recife — WhatsApp",
      platform: "whatsapp",
      inviteUrl: "https://chat.whatsapp.com/abc123rec",
      memberCount: 180,
      category: "entregadores",
      city: "Recife",
    },
    {
      name: "Entregadores Brasil — Telegram",
      platform: "telegram",
      inviteUrl: "https://t.me/c/1234567890/123",
      memberCount: 500,
      category: "entregadores",
      city: null,
    },
    {
      name: "Dicas de Moto — Telegram",
      platform: "telegram",
      inviteUrl: "https://t.me/c/9876543210/456",
      memberCount: 320,
      category: "moto",
      city: null,
    },
    {
      name: "Finanças para Entregadores — WhatsApp",
      platform: "whatsapp",
      inviteUrl: "https://chat.whatsapp.com/fin123abc",
      memberCount: 150,
      category: "financas",
      city: null,
    },
    {
      name: "iFood Entregadores — Facebook",
      platform: "facebook",
      inviteUrl: "https://www.facebook.com/groups/ifoodentregadores",
      memberCount: 1200,
      category: "entregadores",
      city: null,
    },
  ];

  let groupsCreated = 0;
  for (const g of testGroups) {
    const res = await fetch(`${BASE_URL}/api/admin/promotion/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(g),
    });
    if (res.ok) {
      groupsCreated++;
      console.log(`✅ ${g.name} (${g.platform})`);
    } else {
      const data = await res.json();
      console.log(`⚠️ ${g.name}: ${data.error?.slice(0, 60)}`);
    }
  }
  console.log(`\n📊 ${groupsCreated} grupos cadastrados`);

  // ===== 2. LISTAR GRUPOS =====
  console.log("\n=== Grupos cadastrados ===");
  const listRes = await fetch(`${BASE_URL}/api/admin/promotion/groups?limit=50`, {
    headers: { Cookie: cookie },
  });
  const listData = await listRes.json();
  console.log(`Total: ${listData.total}`);
  for (const g of listData.groups || []) {
    console.log(`  - ${g.name} (${g.platform}) | ${g.memberCount || "?"} membros | ${g.city || "—"}`);
  }

  // ===== 3. CRIAR POST DE TESTE MULTI-REDE =====
  console.log("\n=== Criando post de teste multi-rede ===");

  // Primeiro lista campanhas
  const campsRes = await fetch(`${BASE_URL}/api/admin/promotion/campaigns`, {
    headers: { Cookie: cookie },
  });
  const campsData = await campsRes.json();
  const firstCampaign = campsData.campaigns?.[0];

  if (firstCampaign) {
    const postData = {
      campaignId: firstCampaign.id,
      editorialDay: 87,
      sequenceNumber: 3,
      platform: "WhatsApp",
      platforms: "WhatsApp,Telegram,Facebook",
      title: "⚡ Descubra quanto você realmente lucra como entregador!",
      description:
        "Você sabe a diferença entre faturamento e lucro líquido? Muitos entregadores confundem os dois e acabam achando que ganham mais do que realmente ganham.\n\nNo MeuCorre, você lança suas corridas e despesas em segundos e vê o lucro real na hora — mesmo sem internet!\n\nBaixe grátis e comece a organizar seu corre hoje mesmo. 🏍️💨",
      hashtags: "#meucorre #entregador #lucroreal #financas #dicas",
      engagementText: "Comenta aqui: você já sabe quanto lucra por dia? 👇",
      cta: "📱 Baixe o MeuCorre grátis: meucorre.vercel.app",
      destinationUrl: "https://meucorre.vercel.app",
      format: "Feed",
      pillar: "Lucro real",
      notes: "Post de teste — multi-rede (WhatsApp + Telegram + Facebook)",
    };

    const postRes = await fetch(`${BASE_URL}/api/admin/promotion/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(postData),
    });
    const postJson = await postRes.json();
    if (postRes.ok) {
      console.log("✅ Post criado!");
      console.log(`   ID: ${postJson.post?.id}`);
      console.log(`   Título: ${postJson.post?.title}`);
      console.log(`   Platforms: ${postJson.post?.platforms}`);
    } else {
      console.log("❌ Erro:", postJson.error?.slice(0, 80));
    }

    // Segundo post
    const post2Data = {
      campaignId: firstCampaign.id,
      editorialDay: 87,
      sequenceNumber: 4,
      platform: "Instagram",
      platforms: "Instagram,TikTok,YouTube",
      title: "🔧 Manutenção da moto: checklist completo pra não quebrar!",
      description:
        "Pneus, óleo, freio, corrente... Você sabe quando trocar cada um?\n\nManutenção preventiva é sempre mais barata que corretiva. Veja nosso checklist completo e nunca mais fique parado no meio da rua!\n\nO MeuCorre te lembra quando fazer cada manutenção. ⚙️",
      hashtags: "#meucorre #manutenção #moto #dicas #entregador",
      engagementText: "Salva esse post pra não esquecer! 📌",
      cta: "📱 Baixe o MeuCorre: meucorre.vercel.app",
      destinationUrl: "https://meucorre.vercel.app",
      format: "Carrossel",
      pillar: "Despesas",
      notes: "Post de teste — multi-rede (Instagram + TikTok + YouTube)",
    };

    const post2Res = await fetch(`${BASE_URL}/api/admin/promotion/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(post2Data),
    });
    const post2Json = await post2Res.json();
    if (post2Res.ok) {
      console.log("✅ Post 2 criado!");
      console.log(`   Título: ${post2Json.post?.title}`);
      console.log(`   Platforms: ${post2Json.post?.platforms}`);
    } else {
      console.log("❌ Erro post 2:", post2Json.error?.slice(0, 80));
    }
  }

  console.log("\n=== RESUMO ===");
  console.log(`✅ ${groupsCreated} grupos cadastrados`);
  console.log("✅ 2 posts multi-rede criados");
  console.log("\nPróximos passos:");
  console.log("1. Crie o bot no Telegram via @BotFather");
  console.log("2. Me mande o token do bot");
  console.log("3. Vou configurar e testar a publicação automática");
}

main().catch(console.error);
