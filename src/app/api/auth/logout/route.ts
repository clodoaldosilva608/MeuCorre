import { NextResponse } from "next/server";

// POST /api/auth/logout
// Limpa TODOS os cookies de sessão do MeuCorre.
// Antes, apenas `meucorre_user` era removido, mas o cookie `meucorre_checkout`
// (sessão de comprador na Kiwify) persistia e podia vazar dados entre contas.
// Usamos `path: "/"` + `maxAge: 0` para forçar a remoção imediata em todos
// os paths (res.cookies.delete às vezes não funciona se o cookie foi setado
// com path diferente).
export async function POST() {
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
