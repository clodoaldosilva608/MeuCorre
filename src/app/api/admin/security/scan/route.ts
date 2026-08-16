import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import {
  runSingleScan,
  runFullScan,
  type ScanCategory,
} from "@/lib/security-scanner";

// ===== API de Security Scan =====
//
// GET /api/admin/security/scan?category=secrets — roda um scan específico
// GET /api/admin/security/scan?full=true — roda scan completo (todas categorias)
//
// Requer admin auth.

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as ScanCategory | null;
  const full = searchParams.get("full") === "true";

  try {
    if (full) {
      const result = runFullScan();
      return NextResponse.json(result);
    }

    if (!category || !["secrets", "rls", "auth", "input", "ratelimit"].includes(category)) {
      return NextResponse.json(
        { error: "Parâmetro 'category' inválido. Use: secrets, rls, auth, input, ratelimit" },
        { status: 400 },
      );
    }

    const result = runSingleScan(category);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[security/scan] Erro:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao executar scan" },
      { status: 500 },
    );
  }
}
