"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Bike,
  Wallet,
  BarChart3,
  ShoppingBag,
  Route,
  Target,
  Bell,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

const STORAGE_KEY = "meucorre_onboarding_done";

const STEPS = [
  {
    icon: "⚡",
    title: "Bem-vindo ao MeuCorre!",
    description: "Seu app para controlar corridas, despesas e lucro real como entregador. Vamos fazer um tour rápido?",
    color: "from-emerald-400 to-emerald-600",
    features: [],
  },
  {
    icon: Bike,
    title: "1. Registre suas corridas",
    description: "Toque no botão \"+ Nova corrida\" e informe o app (iFood, 99Food, etc), valor e km. Tudo fica salvo no seu celular, mesmo offline.",
    color: "from-blue-400 to-blue-600",
    features: [
      "Funciona com qualquer app de entrega",
      "Salva offline — sem precisar de internet",
      "Editar e excluir a qualquer momento",
    ],
  },
  {
    icon: Wallet,
    title: "2. Controle suas despesas",
    description: "Registre combustível, alimentação, manutenção e pedágios. Assim você sabe seu lucro real, não só o faturamento.",
    color: "from-red-400 to-red-600",
    features: [
      "6 categorias prontas (combustível, manutenção, etc)",
      "Veja despesas por categoria",
      "Compare com seus ganhos",
    ],
  },
  {
    icon: Route,
    title: "3. Corre do dia",
    description: "Cronômetro + GPS: toque em \"Iniciar corre\" e o app rastreia automaticamente o tempo trabalhado e a distância percorrida.",
    color: "from-emerald-400 to-emerald-600",
    features: [
      "Cronômetro em tempo real (HH:MM:SS)",
      "Distância via GPS (km percorridos)",
      "Histórico de sessões por dia",
    ],
  },
  {
    icon: Target,
    title: "4. Defina metas",
    description: "Estabeleça metas diárias, semanais ou mensais de faturamento. A barra de progresso mostra quanto falta para bater sua meta.",
    color: "from-amber-400 to-amber-600",
    features: [
      "Metas diária, semanal ou mensal",
      "Barra de progresso em tempo real",
      "Saiba quanto falta para bater a meta",
    ],
  },
  {
    icon: BarChart3,
    title: "5. Veja seus gráficos",
    description: "Acompanhe a evolução dos seus ganhos e despesas ao longo dos últimos 7 dias. Identifique seus melhores dias e horários.",
    color: "from-purple-400 to-purple-600",
    features: [
      "Gráfico de ganhos vs despesas (7 dias)",
      "Breakdown por app de entrega",
      "Despesas por categoria",
    ],
  },
  {
    icon: ShoppingBag,
    title: "6. Ofertas exclusivas",
    description: "Produtos com desconto selecionados para entregadores: mochilas térmicas, capas de chuva, suportes de celular e muito mais.",
    color: "from-pink-400 to-pink-600",
    features: [
      "Curadoria de produtos úteis",
      "Descontos exclusivos",
      "PRO vê todas as ofertas",
    ],
  },
  {
    icon: Bell,
    title: "7. Capture por notificação",
    description: "Quando o app de entrega te avisa de uma corrida, você pode registrar a corrida com 1 toque direto da notificação do MeuCorre.",
    color: "from-cyan-400 to-cyan-600",
    features: [
      "Detecção automática de app e valor",
      "1 toque para registrar",
      "Funciona com qualquer app de entrega",
    ],
  },
  {
    icon: "⚡",
    title: "Pronto para começar!",
    description: "Tudo certo! Seus dados ficam salvos no seu celular — 100% offline e privado. Bora fazer a primeira corrida?",
    color: "from-emerald-400 to-emerald-600",
    features: [],
    isLast: true,
  },
] as const;

interface OnboardingPopupProps {
  forceOpen?: boolean;
  onForceClose?: () => void;
}

export function OnboardingPopup({ forceOpen, onForceClose }: OnboardingPopupProps = {}) {
  const [step, setStep] = useState(0);
  const [autoOpen, setAutoOpen] = useState(false);

  useEffect(() => {
    if (forceOpen !== undefined) return;
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const t = setTimeout(() => setAutoOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, [forceOpen]);

  const open = forceOpen !== undefined ? forceOpen : autoOpen;

  const handleClose = () => {
    if (forceOpen !== undefined) {
      onForceClose?.();
    } else {
      setAutoOpen(false);
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
      setStep(0);
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSkip = () => {
    handleClose();
    setStep(0);
  };

  if (!open) return null;

  const currentStep = STEPS[step];
  const Icon = currentStep.icon;
  const isLast = "isLast" in currentStep && currentStep.isLast;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleSkip()}>
      <DialogContent className="max-w-md gap-0 border-zinc-800 bg-zinc-950 p-0 text-zinc-100 [&>button]:hidden">
        <div className={`relative overflow-hidden bg-gradient-to-br ${currentStep.color} p-6 text-center`}>
          <button
            onClick={handleSkip}
            className="absolute right-3 top-3 rounded-full bg-black/20 px-2 py-1 text-[10px] font-semibold text-white/80 hover:bg-black/30 hover:text-white"
          >
            Pular
          </button>

          <div className="mb-2 flex justify-center">
            {typeof Icon === "string" ? (
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/20 text-4xl backdrop-blur-sm">
                {Icon}
              </div>
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Icon className="h-8 w-8 text-white" />
              </div>
            )}
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i === step ? "w-4 bg-white" : i < step ? "w-1.5 bg-white/70" : "w-1.5 bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogHeader className="px-6 pt-5">
          <DialogTitle className="text-center text-lg font-bold text-zinc-100">
            {currentStep.title}
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-center text-sm leading-relaxed text-zinc-400">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>

        {"features" in currentStep && currentStep.features.length > 0 && (
          <div className="space-y-2 px-6 py-4">
            {currentStep.features.map((feature, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-zinc-800 px-6 py-4">
          {step > 0 ? (
            <Button onClick={handlePrev} variant="ghost" className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              Voltar
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500">
              {step + 1} / {STEPS.length}
            </span>
            <Button onClick={handleNext} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400">
              {isLast ? (
                <>
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Começar
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
