"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  ShoppingBag,
  Crown,
  Loader2,
  ExternalLink,
  Tag,
  Sparkles,
} from "lucide-react";

interface Offer {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number | null;
  imageUrl: string;
  productUrl: string;
  category: string;
  proOnly: boolean;
}

const CATEGORY_LABEL: Record<string, string> = {
  equipamentos: "Equipamentos",
  combustivel: "Combustível",
  seguro: "Seguro",
  ferramentas: "Ferramentas",
  vestuario: "Vestuário",
  outros: "Outros",
};

const CATEGORIES = [
  { value: "all", label: "Todas" },
  { value: "equipamentos", label: "Equipamentos" },
  { value: "combustivel", label: "Combustível" },
  { value: "seguro", label: "Seguro" },
  { value: "ferramentas", label: "Ferramentas" },
  { value: "vestuario", label: "Vestuário" },
  { value: "outros", label: "Outros" },
];

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function OffersList({ isPro }: { isPro: boolean }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [clicking, setClicking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("category", filter);
      const res = await fetch(`/api/offers?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOffers(data.offers ?? []);
    } catch {
      // silencioso — usuário não precisa ver erro de oferta
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClick = async (offer: Offer) => {
    setClicking(offer.id);
    try {
      const res = await fetch(`/api/offers/${offer.id}/click`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresPro) {
          toast.warning("Oferta exclusiva PRO", {
            description:
              "Faça upgrade para PRO para desbloquear ofertas especiais",
          });
        } else {
          toast.error(data.error || "Erro ao abrir oferta");
        }
        return;
      }
      // Abre em nova aba com URL enriquecida
      window.open(data.url, "_blank", "noopener,noreferrer");
      // Incrementa localmente para feedback imediato
      setOffers((prev) =>
        prev.map((o) =>
          o.id === offer.id ? { ...o, _clicked: true as never } : o,
        ),
      );
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setClicking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando ofertas...
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-zinc-400" />
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Nenhuma oferta disponível no momento
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Volte em breve — estamos preparando descontos exclusivos para você
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-1.5 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            Ofertas exclusivas
          </h2>
          <p className="text-xs text-zinc-500">
            Descontos selecionados para entregadores
          </p>
        </div>

        {/* Filtro por categoria */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilter(c.value)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                filter === c.value
                  ? "bg-emerald-500 text-zinc-950"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Banner PRO-only (se user não for PRO e houver ofertas PRO) */}
      {!isPro && offers.some((o) => o.proOnly) && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-yellow-700 dark:text-yellow-400">
            <Crown className="h-3.5 w-3.5" />
            Existem ofertas exclusivas para usuários PRO
          </p>
        </div>
      )}

      {/* Grid de ofertas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {offers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            isPro={isPro}
            clicking={clicking === offer.id}
            onClick={() => handleClick(offer)}
          />
        ))}
      </div>
    </div>
  );
}

function OfferCard({
  offer,
  isPro,
  clicking,
  onClick,
}: {
  offer: Offer;
  isPro: boolean;
  clicking: boolean;
  onClick: () => void;
}) {
  const locked = offer.proOnly && !isPro;

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-900 ${
        locked
          ? "border-yellow-500/40"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      {/* Badge PRO */}
      {offer.proOnly && (
        <div className="absolute right-2 top-2 z-10 inline-flex items-center gap-0.5 rounded-full bg-yellow-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-zinc-950 shadow">
          <Crown className="h-2.5 w-2.5" />
          PRO
        </div>
      )}

      {/* Badge desconto */}
      {offer.discountPercent && offer.discountPercent > 0 && (
        <div className="absolute left-2 top-2 z-10 inline-flex items-center gap-0.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-zinc-950 shadow">
          <Tag className="h-2.5 w-2.5" />
          -{offer.discountPercent}%
        </div>
      )}

      {/* Imagem */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        { }
        <img
          src={offer.imageUrl}
          alt={offer.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.style.display = "none";
            const parent = img.parentElement;
            if (parent) {
              parent.classList.add("grid", "place-items-center");
              parent.innerHTML +=
                '<div class="text-3xl text-zinc-400">📦</div>';
            }
          }}
        />
        {locked && (
          <div className="absolute inset-0 grid place-items-center bg-zinc-950/70 backdrop-blur-sm">
            <Crown className="h-8 w-8 text-yellow-400" />
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col p-2.5">
        <p className="line-clamp-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
          {offer.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[10px] text-zinc-500">
          {offer.description}
        </p>

        {/* Categoria */}
        <p className="mt-1 text-[9px] font-medium uppercase tracking-wider text-emerald-500">
          {CATEGORY_LABEL[offer.category] ?? offer.category}
        </p>

        {/* Preço */}
        <div className="mt-1.5 flex items-baseline gap-1">
          <span className="text-sm font-black text-emerald-500">
            {formatBRL(offer.price)}
          </span>
          {offer.originalPrice && (
            <span className="text-[10px] text-zinc-400 line-through">
              {formatBRL(offer.originalPrice)}
            </span>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={onClick}
          disabled={clicking || locked}
          className={`mt-2 w-full rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors ${
            locked
              ? "cursor-not-allowed bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-600"
              : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
          }`}
        >
          {clicking ? (
            <Loader2 className="mx-auto h-3 w-3 animate-spin" />
          ) : locked ? (
            "PRO apenas"
          ) : (
            <span className="inline-flex items-center gap-1">
              Garanta seu desconto
              <ExternalLink className="h-2.5 w-2.5" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
