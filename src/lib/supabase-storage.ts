import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ===== Supabase Storage Utility =====
//
// Gerencia upload de arquivos para Supabase Storage (bucket: promotion-assets).
// Fallback para filesystem local se Supabase não estiver configurado.
//
// Environment variables necessárias:
//   NEXT_PUBLIC_SUPABASE_URL — URL do projeto Supabase
//   SUPABASE_SERVICE_ROLE_KEY — service role key (server-side only, NUNCA expor no client)
//
// Para configurar:
// 1. Acesse https://supabase.com/dashboard/project/PROJECT_REF/settings/api
// 2. Copie "Project URL" → NEXT_PUBLIC_SUPABASE_URL
// 3. Copie "service_role" secret → SUPABASE_SERVICE_ROLE_KEY
// 4. Crie um bucket público chamado "promotion-assets" em Storage → New bucket
//    - Public bucket: YES
//    - Allowed MIME types: image/png, image/jpeg, image/webp, image/gif

let _client: SupabaseClient | null = null;
let _configured: boolean | null = null;

function getClient(): SupabaseClient | null {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    _configured = false;
    return null;
  }

  _client = createClient(url, key, {
    auth: { persistSession: false },
  });
  _configured = true;
  return _client;
}

export function isSupabaseConfigured(): boolean {
  if (_configured === null) {
    getClient();
  }
  return _configured ?? false;
}

const BUCKET_NAME = "promotion-assets";

export interface SupabaseUploadResult {
  success: boolean;
  publicUrl?: string;
  storageKey?: string;
  error?: string;
}

/**
 * Faz upload de um arquivo para Supabase Storage.
 * Retorna a URL pública do arquivo.
 *
 * @param file Buffer do arquivo
 * @param fileName Nome do arquivo (ex: M01_D01_P01_Instagram_vendas_ig_feed_1.png)
 * @param mimeType Tipo MIME (ex: image/png)
 * @returns Resultado do upload com publicUrl
 */
export async function uploadToSupabase(
  file: Buffer | Blob | ArrayBuffer,
  fileName: string,
  mimeType: string,
): Promise<SupabaseUploadResult> {
  const client = getClient();
  if (!client) {
    return {
      success: false,
      error: "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  // Sanitiza nome do arquivo
  const safeName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "_")
    .replace(/_+/g, "_");

  const storageKey = `promotion/${safeName}`;

  try {
    // Tenta fazer upload
    const { data, error } = await client
      .storage
      .from(BUCKET_NAME)
      .upload(storageKey, file, {
        contentType: mimeType,
        upsert: true, // sobrescreve se já existe
      });

    if (error) {
      // Se o bucket não existe, tenta criar
      if (error.message.includes("not found") || error.message.includes("Bucket")) {
        const { error: createError } = await client.storage.createBucket(BUCKET_NAME, {
          public: true,
          allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
          fileSizeLimit: "10MB",
        });

        if (createError) {
          return {
            success: false,
            error: `Bucket "${BUCKET_NAME}" não existe e não foi possível criar: ${createError.message}. Crie manualmente em Storage → New bucket (public: true).`,
          };
        }

        // Tenta upload novamente
        const { data: retryData, error: retryError } = await client
          .storage
          .from(BUCKET_NAME)
          .upload(storageKey, file, {
            contentType: mimeType,
            upsert: true,
          });

        if (retryError) {
          return { success: false, error: retryError.message };
        }

        // URL pública
        const { data: publicUrlData } = client
          .storage
          .from(BUCKET_NAME)
          .getPublicUrl(storageKey);

        return {
          success: true,
          publicUrl: publicUrlData.publicUrl,
          storageKey,
        };
      }

      return { success: false, error: error.message };
    }

    // Obtém URL pública
    const { data: publicUrlData } = client
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(storageKey);

    return {
      success: true,
      publicUrl: publicUrlData.publicUrl,
      storageKey,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Remove um arquivo do Supabase Storage.
 */
export async function deleteFromSupabase(storageKey: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  const { error } = await client
    .storage
    .from(BUCKET_NAME)
    .remove([storageKey]);

  return !error;
}

/**
 * Lista todos os arquivos no bucket.
 */
export async function listSupabaseFiles(prefix: string = "promotion/"): Promise<Array<{
  name: string;
  size: number;
  lastModified: string;
}>> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .storage
    .from(BUCKET_NAME)
    .list(prefix, { limit: 1000 });

  if (error || !data) return [];

  return data
    .filter((f) => f.name !== ".emptyFolderPlaceholder")
    .map((f) => ({
      name: f.name,
      size: f.metadata?.size ?? 0,
      lastModified: f.updated_at ?? "",
    }));
}
