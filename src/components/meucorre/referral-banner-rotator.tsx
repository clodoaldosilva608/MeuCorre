"use client";

import { useState, useEffect } from "react";

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
export function ReferralBannerRotator({ onShare }: ReferralBannerRotatorProps) {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loaded, setLoaded] = useState<Set<number>>(new Set([0]));

  // Rotaciona banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => {
        const next = (prev + 1) % BANNERS.length;
        // Pré-carrega o próximo banner
        setLoaded((prevLoaded) => {
          const newSet = new Set(prevLoaded);
          newSet.add(next);
          return newSet;
        });
        return next;
      });
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Pré-carrega primeiro banner
  useEffect(() => {
    const img = new Image();
    img.src = BANNERS[0];
    img.onload = () => {
      setLoaded((prev) => new Set(prev).add(0));
    };
  }, []);

  return (
    <div
      className="relative aspect-[3/1] w-full cursor-pointer overflow-hidden"
      onClick={onShare}
    >
      {BANNERS.map((banner, index) => (
        <img
          key={banner}
          src={banner}
          alt={`Banner de indicação ${index + 1}`}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            index === currentBanner ? "opacity-100" : "opacity-0"
          }`}
          loading={index === 0 ? "eager" : "lazy"}
        />
      ))}

      {/* Indicadores (dots) */}
      <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
        {BANNERS.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentBanner(index);
            }}
            className={`h-1.5 rounded-full transition-all ${
              index === currentBanner
                ? "w-4 bg-emerald-400"
                : "w-1.5 bg-white/50"
            }`}
            aria-label={`Banner ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
