// ===== Teste E2E: cria dados reais e valida fluxos =====
const BASE_URL = "https://meucorre.vercel.app";

async function login() {
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "clodoaldo608@gmail.com", password: "Silva88677488@#" }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  return setCookie.map((c: string) => c.split(";")[0]).join("; ");
}

async function api(method: string, path: string, body: unknown, cookie: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  const cookie = await login();
  console.log("✅ Login OK\n");

  // ===== 1. ANÚNCIO =====
  console.log("📢 Criando anúncio...");
  const adRes = await api("POST", "/api/admin/ads", {
    title: "Promo Teste E2E — App MeuCorre PRO",
    description: "Baixe agora e organize seu corre",
    cta: "Baixar grátis",
    url: "https://meucorre.vercel.app",
    imageUrl: "https://meucorre.vercel.app/hero-banner.png",
    bgColor: "#10b981",
    textColor: "#09090b",
    placement: "banner_top",
    active: true,
  }, cookie);
  console.log(`   ${adRes.ok ? "✅" : "❌"} Anúncio criado (ID: ${adRes.data.ad?.id?.slice(0, 8)}...)`);

  // ===== 2. OFERTA =====
  console.log("🛒 Criando oferta...");
  const offerRes = await api("POST", "/api/admin/offers", {
    title: "Mochila Térmica Premium — 30% OFF",
    description: "Mochila térmica impermeável para entregadores",
    price: 89.90,
    originalPrice: 129.90,
    imageUrl: "https://meucorre.vercel.app/hero-banner.png",
    productUrl: "https://example.com/mochila",
    category: "equipamentos",
    proOnly: false,
    active: true,
  }, cookie);
  console.log(`   ${offerRes.ok ? "✅" : "❌"} Oferta criada (ID: ${offerRes.data.offer?.id?.slice(0, 8)}...)`);

  // ===== 3. PARCEIRO (se não existir suficiente) =====
  console.log("\n🤝 Criando parceiro de teste...");
  const partnerRes = await api("POST", "/api/admin/partners", {
    companyName: `E2E Teste Funcional ${Date.now()}`,
    tradeName: "E2E Teste",
    category: "oficina",
    city: "Recife",
    state: "PE",
    phone: "(81) 99999-9999",
    email: `e2e-teste-${Date.now()}@test.com`,
    priority: "alta",
    stage: "novo_lead",
    assignedTo: "Clodoaldo Silva",
    notes: "Parceiro criado para teste E2E",
  }, cookie);
  const partnerId = partnerRes.data.partner?.id;
  console.log(`   ${partnerRes.ok ? "✅" : "❌"} Parceiro criado (ID: ${partnerId?.slice(0, 8)}...)`);

  // Adiciona contato ao parceiro
  if (partnerId) {
    const contactRes = await api("POST", `/api/admin/partners/${partnerId}/contacts`, {
      name: "João E2E",
      role: "Proprietário",
      email: `joao-e2e-${Date.now()}@test.com`,
      phone: "(81) 98888-8888",
      isPrimary: true,
    }, cookie);
    const contactId = contactRes.data.contact?.id;
    console.log(`   ${contactRes.ok ? "✅" : "❌"} Contato criado`);

    // ===== 4. PROPOSTA =====
    console.log("\n📄 Criando proposta...");
    const proposalRes = await api("POST", "/api/admin/proposals", {
      partnerId,
      title: "Proposta E2E — Parceria Q3 2026",
      fromTemplate: "standard_both",
      billingModel: "both",
      campaignPrice: 1500,
      leadPrice: 5,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: "Proposta de teste E2E",
    }, cookie);
    const proposalId = proposalRes.data.proposal?.id;
    console.log(`   ${proposalRes.ok ? "✅" : "❌"} Proposta criada (número: ${proposalRes.data.proposal?.number})`);

    // Envia proposta
    if (proposalId) {
      const sendRes = await api("POST", `/api/admin/proposals/${proposalId}/send`, {}, cookie);
      console.log(`   ${sendRes.ok ? "✅" : "❌"} Proposta enviada (status: ${sendRes.data.proposal?.status})`);

      // Aprova proposta
      const approveRes = await api("POST", `/api/admin/proposals/${proposalId}/approve`, {}, cookie);
      console.log(`   ${approveRes.ok ? "✅" : "❌"} Proposta aprovada (status: ${approveRes.data.proposal?.status})`);
    }

    // ===== 5. CAMPANHA DE PARCEIRO =====
    console.log("\n🏷️ Criando campanha de parceiro...");
    const campaignRes = await api("POST", "/api/admin/partner-campaigns", {
      partnerId,
      proposalId: proposalId ?? undefined,
      name: "Campanha E2E — 15% OFF Entregadores",
      offerTitle: "15% OFF para entregadores MeuCorre",
      offerDescription: "Desconto exclusivo em serviços para entregadores",
      offerCta: "Aproveitar oferta",
      offerUrl: "https://meucorre.vercel.app",
      couponCode: "MEUCORRE15",
      discountText: "15% OFF",
      category: "servicos",
      city: "Recife",
      state: "PE",
      billingModel: "both",
      campaignPrice: 1500,
      leadPrice: 5,
      endsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    }, cookie);
    const campaignId = campaignRes.data.campaign?.id;
    console.log(`   ${campaignRes.ok ? "✅" : "❌"} Campanha criada (ID: ${campaignId?.slice(0, 8)}...)`);

    // Aprova e publica campanha
    if (campaignId) {
      const apprRes = await api("POST", `/api/admin/partner-campaigns/${campaignId}/approve`, {}, cookie);
      console.log(`   ${apprRes.ok ? "✅" : "❌"} Campanha aprovada (status: ${apprRes.data.campaign?.status})`);

      const pubRes = await api("POST", `/api/admin/partner-campaigns/${campaignId}/publish`, {}, cookie);
      console.log(`   ${pubRes.ok ? "✅" : "❌"} Campanha publicada (status: ${pubRes.data.campaign?.status})`);
    }

    // ===== 6. OUTBOUND SUPERVISIONADO =====
    console.log("\n📤 Criando template outbound...");
    // Ativa flag de envio para teste
    await api("POST", "/api/admin/feature-flags", { key: "partner_outbound_send_enabled", value: true }, cookie);

    const templateRes = await api("POST", "/api/admin/outbound/templates", {
      name: "E2E — Primeiro contato WhatsApp",
      channel: "whatsapp",
      objective: "permission",
      body: "Olá {NOME}! Aqui é do MeuCorre, o app que ajuda entregadores a organizar corridas e despesas.\n\nVi que a {EMPRESA} em {CIDADE}/{ESTADO} atende muitos entregadores. Topa uma parceria?\n\n{MOTIVO}",
      cta: "Posso te mandor mais informações?",
      optOutText: "Responda PARE para não receber mais",
      status: "approved",
    }, cookie);
    const templateId = templateRes.data.template?.id;
    console.log(`   ${templateRes.ok ? "✅" : "❌"} Template criado (ID: ${templateId?.slice(0, 8)}...)`);

    // Dry-run
    if (templateId) {
      const dryRunRes = await api("POST", `/api/admin/outbound/templates/${templateId}/dry-run`, {
        preview: {
          NOME: "João",
          EMPRESA: "E2E Teste",
          CIDADE: "Recife",
          ESTADO: "PE",
          CATEGORIA: "oficina",
          MOTIVO: "Atende muitos entregadores da região",
        },
      }, cookie);
      console.log(`   ${dryRunRes.ok ? "✅" : "❌"} Dry-run executado`);
      if (dryRunRes.data.rendered) {
        console.log(`   📝 Preview: "${dryRunRes.data.rendered.body.slice(0, 80)}..."`);
      }
    }

    // Prepara mensagem
    console.log("\n📨 Preparando mensagem outbound...");
    if (templateId && contactId) {
      const prepRes = await api("POST", "/api/admin/outbound/logs/prepare", {
        items: [{ partnerId, contactId, templateId, channel: "whatsapp" }],
      }, cookie);
      console.log(`   ${prepRes.ok ? "✅" : "❌"} Prepare: ${prepRes.data.created} criadas, ${prepRes.data.blocked} bloqueadas`);

      // Busca o log criado
      const logsRes = await api("GET", `/api/admin/outbound/logs?partnerId=${partnerId}&limit=1`, null, cookie);
      const logId = logsRes.data.logs?.[0]?.id;

      if (logId) {
        // Aprova
        const apprLogRes = await api("POST", `/api/admin/outbound/logs/${logId}/approve`, {}, cookie);
        console.log(`   ${apprLogRes.ok ? "✅" : "❌"} Mensagem aprovada (status: ${apprLogRes.data.log?.status})`);

        // Envia
        const sendLogRes = await api("POST", `/api/admin/outbound/logs/${logId}/send`, {}, cookie);
        console.log(`   ${sendLogRes.ok ? "✅" : "❌"} Mensagem enviada (status: ${sendLogRes.data.log?.status})`);

        // Classifica resposta
        const classifyRes = await api("POST", `/api/admin/outbound/logs/${logId}/classify`, {
          method: "manual",
          classification: "interessado",
          responseText: "Tenho interesse, me manda mais informações",
        }, cookie);
        console.log(`   ${classifyRes.ok ? "✅" : "❌"} Resposta classificada: ${classifyRes.data.classificationLabel}`);
      }
    }

    // Desativa flag de envio
    await api("POST", "/api/admin/feature-flags", { key: "partner_outbound_send_enabled", value: false }, cookie);
  }

  // ===== 7. MATERIAL COMERCIAL =====
  console.log("\n📦 Criando material comercial...");
  const assetRes = await api("POST", "/api/admin/commercial-assets", {
    type: "media_kit",
    name: "E2E Media Kit MeuCorre 2026",
    description: "Media kit completo com informações do MeuCorre",
    storageKey: "commercial/e2e-media-kit.pdf",
    publicUrl: "https://meucorre.vercel.app/hero-banner.png",
    mimeType: "application/pdf",
    fileSize: 1024000,
    version: "v1.0",
    tags: "recife, 2026, teste",
  }, cookie);
  console.log(`   ${assetRes.ok ? "✅" : "❌"} Material criado (ID: ${assetRes.data.asset?.id?.slice(0, 8)}...)`);

  // ===== 8. ATIVIDADE NO PARCEIRO =====
  if (partnerId) {
    console.log("\n📅 Criando atividade no parceiro...");
    const actRes = await api("POST", `/api/admin/partners/${partnerId}/activities`, {
      type: "call",
      title: "Ligação E2E — Primeiro contato",
      description: "Ligação de apresentação do MeuCorre",
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: "Clodoaldo Silva",
    }, cookie);
    console.log(`   ${actRes.ok ? "✅" : "❌"} Atividade criada`);
  }

  // ===== RESUMO =====
  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMO DO TESTE E2E");
  console.log("=".repeat(60));

  const checks = [
    { label: "Anúncios", path: "/api/admin/ads", field: "ads" },
    { label: "Ofertas", path: "/api/admin/offers", field: "offers" },
    { label: "Parceiros", path: "/api/admin/partners?limit=1", field: "total" },
    { label: "Propostas", path: "/api/admin/proposals?limit=1", field: "total" },
    { label: "Materiais", path: "/api/admin/commercial-assets?limit=1", field: "total" },
    { label: "Campanhas", path: "/api/admin/partner-campaigns?limit=1", field: "total" },
    { label: "Templates outbound", path: "/api/admin/outbound/templates?limit=1", field: "total" },
    { label: "Logs outbound", path: "/api/admin/outbound/logs?limit=1", field: "total" },
    { label: "Posts divulgação", path: "/api/admin/promotion/posts?limit=1", field: "total" },
    { label: "Assets", path: "/api/admin/promotion/assets?limit=1", field: "total" },
    { label: "Dashboard métricas", path: "/api/admin/metrics/dashboard", field: "revenue" },
    { label: "Alertas", path: "/api/admin/metrics/alerts", field: "totalAlerts" },
  ];

  for (const c of checks) {
    const r = await api("GET", c.path, null, cookie);
    const val = r.data[c.field];
    const count = Array.isArray(val) ? val.length : (typeof val === "object" ? "OK" : val);
    console.log(`   ${r.ok ? "✅" : "❌"} ${c.label}: ${count}`);
  }

  console.log("=".repeat(60));
  console.log("\n✅ Teste E2E concluído!");
  console.log("🔗 Valide visualmente: https://meucorre.vercel.app/admin/dashboard");
}

main().catch(console.error);
