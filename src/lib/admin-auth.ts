import { cookies } from "next/headers";

// Verifica se a requisição tem o cookie de admin válido.
// Retorna true se autenticado, false caso contrário.
// MVP: o token é um base64 da senha + timestamp. Para produção, usar JWT assinado.
export async function isAdminAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("meucorre_admin")?.value;
  if (!token) return false;

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;

  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [pwd] = decoded.split(":");
    return pwd === expected;
  } catch {
    return false;
  }
}
