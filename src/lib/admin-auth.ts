import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// ===== Admin auth com JWT assinado (HMAC-SHA256) =====
//
// Suporta 2 modos de autenticação (compatibilidade):
// 1. MULTI-ADMIN (novo): tabela AdminUser no banco, múltiplos admins com roles
// 2. LEGACY (fallback): env var ADMIN_EMAIL + ADMIN_PASSWORD (single admin)
//
// O modo legacy ainda funciona para não quebrar deploys existentes.
// Novos admins devem ser criados via tabela AdminUser.

const SECRET_NAME = "meucorre_admin";
const ALG = "HS256";

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET deve estar configurado nas env vars");
  }
  return new TextEncoder().encode(secret);
}

interface AdminPayload {
  sub: string; // email do admin
  role: "admin" | "super_admin";
  source: "db" | "env"; // db = AdminUser table, env = ADMIN_EMAIL fallback
  iat?: number;
  exp?: number;
}

// Gera um JWT assinado (válida por 7 dias)
export async function createAdminToken(
  email: string,
  role: "admin" | "super_admin" = "admin",
  source: "db" | "env" = "env",
): Promise<string> {
  return new SignJWT({ role, source })
    .setProtectedHeader({ alg: ALG })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

// Verifica se a requisição tem um JWT admin válido
export async function isAdminAuthed(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SECRET_NAME)?.value;
    if (!token) return false;

    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [ALG],
    });

    const adminPayload = payload as unknown as AdminPayload;
    if (adminPayload.role !== "admin" && adminPayload.role !== "super_admin") {
      return false;
    }

    // Modo DB: verifica se admin ainda existe e está ativo
    if (adminPayload.source === "db") {
      try {
        const admin = await prisma.adminUser.findUnique({
          where: { email: adminPayload.sub },
          select: { active: true },
        });
        return admin?.active === true;
      } catch {
        // Tabela AdminUser pode não existir ainda — falha seguro (não autoriza)
        return false;
      }
    }

    // Modo ENV (legacy): verifica contra ADMIN_EMAIL
    const expectedEmail = process.env.ADMIN_EMAIL;
    if (!expectedEmail) return false;
    return adminPayload.sub === expectedEmail.toLowerCase();
  } catch {
    return false;
  }
}

// Retorna email do admin logado (para audit log)
export async function getAdminEmail(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SECRET_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [ALG],
    });

    const adminPayload = payload as unknown as AdminPayload;
    return adminPayload.sub ?? null;
  } catch {
    return null;
  }
}

// Verifica senha do admin (para login via tabela AdminUser)
export async function verifyAdminPassword(
  email: string,
  password: string,
): Promise<{ valid: boolean; role?: "admin" | "super_admin" }> {
  // 1. Tenta tabela AdminUser primeiro (se existir no banco)
  try {
    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (admin && admin.active) {
      const valid = await bcrypt.compare(password, admin.passwordHash);
      if (valid) {
        // Atualiza lastLoginAt
        await prisma.adminUser.update({
          where: { id: admin.id },
          data: { lastLoginAt: new Date() },
        });
        return { valid: true, role: admin.role as "admin" | "super_admin" };
      }
    }
  } catch {
    // Tabela AdminUser pode não existir ainda (antes de prisma db push).
    // Ignora erro e faz fallback para env vars.
  }

  // 2. Fallback: env var ADMIN_EMAIL + ADMIN_PASSWORD (legacy)
  const envEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const envPassword = process.env.ADMIN_PASSWORD;
  if (envEmail && envPassword && email.toLowerCase() === envEmail) {
    if (password === envPassword) {
      return { valid: true, role: "super_admin" };
    }
  }

  return { valid: false };
}
