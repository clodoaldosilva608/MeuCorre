import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { blacklistToken, isBlacklisted, generateJti } from "@/lib/token-blacklist";

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

// Hash de senha com bcrypt (12 rounds = ~300ms, recomendado por OWASP 2025).
// Antes era 10 rounds (~100ms) — adequado até ~2023 mas vulnerável a
// hardware moderno (GPU paralela quebra hashes mais rápido).
// 12 rounds mantém UX aceitável (login em <500ms) e levanta a barra.
// Custo de cracking: ~$200 em GPU/hora para 10 rounds, ~$1.600 para 12 rounds.
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verifica senha contra hash
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Gera JWT de sessão (válido 30 dias).
//
// P2-4: cada token recebe um jti (JWT ID) único para permitir blacklist.
// Se o token vazar, admin pode revogar imediatamente via blacklistToken().
export async function createUserToken(payload: {
  userId: string;
  email: string;
  isPro: boolean;
}): Promise<string> {
  const jti = generateJti();
  return new SignJWT({
    email: payload.email,
    isPro: payload.isPro,
  })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.userId)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

// Revoga um token JWT adicionando seu jti à blacklist.
// TTL = tempo até expiração natural do token (depois não precisa mais).
export async function revokeUserToken(token: string): Promise<void> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [ALG],
    });
    if (payload.jti && payload.exp) {
      await blacklistToken(payload.jti, payload.exp * 1000);
    }
  } catch {
    // Token inválido/expirado — não há nada para revogar
  }
}

// Verifica se há sessão de usuário válida E ativa no banco.
//
// SEGURANÇA: Além de verificar o JWT, consulta o banco para confirmar
// que o usuário existe E tem active = true. Isso garante que:
// - Admin pode desativar um usuário instantaneamente (banimento)
// - Token JWT válido mas de usuário desativado = rejeitado
// - Todas as rotas que usam getUserSession() automaticamente verificam active
//
// Performance: 1 query por request (findUnique por id, índice primary key).
// Aceitável pois a maioria das rotas já faria essa query ou similar.
export async function getUserSession(): Promise<UserPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SECRET_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [ALG],
    });

    const userPayload = payload as unknown as UserPayload;

    // P2-4: Verifica se o jti está na blacklist (token revogado)
    if (payload.jti && (await isBlacklisted(payload.jti))) {
      return null; // token revogado
    }

    // Verifica no banco se o usuário ainda está ativo
    // Se não estiver (banido/desativado), retorna null = não autorizado
    const user = await prisma.user.findUnique({
      where: { id: userPayload.sub },
      select: { active: true },
    });

    if (!user || !user.active) {
      // Usuário não existe ou foi desativado — sessão inválida
      return null;
    }

    return userPayload;
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
