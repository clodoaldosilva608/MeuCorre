"use client";

import { useState, useEffect, useRef } from "react";

const BANNERS = [
  "/banners/banner-1.jpg",
  "/banners/banner-2.jpg",
  "/banners/banner-3.jpg",
  "/banners/banner-4.jpg",
  "/banners/banner-5.jpg",
  "/banners/banner-6.jpg",
  "/banners/banner-7.jpg",
];

const ROTATION_INTERVAL = 5000; // 5 segundos

interface ReferralBannerRotatorProps {
  onShare: () => void;
}

// Banner rotativo de indicação — mostra imagens promocionais que alternam
// a cada 5 segundos. Clique no banner abre o SharePopup.
//
// LAYOUT: Cada banner é renderizado em seu próprio container com altura
// automática baseada na proporção da imagem. Usa position: relative (não
// absolute) para evitar sobreposição com o conteúdo abaixo.
export function ReferralBannerRotator({ onShare }: ReferralBannerRotatorProps) {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rotaciona banners
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setImgLoaded(false);
      setCurrentBanner((prev) => (prev + 1) % BANNERS.length);
    }, ROTATION_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Pré-carrega banner atual
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.src = BANNERS[currentBanner];
    img.onload = () => {
      if (!cancelled) setImgLoaded(true);
    };
    return () => {
      cancelled = true;
    };
  }, [currentBanner]);

  const goToBanner = (index: number) => {
    setImgLoaded(false);
    setCurrentBanner(index);
    // Reseta o timer para não pular cedo demais
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setImgLoaded(false);
        setCurrentBanner((prev) => (prev + 1) % BANNERS.length);
      }, ROTATION_INTERVAL);
    }
  };

  return (
    <div
      className="relative w-full cursor-pointer overflow-hidden rounded-t-xl bg-zinc-900"
      onClick={onShare}
    >
      {/* Container com altura baseada na imagem */}
      <div className="relative w-full" style={{ minHeight: "120px" }}>
        {imgLoaded ? (
          <img
            src={BANNERS[currentBanner]}
            alt={`Indique e ganhe — banner ${currentBanner + 1}`}
            className="block w-full object-cover"
            style={{ maxHeight: "200px" }}
          />
        ) : (
          <div className="flex h-[120px] w-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        )}
      </div>

      {/* Indicadores (dots) */}
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {BANNERS.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              goToBanner(index);
            }}
            className={`h-2 rounded-full transition-all ${
              index === currentBanner
                ? "w-5 bg-emerald-400"
                : "w-2 bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Ver banner ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
