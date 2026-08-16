import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { z } from "zod";

// POST /api/subscription/[id]/receipt
// Faz upload do comprovante Pix (base64 data URL).
// Limite de 2MB para manter o DB enxuto.
//
// SECURITY: Esta rota é "pública" no sentido de não requerer admin auth,
// MAS valida que o comprador (buyerEmail) corresponde ao email do usuário
// logado (cookie meucorre_user). Isso previne IDOR — qualquer um não pode
// enviar comprovante para qualquer compra, só para a própria.
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

async function getLoggedUserEmail(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("meucorre_user")?.value;
    if (!token) return null;
    const secret = new TextEncoder().encode(process.env.USER_JWT_SECRET ?? process.env.ADMIN_JWT_SECRET ?? "");
    const { payload } = await jwtVerify(token, secret);
    return (payload.email as string) ?? null;
  } catch {
    return null;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // IDOR FIX: valida que o usuário logado é o dono da compra
  const loggedEmail = await getLoggedUserEmail();
  if (!loggedEmail) {
    return NextResponse.json({ error: "Login necessário" }, { status: 401 });
  }

  const sub = await prisma.subscription.findUnique({ where: { id } });
  if (!sub) {
    return NextResponse.json({ error: "Compra não encontrada" }, { status: 404 });
  }

  // Verifica propriedade — só o comprador pode enviar comprovante da própria compra
  if (sub.buyerEmail.toLowerCase() !== loggedEmail.toLowerCase()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  if (sub.status === "approved") {
    return NextResponse.json({ error: "Compra já aprovada" }, { status: 400 });
  }

  const body = (await req.json()) as { receipt: string };
  if (!body.receipt?.startsWith("data:image/")) {
    return NextResponse.json(
      { error: "Comprovante inválido (esperado imagem)" },
      { status: 400 },
    );
  }
  if (body.receipt.length > MAX_SIZE) {
    return NextResponse.json(
      { error: "Comprovante muito grande (máx 2MB)" },
      { status: 413 },
    );
  }

  await prisma.subscription.update({
    where: { id },
    data: { receiptUrl: body.receipt },
  });

  return NextResponse.json({ ok: true, status: "pending_review" });
}
