"use client";

import { useState } from "react";
import { Search, MapPin, Phone, Globe, Loader2, CheckCircle2, Flame, Store, Instagram, Facebook, Clock, Code2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ===== View de Prospecção de Leads =====
//
// Busca estabelecimentos reais via OpenStreetMap (Overpass API).
// Resultados são salvos no kanban de parceiros e notificados via Telegram.

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
  source: string;
  instagram: string | null;
  facebook: string | null;
  email: string | null;
  openingHours: string | null;
  hasWebsite: boolean;
  hasSocialMedia: boolean;
  webDevOpportunity: boolean;
}

const CATEGORIES = [
  { value: "restaurant", label: "Restaurantes", emoji: "🍽️" },
  { value: "fast_food", label: "Lanchonetes", emoji: "🍔" },
  { value: "cafe", label: "Cafés", emoji: "☕" },
  { value: "pharmacy", label: "Farmácias", emoji: "💊" },
  { value: "supermarket", label: "Supermercados", emoji: "🛒" },
  { value: "convenience", label: "Conveniência", emoji: "🏪" },
];

export function ProspectView() {
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("restaurant");
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<{ totalFound: number; savedNew: number; quota?: { searchCount: number; limitPerMonth: number; blocked: boolean } } | null>(null);

  const search = async () => {
    if (!city.trim()) {
      toast.error("Digite uma cidade");
      return;
    }
    setLoading(true);
    setLeads([]);
    setStats(null);

    try {
      const res = await fetch(
        `/api/admin/parceiros/prospect?city=${encodeURIComponent(city)}&category=${category}&limit=30`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro na busca");
      }
      const data = await res.json();
      setLeads(data.leads || []);
      setStats({ totalFound: data.totalFound, savedNew: data.savedNew, quota: data.quota });

      if (data.totalFound > 0) {
        toast.success(`${data.totalFound} leads encontrados!`, {
          description: `${data.savedNew} novos salvos no kanban. Bot do Telegram te avisou.`,
        });
      } else {
        toast.info("Nenhum lead encontrado", {
          description: "Tente outra cidade ou categoria.",
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao buscar leads");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10">
            <Search className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Prospecção de Leads</h2>
            <p className="text-xs text-zinc-400">
              Busca estabelecimentos reais via OpenStreetMap. Leads são salvos no kanban e notificados via Telegram.
            </p>
          </div>
        </div>

        {/* Form de busca */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <Label className="text-xs text-zinc-400">Cidade</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: Recife, São Paulo..."
              className="border-zinc-700 bg-zinc-950"
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="border-zinc-700 bg-zinc-950">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.emoji} {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={search}
              disabled={loading || !city.trim()}
              className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...</>
              ) : (
                <><Search className="mr-2 h-4 w-4" /> Buscar leads</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
              <p className="text-xs text-zinc-500">Encontrados</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.totalFound}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
              <p className="text-xs text-zinc-500">Novos no kanban</p>
              <p className="text-2xl font-bold text-cyan-400">{stats.savedNew}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
              <p className="text-xs text-zinc-500">Telegram</p>
              <p className="text-2xl font-bold text-amber-400">
                {stats.totalFound > 0 ? "✅ Avisado" : "—"}
              </p>
            </div>
          </div>

          {/* Barra de cota do Google Maps */}
          {stats.quota && (
            <div className={`rounded-xl border p-4 ${
              stats.quota.blocked
                ? "border-red-500/30 bg-red-500/5"
                : stats.quota.searchCount >= 2500
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-emerald-500/20 bg-emerald-500/5"
            }`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-400">
                  Cota Google Maps (mês atual)
                </p>
                <span className={`text-xs font-bold ${
                  stats.quota.blocked ? "text-red-400" :
                  stats.quota.searchCount >= 2500 ? "text-amber-400" : "text-emerald-400"
                }`}>
                  {stats.quota.searchCount} / {stats.quota.limitPerMonth}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    stats.quota.blocked ? "bg-red-500" :
                    stats.quota.searchCount >= 2500 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, (stats.quota.searchCount / stats.quota.limitPerMonth) * 100)}%` }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-zinc-500">
                {stats.quota.blocked
                  ? "🚫 Cota bloqueada. Usando OpenStreetMap (gratuito) como fallback. Reseta no dia 1º."
                  : `$200 crédito grátis/mês • ${stats.quota.limitPerMonth - stats.quota.searchCount} buscas restantes • Custo: $0.032/busca`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lista de leads */}
      {leads.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-zinc-400">
            LEADS ENCONTRADOS ({leads.length})
          </h3>
          {leads.map((lead, i) => (
            <div
              key={`${lead.name}-${i}`}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-emerald-500/30"
            >
              {/* Linha 1: Nome + Rating + Fonte + Oportunidade Web Dev */}
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-zinc-800">
                  <Store className="h-4 w-4 text-zinc-400" />
                </div>
                <p className="min-w-0 flex-1 truncate text-sm font-bold text-zinc-100">{lead.name}</p>
                {lead.rating && (
                  <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                    ⭐ {lead.rating}
                    {lead.reviews && <span className="text-amber-600">({lead.reviews})</span>}
                  </span>
                )}
                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                  lead.source === "google_maps" ? "bg-blue-500/10 text-blue-400" :
                  lead.source === "openstreetmap" ? "bg-emerald-500/10 text-emerald-400" :
                  "bg-zinc-700 text-zinc-400"
                }`}>
                  {lead.source === "google_maps" ? "Google" : lead.source === "openstreetmap" ? "OSM" : "Demo"}
                </span>
                {lead.webDevOpportunity && (
                  <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-bold text-purple-400" title="Não tem site próprio — oportunidade de vender criação de site">
                    <Code2 className="h-2.5 w-2.5" />
                    SEM SITE
                  </span>
                )}
              </div>

              {/* Linha 2: Contatos (telefone, site, insta, facebook, email) */}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-11 text-xs text-zinc-500">
                {lead.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-emerald-400" />
                    {lead.phone}
                  </span>
                )}
                {lead.website && (
                  <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-400 hover:underline">
                    <Globe className="h-3 w-3" />
                    Site
                  </a>
                )}
                {lead.instagram && (
                  <a href={lead.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-pink-400 hover:underline">
                    <Instagram className="h-3 w-3" />
                    Instagram
                  </a>
                )}
                {lead.facebook && (
                  <a href={lead.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                    <Facebook className="h-3 w-3" />
                    Facebook
                  </a>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-zinc-400 hover:underline">
                    <Mail className="h-3 w-3" />
                    {lead.email}
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {lead.address}
                </span>
              </div>

              {/* Linha 3: Status badges */}
              <div className="mt-2 flex items-center gap-2 pl-11">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-400">NO KANBAN</span>
                {lead.hasWebsite && (
                  <span className="text-[10px] font-medium text-zinc-500">• Tem site próprio</span>
                )}
                {lead.hasSocialMedia && !lead.hasWebsite && (
                  <span className="text-[10px] font-medium text-pink-400">• Só rede social</span>
                )}
                {!lead.hasSocialMedia && !lead.hasWebsite && (
                  <span className="text-[10px] font-medium text-amber-400">• Sem presença digital</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !leads.length && (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-12 text-center">
          <Flame className="mx-auto h-10 w-10 text-zinc-700" />
          <p className="mt-3 text-sm text-zinc-500">
            Digite uma cidade e clique em "Buscar leads" para encontrar estabelecimentos reais.
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            Os leads são salvos automaticamente no kanban e você recebe um aviso no Telegram.
          </p>
        </div>
      )}
    </div>
  );
}
