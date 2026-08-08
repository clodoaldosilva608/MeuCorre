import { NextResponse } from "next/server";

// POST /api/admin/logout
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("meucorre_admin");
  return res;
}
