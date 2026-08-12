import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { PROPOSAL_TEMPLATES } from "../route";

// GET /api/admin/proposals/templates — lista templates disponíveis
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const templates = Object.entries(PROPOSAL_TEMPLATES).map(([key, t]) => ({
    key,
    name: t.name,
    description: t.description,
    billingModel: t.billingModel ?? null,
  }));

  return NextResponse.json({ templates });
}
