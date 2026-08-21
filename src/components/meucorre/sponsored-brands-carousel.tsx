"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Megaphone, ExternalLink } from "lucide-react";

interface Sponsor {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  website: string | null;
  logoUrl: string | null;
  instagram: string | null;
  facebook: string | null;
  whatsapp: string | null;
}

const SPONSOR_CHECKOUT_URL = "https://pay.kiwify.com.br/th2VNpn";

// Fallback: marcas fictícias (caso a API não responda ou não haja sponsors com logo)
const FALLBACK_BRANDS = [
  { id: "fb1", name: "MotoParts BR", description: "Peças e acessórios para moto com desconto", category: "Acessórios", website: null, logoUrl: null, instagram: null, facebook: null, whatsapp: null },
  { id: "fb2", name: "MotoSeguro", description: "Seguro de moto com preço especial para entregadores", category: "Seguros", website: null, logoUrl: null, instagram: null, facebook: null, whatsapp: null },
  { id: "fb3", name: "RotaCerta GPS", description: "App de navegação otimizado para motos", category: "Tecnologia", website: null, logoUrl: null, instagram: null, facebook: null, whatsapp: null },
  { id: "fb4", name: "Mochilas Táticas", description: "Mochilas térmicas resistentes para entrega", category: "Equipamentos", website: null, logoUrl: null, instagram: null, facebook: null, whatsapp: null },
  { id: "fb5", name: "Gasolina+", description: "Postos com desconto para entregadores", category: "Combustível", website: null, logoUrl: null, instagram: null, facebook: null, whatsapp: null },
  { id: "fb6", name: "Capacetes Pro", description: "Capacetes premium com tecnologia Bluetooth", category: "Segurança", website: null, logoUrl: null, instagram: null, facebook: null, whatsapp: null },
  { id: "fb7", name: "PagEntrega", description: "Maquininha com taxa zero para entregadores", category: "Pagamentos", website: null, logoUrl: null, instagram: null, facebook: null, whatsapp: null },
  { id: "fb8", name: "PneuTop", description: "Pneus com desconto e troca gratuita", category: "Peças", website: null, logoUrl: null, instagram: null, facebook: null, whatsapp: null },
  { id: "fb9", name: "MotoBank", description: "Conta digital grátis para entregadores", category: "Financeiro", website: null, logoUrl: null, instagram: null, facebook: null, whatsapp: null },
  { id: "fb10", name: "BateriaMax", description: "Baterias de moto com garantia estendida", category: "Peças", website: null, logoUrl: null, instagram: null, facebook: null, whatsapp: null },
];

function getInitials(name: string): string {
  const words = name.split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function getColorForName(name: string): string {
  const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function SponsoredBrandsCarousel() {
  const [sponsors, setSponsors] = useState<Sponsor[]>(FALLBACK_BRANDS);

  useEffect(() => {
    fetch("/api/public/sponsors")
      .then((r) => r.json())
      .then((data) => {
        if (data.carousel && data.carousel.length > 0) {
          setSponsors(data.carousel);
        }
      })
      .catch(() => {
        // Mantém fallback
      });
  }, []);

  // Duplica para loop infinito
  const loopBrands = [...sponsors, ...sponsors];

  return (
    <section className="bg-zinc-950 py-16 text-white md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <Megaphone className="h-3 w-3" />
            Marcas Patrocinadas
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            Marcas que apoiam o <span className="text-emerald-400">MeuCorre</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400">
            Empresas que acreditam no entregador e investem para estar visíveis na nossa plataforma.
          </p>
        </motion.div>
      </div>

      {/* Carrossel infinito */}
      <div className="relative mt-10 overflow-hidden py-4">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-zinc-950 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-zinc-950 to-transparent" />

        <motion.div
          className="flex gap-4 overflow-x-hidden"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          style={{ width: "max-content" }}
        >
          {loopBrands.map((brand, index) => {
            const color = getColorForName(brand.name);
            const link = brand.website || "#";
            return (
              <a
                key={`${brand.id}-${index}`}
                href={link}
                target={brand.website ? "_blank" : undefined}
                rel={brand.website ? "noopener noreferrer" : undefined}
                className="group block w-[200px] shrink-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-lg sm:w-[220px]"
              >
                <div className="relative flex h-24 items-center justify-center overflow-hidden bg-zinc-800">
                  {brand.logoUrl ? (
                    <img
                      src={brand.logoUrl}
                      alt={brand.name}
                      className="h-16 w-auto max-w-[80%] object-contain transition-transform group-hover:scale-110"
                      loading="lazy"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      className="grid h-14 w-14 place-items-center rounded-xl text-lg font-black text-white shadow-lg transition-transform group-hover:scale-110"
                      style={{ backgroundColor: color }}
                    >
                      {getInitials(brand.name)}
                    </div>
                  )}
                  {brand.category && (
                    <div className="absolute left-2 top-2 rounded-full bg-zinc-900/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400 backdrop-blur">
                      {brand.category}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="truncate text-sm font-bold text-white">{brand.name}</h3>
                  <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400">{brand.description}</p>
                </div>
              </a>
            );
          })}
        </motion.div>
      </div>

      {/* CTA pulsante */}
      <div className="mt-10 flex flex-col items-center gap-4 px-4">
        <div className="text-center">
          <p className="text-sm text-zinc-400"><strong className="text-white">Quer divulgar sua marca?</strong></p>
          <p className="mt-1 text-xs text-zinc-500">
            Sua marca no carrossel por apenas <span className="font-bold text-emerald-400">R$ 16,90/mês</span>
          </p>
        </div>
        <motion.a
          href={SPONSOR_CHECKOUT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-8 py-3 text-sm font-bold text-white shadow-lg"
          style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
          animate={{ scale: [1, 1.03, 1], boxShadow: ["0 0 20px rgba(16,185,129,0.3)", "0 0 40px rgba(16,185,129,0.6)", "0 0 20px rgba(16,185,129,0.3)"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ background: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)" }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="relative z-10 flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Divulgar minha marca
            <ExternalLink className="h-4 w-4" />
          </span>
        </motion.a>
        <p className="text-[10px] text-zinc-500">Assinatura mensal · Cancelamento a qualquer momento · Pix ou cartão</p>
      </div>
    </section>
  );
}
