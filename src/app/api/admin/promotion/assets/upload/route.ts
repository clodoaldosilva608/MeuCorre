import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { uploadToSupabase, isSupabaseConfigured } from "@/lib/supabase-storage";

// POST /api/admin/promotion/assets/upload
// Faz upload de uma única imagem.
//
// Estratégia de armazenamento (automática):
// 1. Se Supabase Storage estiver configurado → upload para Supabase (CDN, persistente)
// 2. Senão → salva em public/promotion/ (filesystem local — não persiste em serverless)
//
// Multipart form-data:
//   - file: File (PNG, JPG, WEBP, GIF — máx 10 MB)
//   - name (opcional): nome do asset (default: nome do arquivo)
//   - baseAssetName (opcional)
//   - altText (opcional)
//   - tags (opcional)
//   - source (opcional, default: "upload_admin")
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Esperado multipart/form-data" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Arquivo não encontrado no form (campo 'file')" },
      { status: 400 },
    );
  }

  // Valida tipo MIME
  const allowedMime = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
  ];
  if (!allowedMime.includes(file.type)) {
    return NextResponse.json(
      { error: `Tipo MIME não suportado: ${file.type}. Use PNG, JPG, WEBP ou GIF.` },
      { status: 400 },
    );
  }

  // Valida tamanho (10 MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(1)} MB. Máximo: 10 MB.` },
      { status: 400 },
    );
  }

  // Nome do arquivo sanitizado
  const rawName = (formData.get("name") as string) || file.name;
  const safeName = rawName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 200);

  if (!safeName) {
    return NextResponse.json(
      { error: "Nome do arquivo inválido após sanitização" },
      { status: 400 },
    );
  }

  // Buffer do arquivo
  const buffer = Buffer.from(await file.arrayBuffer());

  // Calcula hash
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");

  // Extrai dimensões PNG
  let width: number | null = null;
  let height: number | null = null;
  if (file.type === "image/png" && buffer.length >= 24) {
    width = buffer.readUInt32BE(16);
    height = buffer.readUInt32BE(20);
  }

  const baseAssetName = (formData.get("baseAssetName") as string) || null;
  const altText =
    (formData.get("altText") as string) || path.basename(safeName, path.extname(safeName));
  const tags = (formData.get("tags") as string) || null;
  const source = (formData.get("source") as string) || "upload_admin";

  // === Estratégia de armazenamento ===
  let publicUrl: string;
  let storageKey: string;
  let storageBackend: "supabase" | "local";

  if (isSupabaseConfigured()) {
    // === Supabase Storage ===
    const supabaseResult = await uploadToSupabase(buffer, safeName, file.type);
    if (supabaseResult.success && supabaseResult.publicUrl) {
      publicUrl = supabaseResult.publicUrl;
      storageKey = supabaseResult.storageKey ?? `promotion/${safeName}`;
      storageBackend = "supabase";
    } else {
      return NextResponse.json(
        {
          error: `Erro no upload para Supabase: ${supabaseResult.error}`,
          hint: "Verifique se o bucket 'promotion-assets' existe e é público.",
        },
        { status: 500 },
      );
    }
  } else {
    // === Fallback: filesystem local ===
    // ATENÇÃO: Em Vercel serverless, o filesystem NÃO persiste entre deploys.
    // Use Supabase Storage para persistência real.
    const uploadDir = path.resolve(process.cwd(), "public", "promotion");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    let finalName = safeName;
    let finalPath = path.join(uploadDir, safeName);
    if (fs.existsSync(finalPath)) {
      const ext = path.extname(safeName);
      const base = path.basename(safeName, ext);
      finalName = `${base}_${Date.now()}${ext}`;
      finalPath = path.join(uploadDir, finalName);
    }

    fs.writeFileSync(finalPath, buffer);

    publicUrl = `/promotion/${finalName}`;
    storageKey = `promotion/${finalName}`;
    storageBackend = "local";
  }

  // Verifica se já existe asset com este nome — se sim, atualiza URL
  const existing = await prisma.promotionAsset.findFirst({
    where: { name: safeName },
  });

  const assetData = {
    storageKey,
    publicUrl,
    mimeType: file.type,
    width,
    height,
    fileSize: file.size,
    altText: sanitizeString(altText, 300) || null,
    source,
    baseAssetName: sanitizeString(baseAssetName ?? "", 200) || null,
    tags: sanitizeString(tags ?? "", 500) || null,
    hash,
  };

  const asset = existing
    ? await prisma.promotionAsset.update({
        where: { id: existing.id },
        data: assetData,
      })
    : await prisma.promotionAsset.create({
        data: {
          name: safeName,
          ...assetData,
        },
      });

  return NextResponse.json(
    {
      asset,
      uploaded: true,
      fileName: safeName,
      publicUrl,
      fileSize: file.size,
      hash,
      storageBackend,
      persistent: storageBackend === "supabase",
    },
    { status: existing ? 200 : 201 },
  );
}
