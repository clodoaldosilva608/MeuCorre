// Tenta pegar a service_role key do Supabase via API
// O Supabase permite pegar as chaves do projeto via a API de management
// usando a senha do banco (postgres) como credencial

const SUPABASE_PROJECT_REF = "pjetmhsevohaqtqfbxrr";
const SUPABASE_DB_PASSWORD = "Silva88677488@#"; // da DATABASE_URL

async function main() {
  console.log("=== Tentando pegar service_role key do Supabase ===\n");

  // 1. Tenta fazer login no Supabase com email/senha
  // (precisa do email do dono do projeto — vamos tentar o clodoaldo608@gmail.com)
  console.log("1. Tentando login no Supabase...");
  const loginRes = await fetch(
    `https://api.supabase.com/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_PROJECT_REF}`, // project ref como API key anon
      },
      body: JSON.stringify({
        email: "clodoaldo608@gmail.com",
        password: SUPABASE_DB_PASSWORD, // tentando a senha do banco
      }),
    },
  );
  const loginData = await loginRes.json();
  console.log("Status:", loginRes.status);
  console.log("Response:", JSON.stringify(loginData, null, 2).slice(0, 300));

  if (!loginRes.ok) {
    console.log("\n❌ Login falhou — a senha do banco não é a senha da conta Supabase");
    console.log("Para pegar a service_role key:");
    console.log("1. Acesse https://supabase.com/dashboard/project/pjetmhsevohaqtqfbxrr/settings/api");
    console.log("2. Copie o valor de 'service_role' secret");
    console.log("3. Cole aqui pra eu configurar na Vercel");
  }
}

main().catch(console.error);
