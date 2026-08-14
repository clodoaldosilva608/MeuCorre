// Testa status do Facebook e Telegram + lista grupos e posts
const BASE_URL = "https://meucorre.vercel.app";
const ADMIN_EMAIL = "clodoaldo608@gmail.com";
const ADMIN_PASSWORD = "Silva88677488@#";

async function main() {
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c: string) => c.split(";")[0]).join("; ");
  console.log("✅ Login OK\n");

  // 1. Status Telegram
  console.log("=== Telegram ===");
  const tgRes = await fetch(`${BASE_URL}/api/admin/promotion/telegram-config`, {
    headers: { Cookie: cookie },
  });
  const tgData = await tgRes.json();
  console.log("Configured:", tgData.configured);
  console.log("Valid:", tgData.valid);
  if (tgData.botInfo) console.log("Bot:", tgData.botInfo.username);
  if (tgData.needsConfig) console.log("⚠️ Precisa de bot token");
  console.log();

  // 2. Status Facebook
  console.log("=== Facebook/Instagram ===");
  const fbRes = await fetch(`${BASE_URL}/api/admin/promotion/facebook-config`, {
    headers: { Cookie: cookie },
  });
  const fbData = await fbRes.json();
  console.log("Configured:", fbData.configured);
  console.log("HasToken:", fbData.hasToken);
  console.log("Valid:", fbData.valid);
  if (fbData.needsEnvVars) console.log("⚠️ Precisa de FACEBOOK_APP_ID e FACEBOOK_APP_SECRET");
  if (fbData.authUrl) console.log("Auth URL disponível:", fbData.authUrl?.slice(0, 60) + "...");
  console.log();

  // 3. Grupos cadastrados
  console.log("=== Grupos ===");
  const groupsRes = await fetch(`${BASE_URL}/api/admin/promotion/groups?limit=50`, {
    headers: { Cookie: cookie },
  });
  const groupsData = await groupsRes.json();
  console.log("Total:", groupsData.total);
  for (const g of groupsData.groups || []) {
    console.log(`  - ${g.name} (${g.platform}) | ${g.memberCount || "?"} membros | ${g.city || "—"}`);
  }
  console.log();

  // 4. Posts multi-rede
  console.log("=== Posts multi-rede ===");
  const postsRes = await fetch(`${BASE_URL}/api/admin/promotion/posts?limit=10`, {
    headers: { Cookie: cookie },
  });
  const postsData = await postsRes.json();
  for (const p of (postsData.posts || []).slice(0, 5)) {
    console.log(`  - [${p.platform}] ${p.title?.slice(0, 50)}`);
    if (p.platforms) console.log(`    Multi-rede: ${p.platforms}`);
  }
}

main().catch(console.error);
