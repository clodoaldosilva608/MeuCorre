import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { verifyTOTP } from "@/lib/totp";

// POST /api/admin/2fa/verify
// Verifica o token TOTP de 6 dígitos e ativa o 2FA.
// Body: { token: "123456" }
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

  if (!token || token.length !== 6) {
    return NextResponse.json(
      { error: "Token deve ter 6 dígitos" },
      { status: 400 },
    );
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: adminEmail.toLowerCase() },
  });

  if (!admin || !admin.totpSecret) {
    return NextResponse.json(
      { error: "2FA não foi configurado. Chame /api/admin/2fa/setup primeiro." },
      { status: 400 },
    );
  }

  const valid = await verifyTOTP(token, admin.totpSecret);
  if (!valid) {
    return NextResponse.json(
      { error: "Token inválido. Tente novamente." },
      { status: 401 },
    );
  }

  // Ativa 2FA
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { totpEnabled: true },
  });

  return NextResponse.json({
    ok: true,
    message: "2FA ativado com sucesso! Próximos logins exigirão o código TOTP.",
  });
}
