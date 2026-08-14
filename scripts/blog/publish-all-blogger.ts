// Publica todos os posts no Blogger — versão robusta com retry
const BASE_URL = "https://meucorre.vercel.app";
const ADMIN_EMAIL = "clodoaldo608@gmail.com";
const ADMIN_PASSWORD = "Silva88677488@#";

async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("=== Login ===");
  const loginRes = await fetchWithTimeout(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  }, 15000);
  if (!loginRes.ok) throw new Error(`Login falhou: ${loginRes.status}`);
  const setCookie = loginRes.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c: string) => c.split(";")[0]).join("; ");
  console.log("✅ Login OK");

  console.log("\n=== Listando posts ===");
  const listRes = await fetchWithTimeout(`${BASE_URL}/api/admin/blog`, {
    headers: { Cookie: cookie },
  }, 30000);
  const { posts } = await listRes.json();

  const unpublished = posts.filter((p: any) => !p.bloggerPostId);
  const alreadyPublished = posts.length - unpublished.length;

  console.log(`📊 Total: ${posts.length} | ✅ Já no Blogger: ${alreadyPublished} | ⏳ Pendentes: ${unpublished.length}\n`);

  if (unpublished.length === 0) {
    console.log("🎉 Todos publicados!");
    return;
  }

  let published = 0;
  let failed = 0;
  const failures: Array<{ slug: string; error: string }> = [];

  for (let i = 0; i < unpublished.length; i++) {
    const post = unpublished[i];
    const progress = `[${i + 1}/${unpublished.length}]`;
    process.stdout.write(`${progress} ${post.slug.slice(0, 40).padEnd(42)} `);

    let success = false;
    let lastError = "";

    // Retry 2x em caso de erro de rede
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const pubRes = await fetchWithTimeout(`${BASE_URL}/api/admin/blog/publish-blogger`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: JSON.stringify({ postId: post.id }),
        }, 45000);

        if (pubRes.ok) {
          const pub = await pubRes.json();
          if (pub.bloggerUrl) {
            published++;
            success = true;
            console.log("✅");
            break;
          }
        }

        const pub = await pubRes.json().catch(() => ({}));
        if (pub.needsAuth) {
          lastError = "TOKEN EXPIRADO — reautorize o Blogger";
          console.log(`❌ ${lastError}`);
          failed++;
          failures.push({ slug: post.slug, error: lastError });
          // Para tudo — token precisa ser renovado
          console.log(`\n⚠️  Parei no post ${i + 1}. Reautorize o Blogger e rode de novo.`);
          console.log(`\n=== RESULTADO PARCIAL ===`);
          console.log(`✅ Publicados: ${published}`);
          console.log(`❌ Falhas: ${failed}`);
          return;
        }
        lastError = pub.error?.slice(0, 70) || `HTTP ${pubRes.status}`;
      } catch (e: any) {
        lastError = e.name === "AbortError" ? "timeout" : e.message.slice(0, 70);
      }

      if (attempt < 2) {
        process.stdout.write(`(retry ${attempt + 1}) `);
        await sleep(5000);
      }
    }

    if (!success) {
      failed++;
      failures.push({ slug: post.slug, error: lastError });
      console.log(`❌ ${lastError}`);
    }

    // 2 segundos entre posts (Blogger aceita ~10/min)
    if (i < unpublished.length - 1) {
      await sleep(2000);
    }

    // Log progress a cada 10
    if ((i + 1) % 10 === 0) {
      console.log(`--- ${i + 1}/${unpublished.length} processados ---`);
    }
  }

  console.log(`\n=== RESULTADO ===`);
  console.log(`✅ Publicados: ${published}`);
  console.log(`❌ Falhas: ${failed}`);

  if (failures.length > 0) {
    console.log("\nFalhas:");
    for (const f of failures) {
      console.log(`  - ${f.slug}: ${f.error}`);
    }
  }
}

main().catch((e) => {
  console.error("❌ Erro fatal:", e);
  process.exit(1);
});
