#!/usr/bin/env node
// ===== Publicar 10 postagens no Blogger via API v3 =====
//
// COMO USAR:
// 1. Você precisa criar um OAuth2 Client ID no Google Cloud Console
// 2. Ou usar o fluxo simplificado abaixo
//
// PRÉ-REQUISITOS:
// - Ter um projeto no Google Cloud Console
// - Criar OAuth2 Client ID (tipo: Desktop app)
// - Adicionar o Client ID e Secret abaixo
//
// Passo a passo para criar OAuth2 Client ID:
// 1. Acesse https://console.cloud.google.com/
// 2. Crie um projeto (ou use um existente)
// 3. Vá em "APIs e Serviços" → "Biblioteca"
// 4. Pesquise "Blogger API v3" e ative
// 5. Vá em "Credenciais" → "Criar credenciais" → "ID do cliente OAuth"
// 6. Tipo: "Aplicativo de desktop"
// 7. Nome: "MeuCorre Blogger"
// 8. Copie o Client ID e Client Secret
// 9. Configure-os abaixo ou como env vars

const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const http = require("http");
const { URL } = require("url");

// ===== CONFIGURAÇÃO =====
const BLOG_ID = "4757545819072532942";
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = "http://localhost:3001/callback";

const POSTS_DIR = "/home/z/my-project/download/blog-posts";
const COVERS_DIR = "/home/z/my-project/download/blog-covers";

// Dados das 10 postagens
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
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.log("\n=== CONFIGURAÇÃO NECESSÁRIA ===");
    console.log("Você precisa criar um OAuth2 Client ID no Google Cloud Console.");
    console.log("\nPasso a passo:");
    console.log("1. Acesse: https://console.cloud.google.com/");
    console.log("2. Crie um projeto (ou use um existente)");
    console.log("3. Vá em 'APIs e Serviços' → 'Biblioteca'");
    console.log("4. Pesquise 'Blogger API v3' e ATIVE");
    console.log("5. Vá em 'Credenciais' → 'Criar credenciais' → 'ID do cliente OAuth'");
    console.log("6. Tipo: 'Aplicativo de desktop'");
    console.log("7. Nome: 'MeuCorre Blogger'");
    console.log("8. Copie o Client ID e Client Secret");
    console.log("9. Rode novamente com:");
    console.log("   GOOGLE_CLIENT_ID=seu_id GOOGLE_CLIENT_SECRET=seu_secret node scripts/publish-blogger.js");
    console.log("\nOu configure como env vars no Vercel.");
    return;
  }

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  // Step 1: Gerar URL de autorização
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/blogger"],
    prompt: "consent",
  });

  console.log("\n=== AUTORIZAÇÃO ===");
  console.log("Abra esta URL no seu navegador (onde você está logado no Google):");
  console.log("\n" + authUrl + "\n");

  // Step 2: Iniciar servidor local para receber o callback
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${3001}`);
    const code = url.searchParams.get("code");

    if (code) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>✅ Autorizado! Você pode fechar esta aba.</h1><p>Publicando postagens...</p>");

      console.log("✅ Código recebido! Trocando por token...");

      try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        console.log("✅ Token obtido!");

        // Step 3: Publicar as 10 postagens
        const blogger = google.blogger({ version: "v3", auth: oauth2Client });

        for (const post of POSTS) {
          console.log(`\n--- Publicando post ${post.num}: ${post.title} ---`);

          // Lê o HTML da postagem
          const htmlFile = path.join(POSTS_DIR, `post-${String(post.num).padStart(2, "0")}.html`);
          if (!fs.existsSync(htmlFile)) {
            console.log(`  ✗ Arquivo não encontrado: ${htmlFile}`);
            continue;
          }

          let html = fs.readFileSync(htmlFile, "utf-8");

          // Extrai o conteúdo do body
          const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
          let content = bodyMatch ? bodyMatch[1] : html;

          // Ajusta o caminho das capas para URL absoluta do blog
          // (o Blogger não tem acesso aos arquivos locais, então usamos
          // a URL do MeuCorre que já tem as capas em /public/blog-covers/)
          content = content.replace(
            /capa-(\d+)\.png/g,
            "https://meucorre.vercel.app/blog-covers/capa-$1.png"
          );

          // Cria a postagem via API
          const response = await blogger.posts.insert({
            blogId: BLOG_ID,
            requestBody: {
              title: post.title,
              content: content,
              labels: post.labels,
            },
          });

          console.log(`  ✅ Publicado! ID: ${response.data.id}`);
          console.log(`  URL: ${response.data.url}`);

          // Aguarda 2 segundos entre postagens para não exceder rate limit
          await new Promise((r) => setTimeout(r, 2000));
        }

        console.log("\n=== ✅ 10 postagens publicadas com sucesso! ===");
        console.log("Acesse: https://meucorre.blogspot.com/");
        server.close();
        process.exit(0);
      } catch (error) {
        console.error("Erro ao publicar:", error.message);
        if (error.response?.data) {
          console.error("Detalhes:", JSON.stringify(error.response.data, null, 2));
        }
        server.close();
        process.exit(1);
      }
    } else {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>❌ Erro: código não recebido</h1>");
    }
  });

  server.listen(3001, () => {
    console.log("🔄 Aguardando autorização em http://localhost:3001/callback");
    console.log("Abra a URL acima no seu navegador e autorize o app.\n");
  });
}

main().catch(console.error);
