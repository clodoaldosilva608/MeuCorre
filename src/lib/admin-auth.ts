import { cookies } from "next/headers";

// Verifica se a requisição tem o cookie de admin válido.
// Token = base64(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}:${timestamp}`)
export async function isAdminAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("meucorre_admin")?.value;
  if (!token) return false;

  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedEmail || !expectedPassword) return false;

  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [email, pwd] = decoded.split(":");
    return email === expectedEmail && pwd === expectedPassword;
  } catch {
    return false;
  }
}
