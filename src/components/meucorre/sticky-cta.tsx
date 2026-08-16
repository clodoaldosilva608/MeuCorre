"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";

// ===== Sticky CTA no mobile =====
// Aparece fixo no rodapé quando o usuário rola além do hero (300px+)
// Só aparece no mobile (sm:hidden)

export function StickyCTA({ href }: { href: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300);
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
          className="fixed inset-x-0 bottom-0 z-50 sm:hidden"
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
