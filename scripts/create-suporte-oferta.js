#!/usr/bin/env node
// ===== Cria oferta do Suporte Veicular via API admin =====
//
// Este script faz login como admin e cria a oferta diretamente via API.
// Não precisa de interação manual no browser.

const https = require("https");

const BASE = "https://meucorre.vercel.app";

function fetch(path, opts = {}) {
  return new Promise((resolve) => {
    const url = new URL(`${BASE}${path}`);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: opts.method || "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(opts.cookie ? { Cookie: opts.cookie } : {}),
          ...(opts.body ? { "Content-Length": Buffer.byteLength(opts.body) } : {}),
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          // Extrai set-cookie
          const setCookies = res.headers["set-cookie"] || [];
          resolve({
            status: res.statusCode,
            body,
            setCookies,
          });
        });
      }
    );
    req.on("error", (err) => resolve({ status: 0, error: err.message }));
    req.setTimeout(15000, () => req.destroy(new Error("timeout")));
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

function parseJSON(s) {
  try { return JSON.parse(s); } catch { return null; }
}

async function main() {
  console.log("=== Login como admin ===");
  const loginRes = await fetch("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({
      email: "clodoaldo608@gmail.com",
      password: "Silva88677488@#",
    }),
  });

  if (loginRes.status !== 200) {
    console.error("Falha no login:", loginRes.status, loginRes.body);
    process.exit(1);
  }

  // Extrai cookie de sessão
  const cookies = loginRes.setCookies
    .map((c) => c.split(";")[0])
    .join("; ");

  if (!cookies.includes("meucorre_admin")) {
    console.error("Cookie admin não encontrado");
    process.exit(1);
  }

  console.log("✓ Login OK");

  // Cria a oferta
  console.log("\n=== Criando oferta: Suporte Veicular ===");
  const offer = {
    title: "Suporte Veicular Para Celular Automotivo Carro Painel Mesa",
    description:
      "O Suporte Veicular Para Celular Automotivo Carro Painel Mesa Preto é a solução ideal para quem busca praticidade e segurança ao dirigir. Com um design elegante e funcional, este suporte se adapta facilmente a diferentes superfícies, como espelhos, painéis, volante e mesas, garantindo que seu celular esteja sempre ao alcance das mãos. Compatível com diversas marcas e modelos, incluindo iPhone, Samsung, Motorola e Xiaomi, o suporte possui uma fixação ajustável que se adapta ao tamanho do seu dispositivo. Sua montagem é simples e rápida, permitindo que você instale o suporte em segundos, sem complicações. Fabricado com materiais de alta qualidade, o suporte é robusto e confiável, proporcionando estabilidade mesmo em trajetos mais acidentados.",
    price: 19.91,
    originalPrice: 39.90,
    imageUrl:
      "https://http2.mlstatic.com/D_NQ_NP_2X_675335-MLB105960810309_012026-F-suporte-veicular-para-celular-automotivo-carro-painel-mesa.webp",
    productUrl: "https://meli.la/2TBA26a",
    category: "equipamentos",
    proOnly: false,
    active: true,
  };

  const createRes = await fetch("/api/admin/offers", {
    method: "POST",
    body: JSON.stringify(offer),
    cookie: cookies,
  });

  const data = parseJSON(createRes.body);
  if (createRes.status === 200 && data?.ok) {
    console.log("✓ Oferta criada com sucesso!");
    console.log(`  ID: ${data.offer.id}`);
    console.log(`  Título: ${data.offer.title}`);
    console.log(`  Preço: R$ ${data.offer.price}`);
    console.log(`  Original: R$ ${data.offer.originalPrice}`);
  } else {
    console.error("✗ Erro ao criar oferta:", createRes.status, createRes.body);
  }
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
