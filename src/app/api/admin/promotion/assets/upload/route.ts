import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { isSupabaseConfigured, uploadToSupabase } from "@/lib/supabase-storage";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

function mimeFromName(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return null;
}

function safeFileName(name: string): string {
  const normalized = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  return normalized
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(-200);
}

/**
 * POST /api/admin/promotion/assets/upload
 *
 * Recebe uma imagem multipart/form-data, grava no bucket promotion-assets
 * e registra o metadado na tabela PromotionAsset. A rota é consumida tanto
 * pela aba Assets quanto pelo upload-batch de pacotes visuais.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
        needsConfig: true,
        storageBackend: "unknown",
        persistent: false,
      },
      { status: 503 },
    );
  }

  const formData = await req.formData();
  const value = formData.get("file");
  if (!(value instanceof File)) {
    return NextResponse.json({ error: "O campo file é obrigatório" }, { status: 400 });
  }

  const fileName = safeFileName(value.name || "upload.png");
  const mimeType = ALLOWED_MIME_TYPES.has(value.type)
    ? value.type
    : mimeFromName(fileName);

  if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: "Formato não suportado. Use PNG, JPG, WEBP ou GIF." },
      { status: 415 },
    );
  }

  if (value.size <= 0 || value.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "A imagem deve ter entre 1 byte e 10 MB." },
      { status: 413 },
    );
  }

  const bytes = Buffer.from(await value.arrayBuffer());
  const hash = createHash("sha256").update(bytes).digest("hex");

  const existing = await prisma.promotionAsset.findFirst({
    where: { OR: [{ hash }, { name: fileName }] },
  });
  if (existing) {
    return NextResponse.json({
      asset: existing,
      publicUrl: existing.publicUrl,
      storageBackend: "supabase",
      persistent: true,
      duplicate: true,
    });
  }

  const upload = await uploadToSupabase(bytes, fileName, mimeType);
  if (!upload.success || !upload.publicUrl || !upload.storageKey) {
    return NextResponse.json(
      { error: upload.error ?? "Falha ao gravar no Supabase Storage", needsConfig: false },
      { status: 502 },
    );
  }

  const asset = await prisma.promotionAsset.create({
    data: {
      name: sanitizeString(fileName, 200),
      storageKey: sanitizeString(upload.storageKey, 500),
      publicUrl: sanitizeString(upload.publicUrl, 2000),
      mimeType,
      fileSize: value.size,
      source: sanitizeString(String(formData.get("source") ?? "upload_admin"), 50),
      baseAssetName: sanitizeString(fileName.replace(/\.[^.]+$/, ""), 200),
      hash,
    },
  });

  return NextResponse.json({
    asset,
    publicUrl: asset.publicUrl,
    storageBackend: "supabase",
    persistent: true,
    duplicate: false,
  });
}
