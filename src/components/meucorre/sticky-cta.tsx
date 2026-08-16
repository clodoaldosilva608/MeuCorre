"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";

// ===== Sticky CTA no mobile =====
// Aparece fixo no rodapé quando o usuário rola além do hero (300px+)
// Some quando o rodapé aparece (para não sobrepor)
// Só aparece no mobile (sm:hidden)

export function StickyCTA({ href }: { href: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Mostra após rolar 300px
      const shouldShow = window.scrollY > 300;

      // Esconde se o rodapé está visível (não sobrepor)
      const footer = document.querySelector("footer");
      if (footer && shouldShow) {
        const footerRect = footer.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        // Se o topo do rodapé está acima da parte visível da tela, esconde o CTA
        if (footerRect.top < windowHeight - 20) {
          setVisible(false);
          return;
        }
      }

      setVisible(shouldShow);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-40 sm:hidden"
        >
          <div className="sticky-cta border-t border-neon/20 bg-ink/95 px-4 py-3 backdrop-blur-lg">
            <a
              href={href}
              className="btn-neon flex w-full items-center justify-center gap-2 py-3 text-sm font-bold"
            >
              <Zap className="h-4 w-4" />
              Baixar grátis
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
