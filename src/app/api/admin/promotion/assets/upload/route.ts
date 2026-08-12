import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";

// POST /api/admin/promotion/assets/upload
// Faz upload de uma única imagem para public/promotion/ e registra no banco.
// Em produção (Vercel), as imagens são perdidas a cada deploy.
// Para persistência, use a página de upload que extrai .tar.gz no navegador.
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err) {
    return NextResponse.json(
      { error: "Esperado multipart/form-data", detail: err instanceof Error ? err.message : String(err) },
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

  // Pasta destino: public/promotion/
  // NOTA: Em Vercel serverless, o filesystem é read-only após build.
  // Apenas /tmp é gravável, mas não persiste entre invocações.
  // Esta implementação usa /tmp como fallback — para persistência real,
  // configure Supabase Storage ou Vercel Blob.
  const isVercel = !!process.env.VERCEL;
  const uploadDir = isVercel
    ? path.resolve("/tmp", "promotion")
    : path.resolve(process.cwd(), "public", "promotion");

  if (!fs.existsSync(uploadDir)) {
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
    } catch {
      return NextResponse.json(
        {
          error: "Não foi possível criar diretório de upload. Configure Supabase Storage ou Vercel Blob para persistência.",
        },
        { status: 500 },
      );
    }
  }

  let finalName = safeName;
  let finalPath = path.join(uploadDir, safeName);
  if (fs.existsSync(finalPath)) {
    const ext = path.extname(safeName);
    const base = path.basename(safeName, ext);
    finalName = `${base}_${Date.now()}${ext}`;
    finalPath = path.join(uploadDir, finalName);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    fs.writeFileSync(finalPath, buffer);
  } catch {
    return NextResponse.json(
      {
        error: "Erro ao salvar arquivo. Em Vercel serverless, o filesystem é read-only. Configure Supabase Storage.",
      },
      { status: 500 },
    );
  }

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

  // Em Vercel, a URL pública aponta para /tmp (não persiste) — apenas para desenvolvimento
  // Em produção, o ideal é que a imagem vá para Supabase Storage e a URL seja a do Supabase
  const publicUrl = isVercel
    ? null // não há URL pública em /tmp
    : `/promotion/${finalName}`;
  const storageKey = `promotion/${finalName}`;

  // Verifica se já existe asset com este nome — se sim, atualiza URL
  let existing;
  try {
    existing = await prisma.promotionAsset.findFirst({
      where: { name: safeName },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Erro ao buscar asset existente", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

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

  let asset;
  try {
    asset = existing
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
  } catch (err) {
    return NextResponse.json(
      { error: "Erro ao salvar no banco", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      asset,
      uploaded: true,
      fileName: safeName,
      publicUrl,
      fileSize: file.size,
      hash,
      storageBackend: "local",
      persistent: false,
    },
    { status: existing ? 200 : 201 },
  );
}
