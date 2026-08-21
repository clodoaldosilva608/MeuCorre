import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revokeUserToken } from "@/lib/user-auth";

// POST /api/auth/logout
// Limpa TODOS os cookies de sessão do MeuCorre.
// Antes, apenas `meucorre_user` era removido, mas o cookie `meucorre_checkout`
// (sessão de comprador na Kiwify) persistia e podia vazar dados entre contas.
// Usamos `path: "/"` + `maxAge: 0` para forçar a remoção imediata em todos
// os paths (res.cookies.delete às vezes não funciona se o cookie foi setado
// com path diferente).
//
// P2-4: Também revoga o token JWT adicionando jti à blacklist.
// Sem isso, token vazado continua válido por 30 dias mesmo após logout.
export async function POST() {
  // P2-4: Antes de limpar o cookie, revoga o token na blacklist
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("meucorre_user")?.value;
    if (token) {
      await revokeUserToken(token);
    }
  } catch {
    // Ignora erros — logout ainda limpa cookies abaixo
  }

  const res = NextResponse.json({ ok: true });
  // Força expiração imediata (mais confiável que .delete em alguns browsers)
  res.cookies.set("meucorre_user", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
  res.cookies.set("meucorre_checkout", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
  // Também chama delete para garantir (alguns runtimes ignoram maxAge: 0)
  res.cookies.delete("meucorre_user");
  res.cookies.delete("meucorre_checkout");
  return res;
}
