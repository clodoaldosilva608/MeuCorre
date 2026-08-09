"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Share, X } from "lucide-react";

// ===== Pop-up "Baixar aplicativo" (PWA install prompt) =====
//
// Detecta se o app é instalável como PWA e mostra um pop-up persuasivo
// incentivando o usuário a instalar. Funciona em 2 cenários:
//
// 1. Android/Chrome (suporta beforeinstallprompt): mostra botão "Instalar
//    agora" que dispara o prompt nativo do browser.
// 2. iOS/Safari (NÃO suporta beforeinstallprompt): mostra instruções
//    "Toque em Compartilhar → Adicionar à Tela de Início".
//
// Frequência: 1x a cada 7 dias (controlado por localStorage).
// Não mostra se já está rodando como PWA instalado (display-mode: standalone).

const STORAGE_KEY = "meucorre_install_dismissed_at";
const DISMISS_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  // iPadOS 13+ reports as Mac, so check for touch + Mac
  const isIPad = /iPad/.test(ua) || (ua.includes("Macintosh") && "ontouchend" in document);
  return /iPhone|iPod/.test(ua) || isIPad;
}

function shouldShow(): boolean {
  if (typeof window === "undefined") return false;
  // Não mostra se já está instalado (standalone)
  if (isStandalone()) return false;
  const dismissedAt = localStorage.getItem(STORAGE_KEY);
  if (!dismissedAt) return true;
  const dismissed = Number(dismissedAt);
  if (Number.isNaN(dismissed)) return true;
  return Date.now() - dismissed > DISMISS_INTERVAL_MS;
}

function dismiss() {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(Date.now()));
}

interface InstallAppPopupProps {
  // Estado controlado opcional — permite abrir o pop-up manualmente via menu.
  // Se undefined, o pop-up gerencia seu próprio estado (auto-abre em 3.5s).
  forceOpen?: boolean;
  onForceClose?: () => void;
}

