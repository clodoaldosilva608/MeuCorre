import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

// ===== Admin auth com JWT assinado (HMAC-SHA256) =====
//
// Substitui o base64 reversível anterior.
// O token agora é um JWT assinado com ADMIN_JWT_SECRET (env var).
// Se o cookie vazar, atacante NÃO consegue extrair a senha.

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
  role: "admin";
  iat?: number;
  exp?: number;
}

// Gera um JWT assinado (válida por 7 dias)
export async function createAdminToken(email: string): Promise<string> {
  return new SignJWT({ role: "admin" })
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

    // Verifica se o subject bate com o ADMIN_EMAIL configurado
    const adminPayload = payload as unknown as AdminPayload;
    const expectedEmail = process.env.ADMIN_EMAIL;
    if (!expectedEmail) return false;

    return (
      adminPayload.sub === expectedEmail.toLowerCase() &&
      adminPayload.role === "admin"
    );
  } catch {
    return false;
  }
}
