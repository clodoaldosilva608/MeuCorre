// Testa a FASE 3 — Telegram Bot API
const BASE_URL = "https://meucorre.vercel.app";
const ADMIN_EMAIL = "clodoaldo608@gmail.com";
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD ?? "");

async function main() {
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

  // 1. Verifica status do Telegram (deve estar não configurado)
  console.log("\n=== 1. Status do Telegram ===");
  const statusRes = await fetch(`${BASE_URL}/api/admin/promotion/telegram-config`, {
    headers: { Cookie: cookie },
  });
  const status = await statusRes.json();
  console.log(JSON.stringify(status, null, 2));

  // 2. Testa salvar token inválido (deve falhar)
  console.log("\n=== 2. Testando token inválido ===");
  const invalidRes = await fetch(`${BASE_URL}/api/admin/promotion/telegram-config`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ botToken: "123:invalid_token_for_testing" }),
  });
  const invalidData = await invalidRes.json();
  console.log("Status:", invalidRes.status);
  console.log("Response:", invalidData.error || invalidData);

  // 3. Lista grupos de Telegram (deve retornar array vazio ou com grupos)
  console.log("\n=== 3. Grupos de Telegram cadastrados ===");
  const groupsRes = await fetch(
    `${BASE_URL}/api/admin/promotion/groups?platform=telegram&active=true`,
    { headers: { Cookie: cookie } },
  );
  const groupsData = await groupsRes.json();
  console.log("Total:", groupsData.total || 0);
  if (groupsData.groups?.length > 0) {
    groupsData.groups.forEach((g: any) => {
      console.log(`  - ${g.name} | ${g.inviteUrl}`);
    });
  }
}

main().catch(console.error);
