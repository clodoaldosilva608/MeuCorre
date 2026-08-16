"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Check, Loader2, Smartphone } from "lucide-react";

// ===== Modal de Instalação PWA com barra de progresso =====
//
// Fluxo:
// 1. Usuário clica em "Instalar no celular"
// 2. Modal abre com barra de progresso animada
// 3. Dispara beforeinstallprompt.prompt() (instalador nativo)
// 4. Aguarda userChoice (aceito/recusado)
// 5. Se aceito: barra completa → "Instalado!" → redireciona para /login
// 6. Se recusado: mostra mensagem → fecha modal

interface InstallModalProps {
  open: boolean;
  onClose: () => void;
  onInstalled: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Variável global para capturar o evento
let deferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });
}

export function triggerInstall(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function InstallModal({ open, onClose, onInstalled }: InstallModalProps) {
  const [phase, setPhase] = useState<"idle" | "prompting" | "progress" | "done" | "cancelled">("idle");
  const [progress, setProgress] = useState(0);

  const startInstall = useCallback(async () => {
    if (!deferredPrompt) {
      // Sem beforeinstallprompt — simula download e redireciona
      setPhase("progress");
      // Simula barra de progresso
      for (let i = 0; i <= 100; i += 5) {
        setProgress(i);
        await new Promise((r) => setTimeout(r, 80));
      }
      setPhase("done");
      setTimeout(() => {
        onInstalled();
      }, 1500);
      return;
    }

    setPhase("prompting");
    try {
      await deferredPrompt.prompt();
      setPhase("progress");

      // Anima a barra enquanto aguarda a escolha do usuário
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress = Math.min(90, currentProgress + Math.random() * 15);
        setProgress(currentProgress);
      }, 300);

      const choice = await deferredPrompt.userChoice;
      clearInterval(interval);

      if (choice.outcome === "accepted") {
        // Completa a barra
        setProgress(100);
        setPhase("done");
        deferredPrompt = null;
        // Redireciona após 1.5s
        setTimeout(() => {
          onInstalled();
        }, 1500);
      } else {
        setPhase("cancelled");
        deferredPrompt = null;
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch {
      // Erro — fecha modal
      setPhase("cancelled");
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  }, [onInstalled, onClose]);

  // Inicia a instalação quando o modal abre
  useEffect(() => {
    if (open && phase === "idle") {
      startInstall();
    }
    if (!open) {
      setPhase("idle");
      setProgress(0);
    }
  }, [open, phase, startInstall]);

  // Listener para appinstalled (PWA foi instalado)
  useEffect(() => {
    const handler = () => {
      setProgress(100);
      setPhase("done");
      setTimeout(() => {
        onInstalled();
      }, 1500);
    };
    window.addEventListener("appinstalled", handler);
    return () => window.removeEventListener("appinstalled", handler);
  }, [onInstalled]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && phase !== "progress" && phase !== "prompting") {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mx-4 w-full max-w-sm rounded-3xl border border-zinc-700 bg-zinc-900 p-8 text-center"
          >
            {/* Ícone */}
            <div className="mb-6 flex justify-center">
              {phase === "done" ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/40"
                >
                  <Check className="h-10 w-10 text-white" strokeWidth={3} />
                </motion.div>
              ) : phase === "cancelled" ? (
                <div className="grid h-20 w-20 place-items-center rounded-full bg-zinc-800">
                  <Smartphone className="h-10 w-10 text-zinc-500" />
                </div>
              ) : (
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 border-2 border-emerald-500/30"
                >
                  <Download className="h-10 w-10 text-emerald-400" />
                </motion.div>
              )}
            </div>

            {/* Título */}
            <h2 className="text-xl font-black text-white">
              {phase === "done"
                ? "MeuCorre instalado!"
                : phase === "cancelled"
                  ? "Instalação cancelada"
                  : phase === "prompting"
                    ? "Confirme a instalação"
                    : "Instalando MeuCorre..."}
            </h2>

            {/* Descrição */}
            <p className="mt-2 text-sm text-zinc-400">
              {phase === "done"
                ? "Abrindo o app..."
                : phase === "cancelled"
                  ? "Você pode tentar novamente quando quiser."
                  : phase === "prompting"
                    ? "Toque em 'Instalar' no prompt do navegador."
                    : "Aguarde enquanto o app é instalado no seu celular."}
            </p>

            {/* Barra de progresso */}
            {(phase === "progress" || phase === "done") && (
              <div className="mt-6">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="mt-2 text-xs font-medium text-emerald-400">
                  {progress < 100 ? `${Math.round(progress)}%` : "Concluído!"}
                </p>
              </div>
            )}

            {/* Loader quando aguardando prompt */}
            {phase === "prompting" && (
              <div className="mt-6 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
              </div>
            )}

            {/* Botão fechar (só em cancelled) */}
            {phase === "cancelled" && (
              <button
                onClick={onClose}
                className="mt-6 w-full rounded-xl border border-zinc-700 bg-zinc-800 py-3 text-sm font-bold text-zinc-300 transition hover:bg-zinc-700"
              >
                Fechar
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
