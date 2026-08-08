import { NextResponse } from "next/server";

// POST /api/auth/logout
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("meucorre_user");
  return res;
}
