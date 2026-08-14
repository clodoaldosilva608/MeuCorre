import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { uploadToSupabase, isSupabaseConfigured } from "@/lib/supabase-storage";

// POST /api/admin/promotion/assets/upload
// Faz upload de uma imagem para Supabase Storage e cria o registro no banco.
//
// Body: multipart/form-data com:
//   - file: arquivo de imagem (png, jpg, webp, gif)
//   - altText?: texto alternativo (opcional)
//   - source?: origem (ex: upload_admin)
//   - tags?: tags separadas por vírgula (opcional)
//
// Retorna: { asset } com o registro criado

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Upload desabilitado. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.",
        needsConfig: true,
      },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Body deve ser multipart/form-data" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Arquivo não fornecido (campo 'file')" },
      { status: 400 },
    );
  }

  // Valida tipo
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        error: `Tipo de arquivo não suportado: ${file.type}. Aceitos: ${ALLOWED_MIME_TYPES.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // Valida tamanho
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo: 10MB` },
      { status: 400 },
    );
  }

  // Campos opcionais
  const altText = formData.get("altText")?.toString().trim() || null;
  const source = formData.get("source")?.toString().trim() || "upload_admin";
  const tags = formData.get("tags")?.toString().trim() || null;

  // Gera nome único do arquivo
  const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  const safeName = `upload_${timestamp}_${originalName}`.toLowerCase();

  try {
    // Converte File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Faz upload para Supabase
    const uploadResult = await uploadToSupabase(
      arrayBuffer,
      safeName,
      file.type,
    );

    if (!uploadResult.success || !uploadResult.publicUrl) {
      return NextResponse.json(
        { error: uploadResult.error || "Erro no upload" },
        { status: 500 },
      );
    }

    // Lê dimensões da imagem (opcional — só funciona com image-size instalado)
    let width: number | null = null;
    let height: number | null = null;
    // image-size é opcional — se não estiver instalado, fica null
    try {
      // @ts-expect-error — image-size é opcional, pode não estar instalado
      const imageSizeMode = await import("image-size").catch(() => null);
      if (imageSizeMode) {
        const sizeOf =
          (imageSizeMode as { default?: unknown }).default ?? imageSizeMode;
        if (typeof sizeOf === "function") {
          const dimensions = (sizeOf as (buf: Buffer) => { width?: number; height?: number })(
            Buffer.from(arrayBuffer),
          );
          width = dimensions.width ?? null;
          height = dimensions.height ?? null;
        }
      }
    } catch {
      // image-size não disponível — tudo bem, fica null
    }

    // Cria registro no banco
    const asset = await prisma.promotionAsset.create({
      data: {
        name: safeName,
        storageKey: uploadResult.storageKey ?? `promotion/${safeName}`,
        publicUrl: uploadResult.publicUrl,
        mimeType: file.type,
        width,
        height,
        fileSize: file.size,
        altText: altText ? sanitizeString(altText, 300) : null,
        source,
        baseAssetName: originalName,
        tags: tags ? sanitizeString(tags, 200) : null,
      },
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json(
      { error: `Erro ao processar upload: ${err.message}` },
      { status: 500 },
    );
  }
}
