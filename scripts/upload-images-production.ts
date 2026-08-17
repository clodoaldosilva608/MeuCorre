// ===== Upload em lote das 450 imagens do Pacote Visual para produção =====
//
// Faz login como admin e envia cada imagem via API.
// Idempotente: se a imagem já existe (mesmo nome), atualiza.
//
// Uso: npx tsx scripts/upload-images-production.ts

import * as fs from "node:fs";
import * as path from "node:path";

const BASE_URL = "https://meucorre.vercel.app";
const ADMIN_EMAIL = "clodoaldo608@gmail.com";
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD ?? "");
const IMAGES_DIR = path.resolve(process.cwd(), "tmp/pacote-visual-extracted");

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

function getMimeType(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    case ".gif": return "image/gif";
    default: return "application/octet-stream";
  }
}

async function login(): Promise<string> {
  console.log("🔐 Fazendo login...");
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login falhou: ${res.status}`);
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookies = setCookie.map((c: string) => c.split(";")[0]);
  console.log("   ✅ Login OK");
  return cookies.join("; ");
}

async function uploadFile(
  filePath: string,
  fileName: string,
  cookie: string,
): Promise<{ success: boolean; publicUrl?: string; error?: string; storageBackend?: string }> {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(fileName);
  const mimeType = getMimeType(ext);

  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  formData.append("file", blob, fileName);
  formData.append("name", fileName);
  formData.append("source", "upload_admin");

  // Tenta até 3 vezes com timeout de 30s cada
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(`${BASE_URL}/api/admin/promotion/assets/upload`, {
        method: "POST",
        headers: { Cookie: cookie },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          publicUrl: data.publicUrl,
          storageBackend: data.storageBackend,
        };
      } else {
        const err = await res.json().catch(() => ({}));
        // Se é erro 4xx (exceto 429), não adianta tentar de novo
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          return { success: false, error: err.error ?? `HTTP ${res.status}` };
        }
        // 429 ou 5xx — tenta de novo
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 2000 * attempt));
          continue;
        }
        return { success: false, error: err.error ?? `HTTP ${res.status}` };
      }
    } catch (err) {
      clearTimeout(timeout);
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
        continue;
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return { success: false, error: "Max retries exceeded" };
}

async function main() {
  console.log("=".repeat(60));
  console.log("📤 Upload do Pacote Visual — 450 imagens");
  console.log(`   Base URL: ${BASE_URL}`);
  console.log("=".repeat(60));

  // 1. Login
  const cookie = await login();

  // 2. Busca todas as imagens recursivamente
  console.log("\n📁 Buscando imagens...");
  const allFiles: Array<{ fullPath: string; fileName: string }> = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (IMAGE_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
        allFiles.push({ fullPath, fileName: entry.name });
      }
    }
  }

  walk(IMAGES_DIR);
  console.log(`   📦 ${allFiles.length} imagens encontradas`);

  // 3. Upload de cada imagem
  console.log("\n📤 Iniciando upload...\n");

  let success = 0;
  let failed = 0;
  let skipped = 0;
  const errors: Array<{ file: string; error: string }> = [];
  let storageBackend: string | null = null;
  const startTime = Date.now();

  for (let i = 0; i < allFiles.length; i++) {
    const { fullPath, fileName } = allFiles[i];
    const pct = Math.round(((i + 1) / allFiles.length) * 100);
    const elapsed = (Date.now() - startTime) / 1000;
    const avgTime = elapsed / (i + 1);
    const remaining = Math.round(avgTime * (allFiles.length - i - 1));
    const eta = `${Math.floor(remaining / 60)}m${String(remaining % 60).padStart(2, "0")}s`;

    process.stdout.write(`\r   [${i + 1}/${allFiles.length}] ${pct}% | ETA: ${eta} | ${fileName.slice(0, 50).padEnd(50)}`);

    const result = await uploadFile(fullPath, fileName, cookie);

    if (result.success) {
      success++;
      if (i === 0 && result.storageBackend) {
        storageBackend = result.storageBackend;
      }
    } else {
      if (result.error?.includes("already exists") || result.error?.includes("409")) {
        skipped++;
      } else {
        failed++;
        errors.push({ file: fileName, error: result.error ?? "unknown" });
      }
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n");
  console.log("=".repeat(60));
  console.log("📊 RELATÓRIO DE UPLOAD");
  console.log("=".repeat(60));
  console.log(`   ✅ Sucesso:   ${success}`);
  console.log(`   ♻️  Skip:      ${skipped} (já existiam)`);
  console.log(`   ❌ Falha:     ${failed}`);
  console.log(`   ⏱️  Tempo:     ${totalTime}s`);
  console.log(`   📁 Total:     ${allFiles.length} imagens`);
  if (storageBackend) {
    console.log(`   💾 Storage:   ${storageBackend}`);
  }
  console.log("=".repeat(60));

  if (errors.length > 0) {
    console.log("\nPrimeiros 10 erros:");
    for (const e of errors.slice(0, 10)) {
      console.log(`   ❌ ${e.file}: ${e.error}`);
    }
  }

  console.log("\n✅ Upload concluído!");
  console.log(`🔗 Valide: ${BASE_URL}/admin/divulgacao`);
}

main().catch((err) => {
  console.error("💥 Erro fatal:", err);
  process.exit(1);
});
