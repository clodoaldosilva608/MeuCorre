// Testa FASE 2: migração + criação de grupo
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

  // 1. Verifica status antes da migração
  console.log("\n=== 1. Status ANTES da migração ===");
  const beforeRes = await fetch(`${BASE_URL}/api/admin/promotion/migrate`, {
    headers: { Cookie: cookie },
  });
  const beforeData = await beforeRes.json();
  console.log(JSON.stringify(beforeData, null, 2));

  // 2. Aplica migração
  console.log("\n=== 2. Aplicando migração ===");
  const migrateRes = await fetch(`${BASE_URL}/api/admin/promotion/migrate`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  const migrateData = await migrateRes.json();
  console.log(`Steps: ${migrateData.success}/${migrateData.totalSteps} OK`);
  if (migrateData.errors?.length > 0) {
    console.log("Erros:", JSON.stringify(migrateData.errors, null, 2));
  }

  // 3. Verifica status depois
  console.log("\n=== 3. Status DEPOIS da migração ===");
  const afterRes = await fetch(`${BASE_URL}/api/admin/promotion/migrate`, {
    headers: { Cookie: cookie },
  });
  const afterData = await afterRes.json();
  console.log(JSON.stringify(afterData, null, 2));

  // 4. Cria um grupo de teste
  console.log("\n=== 4. Criando grupo de teste ===");
  const createRes = await fetch(`${BASE_URL}/api/admin/promotion/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      name: "Entregadores SP - WhatsApp",
      platform: "whatsapp",
      inviteUrl: "https://chat.whatsapp.com/abc123teste",
      memberCount: 250,
      category: "entregadores",
      city: "São Paulo",
      notes: "Grupo de teste criado via script",
      active: true,
    }),
  });
  const createData = await createRes.json();
  if (createRes.ok) {
    console.log("✅ Grupo criado! ID:", createData.group?.id);
    console.log("   Nome:", createData.group?.name);
    console.log("   Plataforma:", createData.group?.platform);
  } else {
    console.log("❌ Erro:", createData.error);
  }

  // 5. Lista grupos
  console.log("\n=== 5. Listando grupos ===");
  const listRes = await fetch(`${BASE_URL}/api/admin/promotion/groups`, {
    headers: { Cookie: cookie },
  });
  const listData = await listRes.json();
  console.log(`Total: ${listData.total}`);
  if (listData.groups?.length > 0) {
    listData.groups.forEach((g: any) => {
      console.log(`  - ${g.name} (${g.platform}) | ${g.memberCount} membros | ${g.city || "sem cidade"}`);
    });
  }

  // 6. Limpa grupo de teste
  if (createData.group?.id) {
    console.log("\n=== 6. Removendo grupo de teste ===");
    const delRes = await fetch(
      `${BASE_URL}/api/admin/promotion/groups/${createData.group.id}`,
      { method: "DELETE", headers: { Cookie: cookie } },
    );
    if (delRes.ok) {
      console.log("✅ Grupo removido");
    }
  }
}

main().catch(console.error);
