import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { validateExternalUrl } from "@/lib/validation";
import { z } from "zod";

// POST /api/admin/ads/preview-url
// Body: { url: string }
// Busca a página da URL e extrai Open Graph metadata (imagem, título, descrição).
// Retorna: { title, description, image, url }
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: { url?: string };
  try {
    body = (await req.json()) as { url?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const url = validateExternalUrl(body.url);
  if (!url) {
    return NextResponse.json({ error: "URL inválida (deve ser HTTPS)" }, { status: 400 });
  }

  try {
    // Busca a página com timeout de 10s
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MeuCorreBot/1.0)",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: `Erro ao buscar URL: ${res.status}` }, { status: 502 });
    }

    const html = await res.text();

    // Extrai OG metadata do HTML
    const getMeta = (property: string): string | null => {
      // Tenta og: property primeiro, depois twitter: property, depois <title>
      const patterns = [
        new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, "i"),
      ];
      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) return match[1];
      }
      return null;
    };

    const title = getMeta("og:title") ?? getMeta("twitter:title") ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? null;
    const description = getMeta("og:description") ?? getMeta("twitter:description") ?? getMeta("description") ?? null;
    const image = getMeta("og:image") ?? getMeta("twitter:image") ?? null;

    // Resolve imagem relativa pra URL absoluta
    let imageUrl: string | null = null;
    if (image) {
      try {
        imageUrl = new URL(image, url).href;
      } catch {
        imageUrl = image;
      }
    }

    return NextResponse.json({
      title: title?.trim().slice(0, 200) ?? null,
      description: description?.trim().slice(0, 500) ?? null,
      image: imageUrl,
      url,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: `Erro ao buscar URL: ${msg}` }, { status: 502 });
  }
}
