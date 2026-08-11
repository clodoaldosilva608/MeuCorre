#!/usr/bin/env node
// ===== Seed: 5 ofertas piloto para a Loja MeuCorre =====
//
// Cria 5 ofertas de produtos relevantes para entregadores usando
// links de afiliado da Amazon Brasil. O admin pode editar/remover
// depois via /admin/offers.
//
// PRÉ-REQUISITO: o admin precisa estar logado (cookie meucorre_admin).
// Para rodar localmente, faça login no /admin/login primeiro e copie
// o cookie. Em produção, rode este script a partir do navegador
// (console do DevTools) após logar no admin.
//
// Uso (via console do navegador logado no admin):
//   node scripts/seed-offers.js
//
// Ou cole o conteúdo no DevTools console após logar em /admin/login.

const OFFERS = [
  {
    title: "Mochila Térmica Premium 25L",
    description:
      "Mochila térmica impermeável com isolamento premium. Mantém comida quente por 6h. Ideal para entregas longas.",
    price: 89.9,
    originalPrice: 149.9,
    imageUrl:
      "https://m.media-amazon.com/images/I/51qJBjJr3gL._AC_SX679_.jpg",
    productUrl:
      "https://www.amazon.com.br/dp/B08QD5ZQ3K?tag=meucorre-20",
    category: "equipamentos",
    proOnly: false,
  },
  {
    title: "Suporte de Celular para Moto Premium",
    description:
      "Suporte universal com garra robusta e amortecedor. Compatible com iPhone e Android. Não vibra com a moto.",
    price: 39.9,
    originalPrice: 79.9,
    imageUrl:
      "https://m.media-amazon.com/images/I/61ZQ8v6JmYL._AC_SX679_.jpg",
    productUrl:
      "https://www.amazon.com.br/dp/B09KXJZ9FJ?tag=meucorre-20",
    category: "equipamentos",
    proOnly: false,
  },
  {
    title: "Capa de Chuva Impermeável Pro",
    description:
      "Capa de chuva reforçada com costuras seladas. Protege moto e entregador. Dobrável e compacta.",
    price: 49.9,
    originalPrice: 99.9,
    imageUrl:
      "https://m.media-amazon.com/images/I/71v1yZpRXWL._AC_SX679_.jpg",
    productUrl:
      "https://www.amazon.com.br/dp/B07YFG4LQK?tag=meucorre-20",
    category: "vestuario",
    proOnly: false,
  },
  {
    title: "Carregador Portátil 20000mAh",
    description:
      "Power bank de alta capacidade com carregamento rápido USB-C. Mantém seu celular ligado o dia todo.",
    price: 59.9,
    originalPrice: 119.9,
    imageUrl:
      "https://m.media-amazon.com/images/I/61u0Q9r-FgL._AC_SX679_.jpg",
    productUrl:
      "https://www.amazon.com.br/dp/B0BGZ8K6KQ?tag=meucorre-20",
    category: "equipamentos",
    proOnly: false,
  },
  {
    title: "Kit Manutenção Moto Essentials",
    description:
      "Kit com óleo, filtro e ferramentas básicas para revisão. Tudo que o entregador precisa para a moto.",
    price: 129.9,
    originalPrice: 199.9,
    imageUrl:
      "https://m.media-amazon.com/images/I/71p1pBzLqKL._AC_SX679_.jpg",
    productUrl:
      "https://www.amazon.com.br/dp/B0BXWY9K3L?tag=meucorre-20",
    category: "ferramentas",
    proOnly: true, // exclusivo PRO
  },
];

async function seed() {
  console.log("=== Seed: 5 ofertas piloto ===\n");
  let created = 0;
  let errors = 0;

  for (const offer of OFFERS) {
    try {
      const res = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(offer),
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✓ Criada: ${offer.title}`);
        created++;
      } else {
        console.error(`✗ Erro em "${offer.title}": ${data.error}`);
        errors++;
      }
    } catch (err) {
      console.error(`✗ Falha de rede em "${offer.title}":`, err.message);
      errors++;
    }
  }

  console.log(`\n=== Resumo ===`);
  console.log(`Criadas: ${created}/${OFFERS.length}`);
  console.log(`Erros: ${errors}`);
  if (created > 0) {
    console.log(
      `\n✅ Ofertas disponíveis no /admin/offers e na aba "Ofertas" do dashboard.`,
    );
  }
}

// Executa apenas no browser (quando colado no console do DevTools)
if (typeof window !== "undefined" && typeof fetch !== "undefined") {
  seed();
} else if (typeof require !== "undefined" && typeof process !== "undefined") {
  // Modo Node.js — só exibe instruções (precisa do cookie do admin)
  console.log(
    "Este script deve ser executado no console do navegador (DevTools)",
  );
  console.log(
    "após fazer login em https://meucorre.vercel.app/admin/login\n",
  );
  console.log("Passos:");
  console.log("1. Faça login em https://meucorre.vercel.app/admin/login");
  console.log("2. Abra o DevTools (F12) → Console");
  console.log("3. Cole todo o conteúdo deste arquivo e pressione Enter");
  console.log(
    "\nOfertas que serão criadas:\n" +
      OFFERS.map((o) => `  - ${o.title} (R$ ${o.price})`).join("\n"),
  );
}

// Exporta para uso programático
if (typeof module !== "undefined") {
  module.exports = { OFFERS, seed };
}
