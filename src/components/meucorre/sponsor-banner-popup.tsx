"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";

interface BannerSponsor {
  id: string;
  name: string;
  bannerUrl: string | null;
  bannerLink: string | null;
  website: string | null;
}

const STORAGE_KEY = "meucorre_banner_dismissed";

interface Props {
  /** Quando true, NÃO abre automaticamente (outro dialog crítico está ativo). */
  suppress?: boolean;
}

export function SponsorBannerPopup({ suppress }: Props = {}) {
  const [banners, setBanners] = useState<BannerSponsor[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/public/sponsors")
      .then((r) => r.json())
      .then((data) => {
        if (data.banners && data.banners.length > 0) {
          // Filtra apenas banners que têm bannerUrl
          const validBanners = data.banners.filter((b: BannerSponsor) => b.bannerUrl);
          if (validBanners.length > 0) {
            setBanners(validBanners);

            // Verifica se já foi dismissado hoje
            const dismissed = localStorage.getItem(STORAGE_KEY);
            const today = new Date().toDateString();
            if (dismissed !== today) {
              // Mostra após 5 segundos
              setTimeout(() => setVisible(true), 5000);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  // Se suppress ficar true (dialog crítico aberto), fecha o banner para
  // liberar a tela. Caso contrário o banner overlay z-50 sobrepõe o
  // DeliveryForm e o usuário acha que o botão "Nova corrida" não funciona.
  useEffect(() => {
    if (suppress && visible) {
      setVisible(false);
    }
  }, [suppress, visible]);

  // Rotaciona banners a cada 10 segundos (se houver mais de 1)
  useEffect(() => {
    if (banners.length <= 1 || !visible) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [banners.length, visible]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, new Date().toDateString());
  };

  if (!visible || banners.length === 0) return null;

  const banner = banners[currentIndex];
  if (!banner?.bannerUrl) return null;

  const link = banner.bannerLink || banner.website || "#";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 20 }}
            className="relative max-w-md overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão fechar */}
            <button
              onClick={dismiss}
              className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Link para o site do patrocinador */}
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              {/* Banner imagem */}
              <div className="relative aspect-video overflow-hidden bg-zinc-800">
                <img
                  src={banner.bannerUrl}
                  alt={banner.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = "none";
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <p className="text-xs font-bold text-white">
                    {banner.name}
                    <span className="ml-2 inline-flex items-center gap-1 text-emerald-400">
                      Ver oferta <ExternalLink className="h-3 w-3" />
                    </span>
                  </p>
                </div>
              </div>
            </a>

            {/* Indicadores (se mais de 1 banner) */}
            {banners.length > 1 && (
              <div className="flex justify-center gap-1.5 p-2">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentIndex ? "w-6 bg-emerald-500" : "w-1.5 bg-zinc-600"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Texto "Patrocinado" */}
            <div className="px-3 pb-2 text-center">
              <p className="text-[9px] text-zinc-500">Patrocinado · MeuCorre</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
