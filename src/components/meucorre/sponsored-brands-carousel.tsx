"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles, ExternalLink, Megaphone } from "lucide-react";

interface SponsoredBrand {
  name: string;
  logo?: string;
  description: string;
  url: string;
  category: string;
}

const SPONSORED_BRANDS: SponsoredBrand[] = [];

const SPONSOR_CHECKOUT_URL = "https://pay.kiwify.com.br/FCIdFRB";

export function SponsoredBrandsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(SPONSORED_BRANDS.length, 1));
  }, []);

  useEffect(() => {
    if (SPONSORED_BRANDS.length <= 1) return;
    const interval = setInterval(next, 4000);
    return () => clearInterval(interval);
  }, [next]);

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

        {SPONSORED_BRANDS.length > 0 ? (
          <div className="mt-10 overflow-hidden">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center"
            >
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center max-w-md">
                {SPONSORED_BRANDS[currentIndex].logo && (
                  <img
                    src={SPONSORED_BRANDS[currentIndex].logo}
                    alt={SPONSORED_BRANDS[currentIndex].name}
                    className="mx-auto mb-4 h-16 w-auto"
                  />
                )}
                <h3 className="text-xl font-bold text-white">
                  {SPONSORED_BRANDS[currentIndex].name}
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  {SPONSORED_BRANDS[currentIndex].description}
                </p>
                <a
                  href={SPONSORED_BRANDS[currentIndex].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:underline"
                >
                  Conhecer marca
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </motion.div>

            {SPONSORED_BRANDS.length > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                {SPONSORED_BRANDS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === currentIndex ? "w-8 bg-emerald-500" : "w-2 bg-zinc-700"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 flex flex-col items-center"
          >
            <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 p-8 text-center max-w-lg">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10">
                <Sparkles className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Sua marca pode estar aqui
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                Alcance milhares de entregadores de aplicativo que usam o MeuCorre diariamente.
                Sua marca aparece no carrossel da landing page, com link direto para seu site.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500">
                <span>✓ Visibilidade na landing page</span>
                <span>✓ Link direto para seu site</span>
                <span>✓ Público qualificado</span>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 flex flex-col items-center gap-4"
        >
          <div className="text-center">
            <p className="text-sm text-zinc-400">
              <strong className="text-white">Quer divulgar sua marca?</strong>
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Sua marca no carrossel por apenas{" "}
              <span className="font-bold text-emerald-400">R$ 16,90/mês</span>
            </p>
          </div>
          <a
            href={SPONSOR_CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
          >
            <Megaphone className="h-4 w-4" />
            Divulgar minha marca
            <ExternalLink className="h-4 w-4" />
          </a>
          <p className="text-[10px] text-zinc-500">
            Assinatura mensal · Cancelamento a qualquer momento · Pix ou cartão
          </p>
        </motion.div>
      </div>
    </section>
  );
}
