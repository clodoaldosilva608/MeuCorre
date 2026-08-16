import { NextResponse } from "next/server";

// POST /api/admin/logout
// PUBLIC ROUTE — Esta rota é intencionalmente pública (login/logout/cron usam auth própria)
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("meucorre_admin");
  return res;
}
