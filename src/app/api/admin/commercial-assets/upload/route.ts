import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";

// POST /api/admin/commercial-assets/upload
// Multipart form-data:
//   - file: File (PDF, PNG, JPG, WEBP, MP4 — máx 50 MB)
//   - type: media_kit | case | contract | presentation | one_pager | pricing_table | video | other
//   - name (opcional)
//   - description (opcional)
//   - version (opcional, ex: "v1.0")
//   - tags (opcional)
//
// Salva em public/commercial/ (em produção: Vercel Blob ou CDN).
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

  const type = (formData.get("type") as string) || "other";
  const validTypes = new Set([
    "media_kit", "case", "contract", "presentation",
    "one_pager", "pricing_table", "video", "other",
  ]);
  if (!validTypes.has(type)) {
    return NextResponse.json(
      { error: `Tipo inválido: ${type}` },
      { status: 400 },
    );
  }

  // Valida tipo MIME
  const allowedMime = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "video/mp4",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    "application/vnd.ms-powerpoint", // .ppt
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/msword", // .doc
  ];
  if (!allowedMime.includes(file.type)) {
    return NextResponse.json(
      { error: `Tipo MIME não suportado: ${file.type}. Use PDF, imagem, vídeo MP4 ou Office.` },
      { status: 400 },
    );
  }

  // Valida tamanho (50 MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(1)} MB. Máximo: 50 MB.` },
      { status: 400 },
    );
  }

  // Nome do arquivo sanitizado
  const rawName = (formData.get("name") as string) || file.name;
  const safeName = rawName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 150);

  if (!safeName) {
    return NextResponse.json(
      { error: "Nome do arquivo inválido após sanitização" },
      { status: 400 },
    );
  }

  // Pasta destino
  const uploadDir = path.resolve(process.cwd(), "public", "commercial");
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

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(finalPath, buffer);

  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  const publicUrl = `/commercial/${finalName}`;
  const storageKey = `commercial/${finalName}`;

  const description = (formData.get("description") as string) || null;
  const version = (formData.get("version") as string) || null;
  const tags = (formData.get("tags") as string) || null;

  // Verifica se já existe asset com este nome
  const existing = await prisma.commercialAsset.findFirst({
    where: { name: finalName },
  });

  const asset = existing
    ? await prisma.commercialAsset.update({
        where: { id: existing.id },
        data: {
          type,
          storageKey,
          publicUrl,
          mimeType: file.type,
          fileSize: file.size,
          version: sanitizeString(version ?? "", 50) || null,
          description: sanitizeString(description ?? "", 500) || null,
          tags: sanitizeString(tags ?? "", 300) || null,
          active: true,
        },
      })
    : await prisma.commercialAsset.create({
        data: {
          type,
          name: finalName,
          description: sanitizeString(description ?? "", 500) || null,
          storageKey,
          publicUrl,
          mimeType: file.type,
          fileSize: file.size,
          version: sanitizeString(version ?? "", 50) || null,
          tags: sanitizeString(tags ?? "", 300) || null,
          active: true,
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
