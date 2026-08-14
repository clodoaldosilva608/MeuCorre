import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";

// Rota temporária pra extrair info do Supabase da DATABASE_URL
// (apenas pra configuração — pode ser removida depois)

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const dbUrl = process.env.DATABASE_URL || "";
  const directUrl = process.env.DIRECT_URL || "";

  // Extrai project ref da URL do Supabase
  // Formato: postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
  const match = dbUrl.match(/postgres\.([a-zA-Z0-9]+):/);
  const projectRef = match?.[1] ?? "NÃO_ENCONTRADO";

  // Extrai região
  const regionMatch = dbUrl.match(/aws-0-([a-z-]+)\.pooler/);
  const region = regionMatch?.[1] ?? "NÃO_ENCONTRADO";

  // URL pública do projeto
  const supabaseUrl = `https://${projectRef}.supabase.co`;

  return NextResponse.json({
    projectRef,
    region,
    supabaseUrl,
    dbUrlPrefix: dbUrl.split(":")[0] + ":" + dbUrl.split(":")[1] + ":" + dbUrl.split(":")[2],
    hasDirectUrl: !!directUrl,
    note: "Acesse https://supabase.com/dashboard/project/" + projectRef + "/settings/api para pegar a service_role key",
  });
}
