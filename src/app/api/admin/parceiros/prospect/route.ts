import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { z } from "zod";

// ===== API de Prospecção de Leads — Google Maps + OpenStreetMap =====
//
// Fontes (em ordem de prioridade):
// 1. Google Places API (se NEXT_PUBLIC_GOOGLE_MAPS_API_KEY configurada)
//    - $200 crédito grátis/mês = ~5000 buscas
//    - Dados: nome, telefone, endereço, rating, reviews, website, foto
// 2. OpenStreetMap Overpass API (fallback, 100% gratuito)
//    - Dados: nome, telefone, endereço, website
// 3. Leads de demonstração (último fallback)

const prospectSchema = z.object({
  city: z.string().min(2),
  category: z.enum(["restaurant", "fast_food", "cafe", "pharmacy", "supermarket", "convenience"]).default("restaurant"),
  limit: z.number().min(1).max(50).default(20),
});

const GOOGLE_CATEGORIES: Record<string, string> = {
  restaurant: "restaurant",
  fast_food: "meal_delivery|meal_takeaway",
  cafe: "cafe",
  pharmacy: "pharmacy",
  supermarket: "supermarket|grocery_store",
  convenience: "convenience_store",
};

const OSM_CATEGORIES: Record<string, string> = {
  restaurant: "amenity=restaurant",
  fast_food: "amenity=fast_food",
  cafe: "amenity=cafe",
  pharmacy: "amenity=pharmacy",
  supermarket: "shop=supermarket",
  convenience: "shop=convenience",
};

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: "restaurantes",
  fast_food: "lanchonetes",
  cafe: "cafés",
  pharmacy: "farmácias",
  supermarket: "supermercados",
  convenience: "conveniência",
};

interface Lead {
  name: string;
  phone: string | null;
  whatsapp: string | null;
  address: string;
  city: string;
  lat: number;
  lng: number;
  category: string;
  website: string | null;
  rating: number | null;
  reviews: number | null;
  source: "google_maps" | "openstreetmap" | "demo";
}

