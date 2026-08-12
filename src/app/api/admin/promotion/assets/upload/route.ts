import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";

// POST /api/admin/promotion/assets/upload
// Faz upload de uma única imagem para public/promotion/ e registra no banco.
// Multipart form-data:
//   - file: File (PNG, JPG, WEBP, GIF — máx 10 MB)
//   - name (opcional): nome do asset (default: nome do arquivo)
//   - baseAssetName (opcional): nome do arquivo-base aprovado
//   - altText (opcional)
//   - tags (opcional)
//   - source (opcional, default: "upload_admin")
//
// O arquivo é salvo em public/promotion/<filename> e a publicUrl é /promotion/<filename>.
// Em produção, recomenda-se substituir por Vercel Blob ou CDN.
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

  // Pasta destino: public/promotion/
  const uploadDir = path.resolve(process.cwd(), "public", "promotion");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fullPath = path.join(uploadDir, safeName);
  // Evita sobrescrever — adiciona sufixo se já existir
  let finalName = safeName;
  let finalPath = fullPath;
  if (fs.existsSync(fullPath)) {
    const ext = path.extname(safeName);
    const base = path.basename(safeName, ext);
    finalName = `${base}_${Date.now()}${ext}`;
    finalPath = path.join(uploadDir, finalName);
  }

  // Escreve o arquivo
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(finalPath, buffer);

  // Calcula hash
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");

  // Calcula dimensões (apenas para imagens — sem sharp para evitar dep pesada)
  // Em produção, use sharp: sharp(buffer).metadata()
  let width: number | null = null;
  let height: number | null = null;
  // PNG: header tem width/height em bytes 16-23
  if (file.type === "image/png" && buffer.length >= 24) {
    width = buffer.readUInt32BE(16);
    height = buffer.readUInt32BE(20);
  }

  const publicUrl = `/promotion/${finalName}`;
  const storageKey = `promotion/${finalName}`;

  // Verifica se já existe asset com este nome — se sim, atualiza URL
  const existing = await prisma.promotionAsset.findFirst({
    where: { name: finalName },
  });

  const baseAssetName = (formData.get("baseAssetName") as string) || null;
  const altText =
    (formData.get("altText") as string) || path.basename(finalName, path.extname(finalName));
  const tags = (formData.get("tags") as string) || null;
  const source = (formData.get("source") as string) || "upload_admin";

  const asset = existing
    ? await prisma.promotionAsset.update({
        where: { id: existing.id },
        data: {
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
        },
      })
    : await prisma.promotionAsset.create({
        data: {
          name: finalName,
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
        },
      });

  return NextResponse.json(
    {
      asset,
      uploaded: true,
      fileName: finalName,
      publicUrl,
      fileSize: file.size,
      hash,
    },
    { status: existing ? 200 : 201 },
  );
}
