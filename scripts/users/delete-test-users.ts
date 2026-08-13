// ===== Exclui TODOS os usuários de teste do banco de produção =====
//
// Critério: TODOS os 500 usuários atuais são de teste (E2E, screenshots, etc).
// Nenhum usuário real existe na tabela User (admin usa AdminUser separada).
//
// O schema NÃO tem @relation de SyncedDelivery/Expense/etc → User,
// então prisma.user.delete() não encontra FK e funciona direto.

const BASE_URL = "https://meucorre.vercel.app";
const ADMIN_EMAIL = "clodoaldo608@gmail.com";
const ADMIN_PASSWORD = "Silva88677488@#";

interface User {
  id: string;
  name: string;
  email: string;
  isPro: boolean;
}

async function login(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login falhou: ${res.status}`);
  const setCookie = res.headers.getSetCookie?.() ?? [];
  return setCookie.map((c: string) => c.split(";")[0]).join("; ");
}

async function deleteBatch(
  cookie: string,
  users: User[],
  startIndex: number,
): Promise<{ ok: number; fail: number }> {
  let ok = 0;
  let fail = 0;

  // Deleta em paralelo (10 por vez)
  const PARALLEL = 10;
  for (let i = 0; i < users.length; i += PARALLEL) {
    const batch = users.slice(i, i + PARALLEL);
    const results = await Promise.all(
      batch.map(async (u) => {
        try {
          const r = await fetch(`${BASE_URL}/api/admin/users/${u.id}`, {
            method: "DELETE",
            headers: { Cookie: cookie },
          });
          return r.ok;
        } catch {
          return false;
        }
      }),
    );
    for (const r of results) {
      if (r) ok++;
      else fail++;
    }
    process.stdout.write(".");
    if ((i + PARALLEL) % 100 === 0) {
      console.log(`\n${startIndex + i + PARALLEL}/${users.length + startIndex}`);
    }
  }
  return { ok, fail };
}

async function main() {
  console.log("🔐 Login...");
  const cookie = await login();
  console.log("✅ Login OK");

  console.log("\n📋 Listando usuários...");
  const listRes = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Cookie: cookie },
  });
  const { users }: { users: User[] } = await listRes.json();
  console.log(`📊 ${users.length} usuários pra excluir\n`);

  // Snapshot de proteção: lista emails que NÃO devem ser excluídos
  // (caso future real users existam — admin usa AdminUser, mas por precaução)
  const PROTECTED = new Set<string>();
  // Adicione aqui qualquer email real que deva ser preservado:
  // PROTECTED.add("realuser@gmail.com");

  const toDelete = users.filter((u) => !PROTECTED.has(u.email.toLowerCase()));
  const protected_count = users.length - toDelete.length;
  console.log(`🛡️  ${protected_count} usuário(s) protegido(s)`);
  console.log(`🗑️  ${toDelete.length} usuário(s) a excluir\n`);

  if (toDelete.length === 0) {
    console.log("Nada a excluir.");
    return;
  }

  console.log("🔄 Excluindo...");
  const result = await deleteBatch(cookie, toDelete, 0);

  console.log(`\n\n✅ ${result.ok} excluídos, ${result.fail} falhas`);

  // Verificação final
  const checkRes = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Cookie: cookie },
  });
  const checkData = await checkRes.json();
  console.log(`\n📊 Usuários restantes: ${checkData.users?.length ?? 0}`);
  if (checkData.users?.length > 0) {
    console.log("\nRestantes:");
    for (const u of checkData.users) {
      console.log(`  - ${u.email} (${u.name})`);
    }
  }
}

main().catch((e) => {
  console.error("❌ Erro fatal:", e);
  process.exit(1);
});
