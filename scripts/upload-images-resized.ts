// ===== Redimensiona e faz upload das 450 imagens =====
//
// Redimensiona cada imagem para máximo 1080px (largura ou altura) antes do upload,
// para ficar abaixo do limite de 4.5 MB da Vercel serverless.
// Mantém qualidade visual adequada para redes sociais.
//
// Uso: npx tsx scripts/upload-images-resized.ts

import * as fs from "node:fs";
import * as path from "node:path";
import sharp from "sharp";

const BASE_URL = "https://meucorre.vercel.app";
const ADMIN_EMAIL = "clodoaldo608@gmail.com";
const ADMIN_PASSWORD = "Silva88677488@#";
const IMAGES_DIR = path.resolve(process.cwd(), "tmp/pacote-visual-extracted");
const MAX_DIMENSION = 1080; // px
const JPEG_QUALITY = 85;

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

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

async function resizeImage(filePath: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const metadata = await sharp(filePath).metadata();
    const { width, height } = metadata;

    // Se já é menor que 1080px, usa buffer original (mas converte PNG grandes para JPEG)
    if (width && height && width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
      const stats = fs.statSync(filePath);
      // Se PNG e > 1MB, converte para JPEG
      if (ext === ".png" && stats.size > 1024 * 1024) {
        const buf = await sharp(filePath)
          .flatten({ background: "#ffffff" }) // remove transparência
          .jpeg({ quality: JPEG_QUALITY })
          .toBuffer();
        return { buffer: buf, mimeType: "image/jpeg" };
      }
      // Senão usa original
      const buf = fs.readFileSync(filePath);
      return {
        buffer: buf,
        mimeType: ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg",
      };
    }

    // Redimensiona mantendo aspect ratio
    const resized = sharp(filePath).resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    });

    // Converte para JPEG se era PNG grande, senão mantém formato
    if (ext === ".png") {
      const buf = await resized
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer();
      return { buffer: buf, mimeType: "image/jpeg" };
    } else if (ext === ".webp") {
      const buf = await resized.webp({ quality: JPEG_QUALITY }).toBuffer();
      return { buffer: buf, mimeType: "image/webp" };
    } else {
      const buf = await resized.jpeg({ quality: JPEG_QUALITY }).toBuffer();
      return { buffer: buf, mimeType: "image/jpeg" };
    }
  } catch (err) {
    console.error(`\n   ⚠️  Erro ao redimensionar ${path.basename(filePath)}: ${err}`);
    return null;
  }
}

async function uploadFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  cookie: string,
): Promise<{ success: boolean; error?: string; storageBackend?: string }> {
  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  formData.append("file", blob, fileName);
  formData.append("name", fileName);
  formData.append("source", "upload_admin");

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
        return { success: true };
      } else {
        const err = await res.json().catch(() => ({}));
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          return { success: false, error: err.error ?? `HTTP ${res.status}` };
        }
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
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  return { success: false, error: "Max retries" };
}

async function main() {
  console.log("=".repeat(60));
  console.log("📤 Upload Redimensionado — 450 imagens (máx 1080px)");
  console.log("=".repeat(60));

  const cookie = await login();

  // Busca imagens
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

  console.log("\n📤 Iniciando upload (redimensionando antes)...\n");

  let success = 0;
  let failed = 0;
  const errors: Array<{ file: string; error: string }> = [];
  let storageBackend: string | null = null;
  const startTime = Date.now();
  let originalSizeTotal = 0;
  let resizedSizeTotal = 0;

  for (let i = 0; i < allFiles.length; i++) {
    const { fullPath, fileName } = allFiles[i];
    const pct = Math.round(((i + 1) / allFiles.length) * 100);
    const elapsed = (Date.now() - startTime) / 1000;
    const avgTime = elapsed / (i + 1);
    const remaining = Math.round(avgTime * (allFiles.length - i - 1));
    const eta = `${Math.floor(remaining / 60)}m${String(remaining % 60).padStart(2, "0")}s`;

    process.stdout.write(`\r   [${i + 1}/${allFiles.length}] ${pct}% | ETA: ${eta} | ${fileName.slice(0, 45).padEnd(45)}`);

    // Redimensiona
    const originalSize = fs.statSync(fullPath).size;
    originalSizeTotal += originalSize;

    const resized = await resizeImage(fullPath);
    if (!resized) {
      failed++;
      errors.push({ file: fileName, error: "resize failed" });
      continue;
    }

    resizedSizeTotal += resized.buffer.length;

    // Se redimensionado ficou maior que 4MB ainda, reduz mais
    let uploadBuffer = resized.buffer;
    let uploadMime = resized.mimeType;
    if (uploadBuffer.length > 4 * 1024 * 1024) {
      // Redimensiona para 800px e qualidade menor
      const smaller = await sharp(fullPath)
        .resize(800, 800, { fit: "inside", withoutEnlargement: true })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 75 })
        .toBuffer();
      uploadBuffer = smaller;
      uploadMime = "image/jpeg";
      resizedSizeTotal -= resized.buffer.length;
      resizedSizeTotal += smaller.length;
    }

    // Upload
    const result = await uploadFile(uploadBuffer, fileName, uploadMime, cookie);

    if (result.success) {
      success++;
      if (i === 0 && result.storageBackend) {
        storageBackend = result.storageBackend;
      }
    } else {
      failed++;
      errors.push({ file: fileName, error: result.error ?? "unknown" });
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const sizeReduction = originalSizeTotal > 0
    ? Math.round((1 - resizedSizeTotal / originalSizeTotal) * 100)
    : 0;

  console.log("\n");
  console.log("=".repeat(60));
  console.log("📊 RELATÓRIO DE UPLOAD");
  console.log("=".repeat(60));
  console.log(`   ✅ Sucesso:   ${success}`);
  console.log(`   ❌ Falha:     ${failed}`);
  console.log(`   ⏱️  Tempo:     ${totalTime}s`);
  console.log(`   📁 Total:     ${allFiles.length} imagens`);
  console.log(`   📐 Redim:     ${(originalSizeTotal / 1024 / 1024).toFixed(1)} MB → ${(resizedSizeTotal / 1024 / 1024).toFixed(1)} MB (${sizeReduction}% redução)`);
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

  console.log(`\n✅ Upload concluído! Valide: ${BASE_URL}/admin/divulgacao`);
}

main().catch((err) => {
  console.error("💥 Erro fatal:", err);
  process.exit(1);
});
