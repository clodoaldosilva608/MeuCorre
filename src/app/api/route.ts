import { NextResponse } from "next/server";

// PUBLIC ROUTE — Esta rota é intencionalmente pública (não requer admin auth)
export async function GET() {
  return NextResponse.json({ message: "Hello, world!" });
}