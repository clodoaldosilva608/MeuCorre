import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { generateTOTPSecret, generateTOTPURI } from "@/lib/totp";
import { validateOrError } from "@/lib/zod-schemas";
import { z } from "zod";

// POST /api/admin/2fa/setup
// Gera um secret TOTP e retorna a URI para QR Code.
// O admin escanea o QR Code com Google Authenticator/Authy.
// Depois chama /api/admin/2fa/verify com um token para confirmar.
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const adminEmail = await getAdminEmail();
  if (!adminEmail) {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }

  // Verifica se 2FA já está ativo
  const admin = await prisma.adminUser.findUnique({
    where: { email: adminEmail.toLowerCase() },
  });

  if (admin?.totpEnabled) {
    return NextResponse.json(
      { error: "2FA já está ativo. Desative antes de reconfigurar." },
      { status: 400 },
    );
  }

  // Gera novo secret
  const secret = generateTOTPSecret();
  const uri = generateTOTPURI(adminEmail, secret);

  // Salva o secret no banco (mas não ativa ainda — ativa só após verify)
  if (admin) {
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { totpSecret: secret },
    });
  } else {
    // Admin via env var (legacy) — não pode usar 2FA
    return NextResponse.json(
      { error: "2FA requer conta no banco (AdminUser). Admin via env var não suporta 2FA." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    secret,
    uri,
    qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`,
    message: "Escaneie o QR Code com Google Authenticator. Depois chame /api/admin/2fa/verify com o token de 6 dígitos.",
  });
}