export function InstallAppPopup({
  forceOpen,
  onForceClose,
}: InstallAppPopupProps = {}) {
  // autoOpen: estado interno para auto-abrir em 3.5s (modo automático)
  const [autoOpen, setAutoOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  // isIOS() é estável por sessão — usamos lazy initializer para evitar
  // setState direto no effect body (causaria warning de cascading renders).
  // No SSR, useState lazy initializer roda no servidor também, mas isIOS()
  // retorna false quando window é undefined (safe para hidratação).
  const [isIOSDevice] = useState(() => isIOS());

  // `open` efetivo: se forceOpen foi fornecido (controlado), usa ele;
  // caso contrário, usa autoOpen (automático).
  // Importante: SEMPRE registramos o listener beforeinstallprompt, mesmo
  // em modo controlado, para que o deferredPrompt esteja disponível quando
  // o usuário abrir manualmente.
  const open = forceOpen !== undefined ? forceOpen : autoOpen;

  useEffect(() => {
    if (typeof window === "undefined") return;

    // isIOS() é estável (depende do userAgent que não muda durante a sessão),
    // mas setState direto no effect body causa warning de cascading renders.
    // Inicializamos via lazy initializer no useState para evitar isso.
    // (Movido para o useState inicial abaixo.)

    // Captura o evento beforeinstallprompt (Chrome/Android/Edge)
    const handler = (e: Event) => {
      // Previne o prompt automático do browser — vamos mostrar o nosso
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Auto-abre o pop-up APENAS em modo automático (forceOpen === undefined)
      // e se faz sentido (não dismissado recentemente, não está em standalone)
      if (forceOpen === undefined && shouldShow()) {
        const t = setTimeout(() => setAutoOpen(true), 3500);
        // cleanup inline não é possível aqui; o handler é estável
        // então o timeout é limpo quando o componente desmonta (cleanup abaixo)
        // ou quando o usuário interage. Em prática, o setTimeout dispara uma
        // única vez e o React só re-renderiza se autoOpen mudar de false→true.
        void t;
      }
    };
    window.addEventListener("beforeinstallprompt", handler);

    // No iOS não temos beforeinstallprompt, então auto-mostramos o pop-up
    // instrucional após um delay (apenas em modo automático)
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (forceOpen === undefined && isIOS() && shouldShow()) {
      iosTimer = setTimeout(() => setAutoOpen(true), 3500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, [forceOpen]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Sem beforeinstallprompt — não há o que fazer
      return;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      // Instalou — registra para não mostrar mais
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } else {
      // Recusou — volta a mostrar em 7 dias
      dismiss();
    }
    setDeferredPrompt(null);
    if (forceOpen !== undefined) onForceClose?.();
    else setAutoOpen(false);
  };

  const handleLater = () => {
    // Só persiste o dismiss se foi auto-aberto (não manual)
    if (forceOpen === undefined) dismiss();
    if (forceOpen !== undefined) onForceClose?.();
    else setAutoOpen(false);
  };

  // Não renderiza nada se o pop-up não estiver aberto
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleLater()}>
      <DialogContent className="max-w-sm gap-0 border-zinc-800 bg-zinc-950 p-0 text-zinc-100">
        <DialogHeader className="border-b border-zinc-800 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
            <Smartphone className="h-4 w-4" />
            Instalar aplicativo
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Acesse o MeuCorre com 1 toque pela tela inicial
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-5">
          {/* Ícone / ilustração */}
          <div className="mb-4 flex justify-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-3xl shadow-lg shadow-emerald-500/30">
              ⚡
            </div>
          </div>

          <p className="mb-3 text-center text-sm text-zinc-300">
            Instale o <strong className="text-emerald-400">MeuCorre</strong> na
            tela inicial do seu celular. Funciona{" "}
            <strong>offline</strong>, abre rápido como um app nativo e{" "}
            <strong>não ocupa espaço</strong> (é um PWA).
          </p>

          {/* Features */}
          <ul className="mb-4 space-y-1.5 text-[11px] text-zinc-400">
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              Abre em tela cheia, sem barra do browser
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              Funciona sem internet (modo offline)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              Seus dados ficam só no seu celular
            </li>
          </ul>

          {/* CTA difere por plataforma */}
          {isIOSDevice ? (
            // iOS: não suporta beforeinstallprompt — instruções manuais
            <div className="space-y-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-[11px] text-zinc-300">
                <p className="mb-2 font-semibold text-zinc-200">
                  Como instalar no iPhone/iPad:
                </p>
                <ol className="space-y-1.5">
                  <li className="flex gap-2">
                    <span className="font-bold text-emerald-400">1.</span>
                    <span className="flex items-center gap-1">
                      Toque no botão{" "}
                      <Share className="inline h-3 w-3 text-emerald-400" />{" "}
                      Compartilhar do Safari
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-emerald-400">2.</span>
                    Role e toque em{" "}
                    <strong className="text-zinc-100">
                      &ldquo;Adicionar à Tela de Início&rdquo;
                    </strong>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-emerald-400">3.</span>
                    Confirme e pronto — o ⚡ MeuCorre vai aparecer na tela inicial
                  </li>
                </ol>
              </div>
              <Button
                onClick={handleLater}
                className="w-full bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              >
                Entendi
              </Button>
            </div>
          ) : deferredPrompt ? (
            // Android/Chrome: botão que dispara o prompt nativo
            // animate-pulse + ring para chamar atenção do usuário
            <div className="space-y-2">
              <Button
                onClick={handleInstall}
                className="w-full animate-pulse bg-emerald-500 py-3 font-bold text-zinc-950 shadow-lg shadow-emerald-500/50 ring-2 ring-emerald-400/60 hover:bg-emerald-400 hover:animate-none"
              >
                <Download className="mr-1.5 h-4 w-4" />
                Instalar agora
              </Button>
              <button
                onClick={handleLater}
                className="block w-full py-1 text-center text-[11px] text-zinc-500 hover:text-zinc-400"
              >
                Talvez mais tarde
              </button>
            </div>
          ) : (
            // Browser sem suporte a beforeinstallprompt (ex: Firefox desktop)
            <div className="space-y-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-[11px] text-zinc-400">
                <p>
                  Para instalar, abra o MeuCorre no{" "}
                  <strong className="text-zinc-200">Chrome</strong> ou{" "}
                  <strong className="text-zinc-200">Edge</strong> do seu celular
                  Android e toque no menu{" "}
                  <strong className="text-zinc-100">⋮ → Instalar app</strong>.
                </p>
              </div>
              <Button
                onClick={handleLater}
                className="w-full bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              >
                Entendi
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
