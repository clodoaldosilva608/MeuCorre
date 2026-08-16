import { NextResponse } from "next/server";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";

// GET /api/admin/me
// Verifica se o admin está autenticado (apenas valida o JWT, sem tocar no banco).
// Retorna email + role do admin logado.
//
// Este endpoint é usado pelo admin/layout.tsx para verificar auth sem depender
// de queries Prisma (que podem falhar se o banco estiver indisponível).
// PUBLIC ROUTE — Esta rota é intencionalmente pública (não requer admin auth,
// ela MESMA verifica auth e retorna 401 se não estiver logado)
export async function GET() {
  const authed = await isAdminAuthed();
  if (!authed) {
    return NextResponse.json({ authed: false }, { status: 401 });
  }
  const email = await getAdminEmail();
  return NextResponse.json({ authed: true, email });
}
