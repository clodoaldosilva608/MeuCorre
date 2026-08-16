"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

// ===== Botão "Baixar grátis" =====
//
// Fluxo:
// 1. Dispara o beforeinstallprompt (PWA install) se disponível
// 2. Em paralelo, redireciona para /quiz (criar conta)
// 3. Se beforeinstallprompt não disponível (iOS/Safari), mostra toast
//    com instruções e redireciona para /quiz
//
// Uso: <DownloadButton />

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function DownloadButton({
  className = "",
  children = "Baixar grátis",
  ctaOrigin = "hero_free_download",
}: {
  className?: string;
  children?: React.ReactNode;
  ctaOrigin?: string;
}) {
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Captura o evento beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleClick = async () => {
    // Se já está instalado (standalone), vai direto pro quiz
    if (window.matchMedia("(display-mode: standalone)").matches) {
      router.push("/quiz");
      return;
    }

    // Se tem beforeinstallprompt (Chrome/Android/Edge), dispara o prompt
    if (deferredPrompt) {
      setInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setInstalled(true);
          toast.success("Instalando MeuCorre...", {
            description: "Abra pela tela inicial quando terminar.",
          });
        }
        // Independente de aceitar ou não, redireciona para criar conta
        setDeferredPrompt(null);
      } catch {
        // Erro no prompt — continua para o quiz
      } finally {
        setInstalling(false);
      }
      // Redireciona para o quiz (criar conta) após 1.5s
      setTimeout(() => router.push("/quiz"), 1500);
    } else {
      // iOS/Safari — não tem beforeinstallprompt
      toast.info("Para instalar no iPhone:", {
        description: "Toque em Compartilhar → Adicionar à Tela de Início",
        duration: 4000,
      });
      // Redireciona para o quiz após 1.5s
      setTimeout(() => router.push("/quiz"), 1500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={installing}
      data-cta-origin={ctaOrigin}
      aria-label="Baixar grátis — instalar app e criar conta"
      className={className}
    >
      {installing ? (
        <>
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          Instalando...
        </>
      ) : installed ? (
        <>
          <Check className="mr-1.5 h-4 w-4" />
          Instalado!
        </>
      ) : (
        <>
          <Download className="mr-1.5 h-4 w-4" />
          {children}
        </>
      )}
    </button>
  );
}
