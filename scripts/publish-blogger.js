#!/usr/bin/env node
// ===== Publicar 10 postagens no Blogger via API v3 =====
// Fluxo: gera URL de autorização → usuário abre no navegador → cola código → script publica

const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const BLOG_ID = "4757545819072532942";
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
// Redirect URI deve ser "urn:ietf:wg:oauth:2.0:oob" (fluxo manual) ou http://localhost
const REDIRECT_URI = "urn:ietf:wg:oauth:2.0:oob";

const POSTS_DIR = "/home/z/my-project/download/blog-posts";

const POSTS = [
  { num: 1, title: "Como Calcular o Lucro Real Como Entregador de App", labels: ["entregador", "finanças", "meucorre", "lucro"] },
  { num: 2, title: "Planejamento Financeiro para Motoboys: Guia Completo 2026", labels: ["entregador", "finanças", "meucorre", "planejamento"] },
  { num: 3, title: "Manutenção da Moto para Entregadores: Checklist Completo", labels: ["entregador", "moto", "meucorre", "manutenção"] },
  { num: 4, title: "Como Economizar Combustível Sendo Entregador", labels: ["entregador", "economia", "meucorre", "combustível"] },
  { num: 5, title: "Melhores Horários e Zonas para Entregar em Cada App", labels: ["entregador", "estratégia", "meucorre", "horários"] },
  { num: 6, title: "Equipamentos Essenciais para Entregadores de App", labels: ["entregador", "equipamentos", "meucorre"] },
  { num: 7, title: "Gestão de Tempo para Entregadores: Como Rodar Mais em Menos Tempo", labels: ["entregador", "produtividade", "meucorre"] },
  { num: 8, title: "Declaração de Imposto de Renda para Entregadores 2026", labels: ["entregador", "impostos", "meucorre", "IR"] },
  { num: 9, title: "Qual App de Entrega Dá Mais Dinheiro? Comparativo 2026", labels: ["entregador", "comparativo", "meucorre", "apps"] },
  { num: 10, title: "Como Se Tornar um Entregador 5 Estrelas em Todos os Apps", labels: ["entregador", "dicas", "meucorre", "avaliação"] },
];

async function main() {
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  // Gera URL de autorização
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/blogger"],
    prompt: "consent",
  });

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║          PUBLICAÇÃO AUTOMÁTICA NO BLOGGER                 ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("\n📝 PASSO 1: Abra esta URL no seu navegador:");
  console.log("\n" + authUrl + "\n");
  console.log("📝 PASSO 2: Autorize o acesso");
  console.log("📝 PASSO 3: Copie o código que o Google vai te dar");
  console.log("📝 PASSO 4: Cole o código abaixo\n");

  // Lê o código do stdin
  const code = await new Promise((resolve) => {
    process.stdout.write("Cole o código aqui: ");
    process.stdin.resume();
    process.stdin.once("data", (data) => {
      process.stdin.pause();
      resolve(data.toString().trim());
    });
  });

  if (!code) {
    console.log("❌ Nenhum código fornecido.");
    process.exit(1);
  }

  console.log("\n🔄 Trocando código por token...");

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    console.log("✅ Token obtido!");

    const blogger = google.blogger({ version: "v3", auth: oauth2Client });

    console.log(`\n📦 Publicando ${POSTS.length} postagens no blog ${BLOG_ID}...\n`);

    for (const post of POSTS) {
      console.log(`[${post.num}/${POSTS.length}] ${post.title}`);

      const htmlFile = path.join(POSTS_DIR, `post-${String(post.num).padStart(2, "0")}.html`);
      if (!fs.existsSync(htmlFile)) {
        console.log(`  ❌ Arquivo não encontrado: ${htmlFile}`);
        continue;
      }

      let html = fs.readFileSync(htmlFile, "utf-8");
      const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
      let content = bodyMatch ? bodyMatch[1] : html;

      // Ajusta capas para URL do MeuCorre
      content = content.replace(
        /capa-(\d+)\.png/g,
        "https://meucorre.vercel.app/blog-covers/capa-$1.png"
      );

      const response = await blogger.posts.insert({
        blogId: BLOG_ID,
        requestBody: {
          title: post.title,
          content: content,
          labels: post.labels,
        },
      });

      console.log(`  ✅ Publicado! URL: ${response.data.url}`);
      await new Promise((r) => setTimeout(r, 2000));
    }

    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║  ✅ 10 POSTAGENS PUBLICADAS COM SUCESSO!                  ║");
    console.log("║  Acesse: https://meucorre.blogspot.com/                   ║");
    console.log("╚══════════════════════════════════════════════════════════╝");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Erro:", error.message);
    if (error.response?.data?.error?.message) {
      console.error("Detalhe:", error.response.data.error.message);
    }
    process.exit(1);
  }
}

main().catch(console.error);