// ===== Google Places API (Nearby Search) =====
async function searchGoogleMaps(city: string, category: string, lat: number, lng: number, limit: number): Promise<Lead[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return [];

  const googleType = GOOGLE_CATEGORIES[category] || "restaurant";
  const radius = 5000; // 5km

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${googleType}&language=pt-BR&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") return [];

  const places = (data.results || []).slice(0, limit);

  // Para cada lugar, busca detalhes (telefone + website)
  const leads: Lead[] = [];
  for (const place of places) {
    let phone: string | null = null;
    let website: string | null = null;

    // Busca detalhes (phone + website) — 1 request por lugar
    try {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,website,international_phone_number&language=pt-BR&key=${apiKey}`;
      const detailsRes = await fetch(detailsUrl);
      if (detailsRes.ok) {
        const detailsData = await detailsRes.json();
        if (detailsData.status === "OK") {
          phone = detailsData.result?.formatted_phone_number || detailsData.result?.international_phone_number || null;
          website = detailsData.result?.website || null;
        }
      }
    } catch { /* ignore */ }

    leads.push({
      name: place.name || "Sem nome",
      phone,
      whatsapp: phone ? phone.replace(/\D/g, "") : null,
      address: place.vicinity || place.formatted_address || "Endereço não disponível",
      city,
      lat: place.geometry?.location?.lat || lat,
      lng: place.geometry?.location?.lng || lng,
      category,
      website,
      rating: place.rating || null,
      reviews: place.user_ratings_total || null,
      source: "google_maps",
    });
  }

  return leads;
}

// ===== OpenStreetMap Overpass API (fallback gratuito) =====
async function searchOpenStreetMap(city: string, category: string, lat: number, lng: number, limit: number): Promise<Lead[]> {
  const osmTag = OSM_CATEGORIES[category] || OSM_CATEGORIES.restaurant;
  const radius = 5000;
  const query = `[out:json][timeout:25];(${osmTag}(around:${radius},${lat},${lng}););out tags center ${limit};`;

  const servers = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
  ];

  for (const server of servers) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(server, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const elements = data.elements || [];
        return elements
          .filter((e: { tags?: { name?: string } }) => e.tags?.name)
          .map((e: {
            lat?: number;
            lon?: number;
            center?: { lat: number; lon: number };
            tags?: {
              name?: string;
              phone?: string;
              "contact:phone"?: string;
              "contact:whatsapp"?: string;
              "addr:street"?: string;
              "addr:housenumber"?: string;
              "addr:suburb"?: string;
              website?: string;
            };
          }) => {
            const tags = e.tags || {};
            const addr = [tags["addr:street"], tags["addr:housenumber"], tags["addr:suburb"]].filter(Boolean).join(", ");
            const phone = tags.phone || tags["contact:phone"] || null;
            return {
              name: tags.name || "Sem nome",
              phone,
              whatsapp: tags["contact:whatsapp"] || (phone ? phone.replace(/\D/g, "") : null),
              address: addr || "Endereço não disponível",
              city,
              lat: e.lat || e.center?.lat || lat,
              lng: e.lon || e.center?.lon || lng,
              category,
              website: tags.website || null,
              rating: null,
              reviews: null,
              source: "openstreetmap" as const,
            };
          });
      }
    } catch { /* try next server */ }
  }

  return []; // Todos os servidores falharam
}

// ===== Telegram notification =====
async function sendTelegramNotification(leads: Lead[], city: string, category: string) {
  try {
    const tokenSetting = await prisma.setting.findUnique({ where: { key: "telegram_bot_token" } });
    if (!tokenSetting?.value) return;

    const ADMIN_CHAT_ID = "802516531";
    const top5 = leads.slice(0, 5).map((l, i) => {
      const rating = l.rating ? ` ⭐${l.rating}` : "";
      const phone = l.phone ? ` 📞 ${l.phone}` : " 📞 Sem telefone";
      return `${i + 1}. ${l.name}${rating}\n   ${phone}\n   📍 ${l.address}`;
    }).join("\n\n");

    const sourceLabel = leads[0]?.source === "google_maps" ? "Google Maps" : leads[0]?.source === "openstreetmap" ? "OpenStreetMap" : "Demo";

    const message = `🔔 *${leads.length} novos leads encontrados!*

📍 Cidade: ${city}
🏷️ Categoria: ${CATEGORY_LABELS[category] || category}
🔍 Fonte: ${sourceLabel}

*Top ${Math.min(5, leads.length)} leads:*

${top5}

${leads.length > 5 ? `... e mais ${leads.length - 5} leads.` : ""}

Acesse /admin/parceiros para iniciar contato 🚀`;

    await fetch(`https://api.telegram.org/bot${tokenSetting.value}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error("[prospect] Erro Telegram:", err);
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = prospectSchema.safeParse({
    city: searchParams.get("city") || "",
    category: searchParams.get("category") || "restaurant",
    limit: Number(searchParams.get("limit") || 20),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  try {
    // 1. Geocode da cidade
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(parsed.data.city)}&format=json&limit=1`;
    const geocodeRes = await fetch(geocodeUrl, {
      headers: { "User-Agent": "MeuCorre/1.0 (prospecao@meucorre.com)" },
    });

    if (!geocodeRes.ok) {
      return NextResponse.json({ error: "Erro ao buscar cidade" }, { status: 502 });
    }

    const geocodeData = await geocodeRes.json();
    if (!geocodeData || geocodeData.length === 0) {
      return NextResponse.json({ error: `Cidade "${parsed.data.city}" não encontrada` }, { status: 404 });
    }

    const lat = parseFloat(geocodeData[0].lat);
    const lng = parseFloat(geocodeData[0].lon);

    // 2. Busca leads: Google Maps primeiro, depois OSM, depois demo
    let leads: Lead[] = [];
    let source = "";

    // Tentativa 1: Google Maps
    leads = await searchGoogleMaps(parsed.data.city, parsed.data.category, lat, lng, parsed.data.limit);
    if (leads.length > 0) source = "google_maps";

    // Tentativa 2: OpenStreetMap (se Google falhou ou não configurado)
    if (leads.length === 0) {
      leads = await searchOpenStreetMap(parsed.data.city, parsed.data.category, lat, lng, parsed.data.limit);
      if (leads.length > 0) source = "openstreetmap";
    }

    // Tentativa 3: Demo (último recurso)
    if (leads.length === 0) {
      leads = [
        { name: `Restaurante Sabor da Terra - ${parsed.data.city}`, phone: null, whatsapp: null, address: `Centro, ${parsed.data.city}`, city: parsed.data.city, lat, lng, category: parsed.data.category, website: null, rating: null, reviews: null, source: "demo" },
        { name: `Lanchonete do Bairro - ${parsed.data.city}`, phone: null, whatsapp: null, address: `Zona Sul, ${parsed.data.city}`, city: parsed.data.city, lat: lat + 0.01, lng: lng + 0.01, category: parsed.data.category, website: null, rating: null, reviews: null, source: "demo" },
        { name: `Café Aroma - ${parsed.data.city}`, phone: null, whatsapp: null, address: `Rua das Flores, ${parsed.data.city}`, city: parsed.data.city, lat: lat - 0.01, lng: lng - 0.01, category: parsed.data.category, website: null, rating: null, reviews: null, source: "demo" },
        { name: `Pizza Express - ${parsed.data.city}`, phone: null, whatsapp: null, address: `Av. Principal, ${parsed.data.city}`, city: parsed.data.city, lat: lat + 0.02, lng: lng - 0.01, category: parsed.data.category, website: null, rating: null, reviews: null, source: "demo" },
        { name: `Supermercado Económico - ${parsed.data.city}`, phone: null, whatsapp: null, address: `BR-101, ${parsed.data.city}`, city: parsed.data.city, lat: lat - 0.02, lng: lng + 0.02, category: parsed.data.category, website: null, rating: null, reviews: null, source: "demo" },
      ];
      source = "demo";
    }

    // 3. Notifica via Telegram
    await sendTelegramNotification(leads, parsed.data.city, parsed.data.category);

    // 4. Salva no banco
    let savedCount = 0;
    for (const lead of leads) {
      try {
        const existing = await prisma.partner.findFirst({
          where: { companyName: lead.name, city: { contains: parsed.data.city, mode: "insensitive" } },
        });
        if (!existing) {
          await prisma.partner.create({
            data: {
              companyName: lead.name,
              tradeName: lead.name,
              category: parsed.data.category,
              origin: source === "google_maps" ? "google_maps" : source === "openstreetmap" ? "openstreetmap" : "manual",
              city: parsed.data.city,
              address: lead.address,
              phone: lead.phone,
              website: lead.website,
              stage: "novo_lead",
              status: "active",
              notes: `Telefone: ${lead.phone || "N/A"}\nWhatsApp: ${lead.whatsapp || "N/A"}\nEndereço: ${lead.address}\nFonte: ${source}\nRating: ${lead.rating || "N/A"}\nReviews: ${lead.reviews || "N/A"}`,
              potentialValue: 0,
            },
          });
          savedCount++;
        }
      } catch { /* ignore individual errors */ }
    }

    return NextResponse.json({
      ok: true,
      city: parsed.data.city,
      category: parsed.data.category,
      source,
      totalFound: leads.length,
      savedNew: savedCount,
      leads,
      warning: source === "demo" ? "Google Maps e OpenStreetMap indisponíveis. Mostrando leads de demonstração." : undefined,
    });
  } catch (err) {
    console.error("[prospect] Erro:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro interno" }, { status: 500 });
  }
}
