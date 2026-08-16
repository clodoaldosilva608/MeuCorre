import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// ===== API de Templates de Mensagem =====
//
// GET /api/admin/parceiros/templates — lista templates por categoria
// POST /api/admin/parceiros/templates — cria template
//
// Templates são mensagens prontas para WhatsApp/Telegram personalizadas
// por categoria de lead (restaurante, farmácia, etc.)

interface Template {
  id: string;
  category: string;
  channel: "whatsapp" | "telegram" | "email";
  name: string;
  content: string;
}

// Templates pré-seedeados (não precisam de banco)
const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "restaurant_whatsapp_1",
    category: "restaurant",
    channel: "whatsapp",
    name: "Primeiro contato — Restaurante",
    content: `Olá! Tudo bem? 👋

Sou do MeuCorre, um app que ajuda entregadores a controlarem corridas, despesas e lucro real.

Vi que vocês do {NOME} fazem delivery e pensei: que tal a gente se une? Seus clientes que pedem pelo app podem usar o MeuCorre grátis pra controlar o que ganham com vocês.

Posso te explicar melhor em 2 minutinhos? 🏍️`,
  },
  {
    id: "restaurant_whatsapp_2",
    category: "restaurant",
    channel: "whatsapp",
    name: "Follow-up — Restaurante",
    content: `Oi! Passando pra saber se você viu minha mensagem sobre parceria. 😊

O MeuCorre é grátis pra entregador e pra estabelecimento. A gente só quer ajudar quem corre atrás a cuidar do dinheiro.

Tem 2 minutos pra bater um papo?`,
  },
  {
    id: "fast_food_whatsapp_1",
    category: "fast_food",
    channel: "whatsapp",
    name: "Primeiro contato — Lanchonete",
    content: `Fala, beleza? 🍔

Sou do MeuCorre! Ajudamos entregadores de app a saber quanto realmente lucram.

Vocês da {NOME} fazem delivery, né? Que tal seus entregadores usarem nosso app grátis e a gente faz uma parceria?

Bora conversar? 🚀`,
  },
  {
    id: "pharmacy_whatsapp_1",
    category: "pharmacy",
    channel: "whatsapp",
    name: "Primeiro contato — Farmácia",
    content: `Olá! Tudo bem? 💊

Sou do MeuCorre, um app gratuito para entregadores controlarem finanças.

Vi que a {NOME} faz entrega de medicamentos. Os entregadores de vocês podem usar o MeuCorre grátis pra saber quanto lucram por dia.

Posso te mostrar como funciona?`,
  },
  {
    id: "supermarket_whatsapp_1",
    category: "supermarket",
    channel: "whatsapp",
    name: "Primeiro contato — Supermercado",
    content: `Olá! Tudo bem? 🛒

Sou do MeuCorre! Ajudamos entregadores a controlar corridas e lucro real.

Os entregadores da {NOME} podem usar nosso app grátis. E a gente pode fazer uma parceria pra divulgar vocês dentro do app.

Tem interesse? Posso explicar em 2 min!`,
  },
  {
    id: "cafe_whatsapp_1",
    category: "cafe",
    channel: "whatsapp",
    name: "Primeiro contato — Café",
    content: `Oi! Tudo bem? ☕

Sou do MeuCorre, um app grátis pra entregadores controlarem o dinheiro.

Vi que a {NOME} faz delivery! Que tal a gente faz uma parceria? Seus clientes entregadores usam o app grátis e vocês ganham visibilidade.

Bora bater um papo?`,
  },
  {
    id: "general_whatsapp_1",
    category: "general",
    channel: "whatsapp",
    name: "Primeiro contato — Geral",
    content: `Olá! Tudo bem? 👋

Sou do MeuCorre, um app gratuito que ajuda entregadores de aplicativo a controlarem corridas, despesas e lucro real.

Vi que vocês do {NOME} fazem entrega. Que tal uma parceria? Seus entregadores usam o app grátis e a gente se ajuda mutuamente.

Posso te explicar em 2 minutinhos? 🏍️`,
  },
  {
    id: "general_whatsapp_followup",
    category: "general",
    channel: "whatsapp",
    name: "Follow-up — Geral (7 dias)",
    content: `Oi! Tudo bem? 😊

Passando pra saber se você teve oportunidade de ver minha mensagem sobre a parceria com o MeuCorre.

O app é grátis, funciona offline e já tem milhares de entregadores usando. Bora conversar?`,
  },
  {
    id: "general_whatsapp_closed",
    category: "general",
    channel: "whatsapp",
    name: "Pós-fechamento — Boas-vindas",
    content: `🎉 Bem-vindo à família MeuCorre!

Que ótimo que vocês do {NOME} toparon a parceria! 

Próximos passos:
1. Vou cadastrar vocês no nosso sistema
2. Vamos criar materiais de divulgação
3. Seus entregadores podem baixar o app grátis

Qualquer dúvida, é só chamar! 🏍️💚`,
  },
];

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  let templates = DEFAULT_TEMPLATES;
  if (category && category !== "all") {
    templates = templates.filter(t => t.category === category || t.category === "general");
  }

  return NextResponse.json({ templates });
}
