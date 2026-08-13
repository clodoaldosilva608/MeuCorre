// ===== 2FA TOTP (Time-based One-Time Password) =====
//
// Gera e verifica códigos TOTP para autenticação de dois fatores.
// Usa otplib v13 (API assíncrona).

import {
  generateSecret,
  generateURI,
  verify as verifyTokenAsync,
  generate as generateTokenAsync,
} from "otplib";

export function generateTOTPSecret(): string {
  return generateSecret();
}

export function generateTOTPURI(email: string, secret: string): string {
  return generateURI({
    issuer: "MeuCorre",
    label: email,
    secret,
  });
}

export async function verifyTOTP(token: string, secret: string): Promise<boolean> {
  try {
    const cleanToken = token.replace(/\D/g, "");
    if (cleanToken.length !== 6) return false;
    const result = await verifyTokenAsync({ token: cleanToken, secret });
    return result.valid === true;
  } catch {
    return false;
  }
}

export async function generateCurrentTOTP(secret: string): Promise<string> {
  return generateTokenAsync({ secret });
}
