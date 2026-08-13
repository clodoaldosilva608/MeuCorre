import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { verifyTOTP } from "@/lib/totp";

// POST /api/admin/2fa/disable
// Desativa 2FA. Body: { token: "123456" } (token atual para confirmar)
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const adminEmail = await getAdminEmail();
  if (!adminEmail) {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const token = body.token as string;

  if (!token) {
    return NextResponse.json(
      { error: "Token TOTP é obrigatório para desativar 2FA" },
      { status: 400 },
    );
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: adminEmail.toLowerCase() },
  });

  if (!admin || !admin.totpEnabled || !admin.totpSecret) {
    return NextResponse.json(
      { error: "2FA não está ativo" },
      { status: 400 },
    );
  }

  const valid = await verifyTOTP(token, admin.totpSecret);
  if (!valid) {
    return NextResponse.json(
      { error: "Token inválido" },
      { status: 401 },
    );
  }

  // Desativa 2FA e limpa secret
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { totpEnabled: false, totpSecret: null },
  });

  return NextResponse.json({
    ok: true,
    message: "2FA desativado.",
  });
}

// GET /api/admin/2fa/disable — retorna status do 2FA
export async function GET(_req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const adminEmail = await getAdminEmail();
  if (!adminEmail) {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: adminEmail.toLowerCase() },
    select: { totpEnabled: true, totpSecret: true },
  });

  if (!admin) {
    // Admin via env var
    return NextResponse.json({
      totpEnabled: false,
      canEnable: false,
      message: "Admin via env var não suporta 2FA. Crie uma conta AdminUser.",
    });
  }

  return NextResponse.json({
    totpEnabled: admin.totpEnabled,
    hasSecret: !!admin.totpSecret,
    canEnable: true,
  });
}
