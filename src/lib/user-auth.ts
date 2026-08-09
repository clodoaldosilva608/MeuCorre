import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import bcrypt from "bcryptjs";

// ===== Auth de usuários entregadores (não admin) =====
//
// Sistema separado do admin auth. Usuários entregadores podem:
// - Cadastrar-se (/register)
// - Logar (/login)
// - Recuperar senha (/recuperar-senha)
// - Ter status PRO vinculado à conta (não só ao dispositivo)

const SECRET_NAME = "meucorre_user";
const ALG = "HS256";

function getSecret(): Uint8Array {
  // CRÍTICO: NÃO usar ADMIN_JWT_SECRET como fallback.
  // Se USER_JWT_SECRET não estiver configurado, os tokens de usuário
  // seriam assinados com a chave master do admin — quebra o princípio
  // de separação de chaves e cria risco de escalonamento de privilégios.
  // A env var USER_JWT_SECRET é OBRIGATÓRIA em produção.
  const secret = process.env.USER_JWT_SECRET;
  if (!secret) {
    throw new Error(
      "USER_JWT_SECRET deve estar configurado nas env vars (não use ADMIN_JWT_SECRET como fallback)",
    );
  }
  return new TextEncoder().encode(secret);
}

export interface UserPayload {
  sub: string; // user ID
  email: string;
  isPro: boolean;
  iat?: number;
  exp?: number;
}

// Hash de senha com bcrypt (10 rounds = ~100ms, seguro contra rainbow tables)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verifica senha contra hash
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Gera JWT de sessão (válido 30 dias)
export async function createUserToken(payload: {
  userId: string;
  email: string;
  isPro: boolean;
}): Promise<string> {
  return new SignJWT({
    email: payload.email,
    isPro: payload.isPro,
  })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

// Verifica se há sessão de usuário válida
export async function getUserSession(): Promise<UserPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SECRET_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [ALG],
    });

    return payload as unknown as UserPayload;
  } catch {
    return null;
  }
}

// Verifica se o usuário está logado (boolean)
export async function isUserAuthed(): Promise<boolean> {
  return (await getUserSession()) !== null;
}

// Gera token de reset de senha (válido 1h)
export async function createPasswordResetToken(): Promise<string> {
  return new SignJWT({ purpose: "password_reset" })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getSecret());
}
