// ===== Lista todos os usuários do banco (pra identificar testes) =====
const BASE_URL = "https://meucorre.vercel.app";
const ADMIN_EMAIL = "clodoaldo608@gmail.com";
const ADMIN_PASSWORD = "Silva88677488@#";

interface User {
  id: string;
  name: string;
  email: string;
  isPro: boolean;
  licenseKey: string | null;
  phone: string | null;
  city: string | null;
  active: boolean;
  trialExtendedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

async function main() {
  console.log("🔐 Login...");
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login falhou: ${res.status}`);
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c: string) => c.split(";")[0]).join("; ");
  console.log("✅ Login OK");

  const u = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Cookie: cookie },
  });
  const { users }: { users: User[] } = await u.json();

  console.log(`\n📊 Total de usuários: ${users.length}\n`);

  for (const user of users) {
    const login = user.lastLoginAt
      ? new Date(user.lastLoginAt).toISOString().slice(0, 10)
      : "nunca";
    const created = new Date(user.createdAt).toISOString().slice(0, 10);
    console.log(
      `${user.id} | ${user.name} | ${user.email} | PRO=${user.isPro ? "SIM" : "nao"} | login=${login} | criado=${created} | city=${user.city || "-"}`,
    );
  }
}

main().catch(console.error);
