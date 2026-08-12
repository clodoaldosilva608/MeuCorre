// ===== Parser de arquivos .tar.gz no navegador =====
//
// Usa APIs nativas do browser (DecompressionStream) + parser TAR manual.
// Sem dependências externas. Funciona em Chrome/Edge/Firefox modernos.
//
// Fluxo:
// 1. Lê .tar.gz como ArrayBuffer
// 2. Descomprime gzip → .tar (ArrayBuffer)
// 3. Parseia formato TAR → extrai arquivos individuais
// 4. Retorna array de { name, blob } para cada imagem

export interface ExtractedFile {
  name: string;
  blob: Blob;
  size: number;
}

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

/**
 * Extrai um arquivo .tar.gz e retorna as imagens contidas.
 */
export async function extractTarGz(file: File): Promise<ExtractedFile[]> {
  // 1. Descomprime gzip usando DecompressionStream nativo
  const arrayBuffer = await file.arrayBuffer();

  // Verifica se é gzip (magic number 0x1f 0x8b)
  const uint8 = new Uint8Array(arrayBuffer);
  if (uint8[0] !== 0x1f || uint8[1] !== 0x8b) {
    // Pode ser um .tar sem gzip — tenta parsear direto
    return parseTar(arrayBuffer);
  }

  // Descomprime
  const ds = new DecompressionStream("gzip");
  const stream = new Blob([arrayBuffer]).stream().pipeThrough(ds);
  const tarBuffer = await new Response(stream).arrayBuffer();

  // 2. Parseia TAR
  return parseTar(tarBuffer);
}

/**
 * Parseia um buffer no formato TAR (POSIX/UStar).
 * Cada entrada tem um header de 512 bytes + dados + padding.
 */
function parseTar(buffer: ArrayBuffer): ExtractedFile[] {
  const files: ExtractedFile[] = [];
  const view = new Uint8Array(buffer);
  let offset = 0;

  while (offset < buffer.byteLength - 512) {
    // Lê header (512 bytes)
    const header = view.slice(offset, offset + 512);

    // Nome do arquivo (offset 0, 100 bytes, null-terminated)
    let name = "";
    for (let i = 0; i < 100; i++) {
      if (header[i] === 0) break;
      name += String.fromCharCode(header[i]);
    }

    // Se nome vazio, chegamos no fim do archive
    if (!name) break;

    // Tamanho do arquivo (offset 124, 12 bytes, octal string)
    let sizeStr = "";
    for (let i = 124; i < 136; i++) {
      if (header[i] === 0 || header[i] === 32) break;
      sizeStr += String.fromCharCode(header[i]);
    }
    const size = parseInt(sizeStr, 8) || 0;

    // Type flag (offset 156)
    // '0' ou null = arquivo regular, '5' = diretório, 'L' = nome longo
    const typeFlag = String.fromCharCode(header[156] || 0x30);

    // Pula header
    offset += 512;

    // Se for diretório, pula (não há dados)
    if (typeFlag === "5" || typeFlag === "d") {
      continue;
    }

    // Se for arquivo regular (ou tipo vazio = regular)
    if (typeFlag === "0" || typeFlag === "" || typeFlag === "\x00") {
      // Extrai apenas imagens
      const lowerName = name.toLowerCase();
      const isImage = IMAGE_EXTENSIONS.some((ext) =>
        lowerName.endsWith(ext),
      );

      if (isImage && size > 0) {
        // Pega apenas o nome do arquivo (sem caminho completo)
        const baseName = name.split("/").pop() || name;

        // Extrai dados do arquivo
        const fileData = view.slice(offset, offset + size);
        const blob = new Blob([fileData], {
          type: getMimeType(lowerName),
        });

        files.push({
          name: baseName,
          blob,
          size,
        });
      }
    }

    // Avança para próxima entrada (alinhado em 512 bytes)
    offset += Math.ceil(size / 512) * 512;
  }

  return files;
}

function getMimeType(name: string): string {
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}
