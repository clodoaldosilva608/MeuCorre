import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/user-auth";

// ===== POST /api/offers/[id]/click — registra clique e redireciona =====
//
// Chamado quando o usuário clica em "Garanta seu desconto" no card da oferta.
// Faz 3 coisas:
//   1. Incrementa o contador de clicks da oferta (analytics)
//   2. (Opcional) Registra evento de clique se usuário estiver logado
//   3. Retorna a URL final com parâmetros UTM para o frontend redirecionar
//
// Não retornamos redirect 302 direto porque o frontend precisa abrir em nova aba
// (target=_blank). Em vez disso, retornamos JSON com a URL enriquecida.
//
// UTM tracking: anexa ?utm_source=meucorre&utm_medium=app&utm_campaign=offer_<id>
// à URL do produto. Isso permite que parceiros reportem conversões atribuídas
// ao MeuCorre e justifiquem comissões de afiliado.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Busca a oferta (apenas se ativa e dentro do período)
  const offer = await prisma.offer.findUnique({
    where: { id },
  });

  if (!offer || !offer.active) {
    return NextResponse.json(
      { error: "Oferta não encontrada ou inativa" },
      { status: 404 },
    );
  }

  // Verifica vigência
  const now = new Date();
  if (offer.startsAt > now) {
    return NextResponse.json(
      { error: "Oferta ainda não disponível" },
      { status: 400 },
    );
  }
  if (offer.endsAt && offer.endsAt < now) {
    return NextResponse.json(
      { error: "Oferta expirada" },
      { status: 400 },
    );
  }

  // Se oferta for PRO-only, verifica se usuário é PRO
  if (offer.proOnly) {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json(
        { error: "Oferta exclusiva para usuários PRO", requiresPro: true },
        { status: 403 },
      );
    }
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { isPro: true },
    });
    if (!user?.isPro) {
      return NextResponse.json(
        { error: "Oferta exclusiva para usuários PRO", requiresPro: true },
        { status: 403 },
      );
    }
  }

  // Incrementa contador de cliques (fire-and-forget, não bloqueia resposta)
  prisma.offer
    .update({
      where: { id },
      data: { clicks: { increment: 1 } },
    })
    .catch(() => {
      // erro de incremento não derruba o clique do usuário
    });

  // Constrói URL final com UTM tracking
  const url = new URL(offer.productUrl);
  url.searchParams.set("utm_source", "meucorre");
  url.searchParams.set("utm_medium", "app");
  url.searchParams.set("utm_campaign", `offer_${id}`);
  // Preserva parâmetros existentes na URL do afiliado (ex: ?ref=XXX)

  return NextResponse.json({
    ok: true,
    url: url.toString(),
    offerId: id,
  });
}
