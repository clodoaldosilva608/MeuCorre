"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Bike,
  TrendingDown,
  Target,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Check,
  Zap,
} from "lucide-react";

// ===== Página /quiz — Quiz de captação de leads =====
//
// Funil: Landing → Quiz (4 perguntas) → captura email/phone → resultado
// personalizado → CTA para /app
//
// Inspirado no ValidaSaaS: quiz interativo que segmenta o usuário e mostra
// um resultado personalizado antes de pedir o email. Isso aumenta a taxa
// de conversão porque o usuário já vê valor antes de se cadastrar.

interface Question {
  id: keyof Answers;
  icon: typeof Bike;
  title: string;
  subtitle?: string;
  options: { value: string; label: string; emoji?: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: "q1",
    icon: Bike,
    title: "Quantas corridas você faz por dia?",
    subtitle: "Isso nos ajuda a estimar seu volume",
    options: [
      { value: "less_5", label: "Menos de 5", emoji: "🛵" },
      { value: "5_10", label: "5 a 10", emoji: "🏍️" },
      { value: "10_20", label: "10 a 20", emoji: "🚀" },
      { value: "more_20", label: "Mais de 20", emoji: "💨" },
    ],
  },
  {
    id: "q2",
    icon: Target,
    title: "Qual app você mais usa?",
    subtitle: "Seu app principal de entrega",
    options: [
      { value: "ifood", label: "iFood", emoji: "🍽️" },
      { value: "99food", label: "99Food", emoji: "🟠" },
      { value: "lalamove", label: "Lalamove", emoji: "📦" },
      { value: "rappi", label: "Rappi", emoji: "🛍️" },
      { value: "uber", label: "Uber", emoji: "🚕" },
      { value: "other", label: "Outro / Independente", emoji: "🚀" },
    ],
  },
  {
    id: "q3",
    icon: TrendingDown,
    title: "Você sabe quanto sobra no fim do dia?",
    subtitle: "Depois de tirar gasolina, comida, manutenção...",
    options: [
      { value: "yes", label: "Sim, controlo tudo", emoji: "📊" },
      { value: "more_less", label: "Mais ou menos", emoji: "🤔" },
      { value: "no_idea", label: "Não faço ideia", emoji: "😵" },
    ],
  },
  {
    id: "q4",
    icon: AlertTriangle,
    title: "Qual sua maior dificuldade hoje?",
    subtitle: "O que mais te trava de saber seu lucro real",
    options: [
      { value: "gasolina", label: "Controlar gasolina/despesas", emoji: "⛽" },
      { value: "which_app", label: "Saber qual app dá mais", emoji: "💸" },
      { value: "multi_app", label: "Organizar multi-app", emoji: "🔀" },
      { value: "taxes", label: "Declarar imposto de renda", emoji: "🧾" },
    ],
  },
];

interface Answers {
  q1?: string;
  q2?: string;
  q3?: string;
  q4?: string;
}

export default function QuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0-3 = perguntas, 4 = captura, 5 = resultado
  const [answers, setAnswers] = useState<Answers>({});
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    title: string;
    message: string;
    weeklyLoss: number;
  } | null>(null);
  const [referrerCode, setReferrerCode] = useState<string | null>(null);

  // Detecta ?ref=CODE na URL (link de indicação)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setReferrerCode(ref.toUpperCase());
      localStorage.setItem("meucorre_referral_code", ref.toUpperCase());
    }
  }, []);

  const handleAnswer = (questionId: keyof Answers, value: string) => {
    setAnswers({ ...answers, [questionId]: value });
    // Auto-avança para próxima pergunta após 300ms
    setTimeout(() => {
      if (step < QUESTIONS.length - 1) {
        setStep(step + 1);
      } else {
        setStep(QUESTIONS.length); // vai para captura de email
      }
    }, 300);
  };

  const handleSubmit = async () => {
    if (!email) {
      toast.error("Digite seu email");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone: phone || undefined,
          name: name || undefined,
          answers,
          referrerCode: referrerCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao enviar");
        return;
      }
      setResult(data.result);
      setStep(QUESTIONS.length + 1); // vai para resultado
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToApp = () => {
    router.push("/app");
  };

  // ===== Renderização =====

  // Step 0-3: perguntas
  if (step < QUESTIONS.length) {
    const q = QUESTIONS[step];
    const Icon = q.icon;
    const progress = ((step + 1) / (QUESTIONS.length + 1)) * 100;

    return (
      <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
        {/* Progress bar */}
        <div className="h-1.5 w-full bg-zinc-800">
          <motion.div
            className="h-full bg-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="mb-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                  Pergunta {step + 1} de {QUESTIONS.length}
                </p>
                <h1 className="mt-2 text-2xl font-black leading-tight">
                  {q.title}
                </h1>
                {q.subtitle && (
                  <p className="mt-1.5 text-sm text-zinc-400">{q.subtitle}</p>
                )}
              </div>

              {/* Opções */}
              <div className="space-y-2.5">
                {q.options.map((opt) => {
                  const isSelected = answers[q.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(q.id, opt.value)}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                        isSelected
                          ? "border-emerald-400 bg-emerald-400/10"
                          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/50"
                      }`}
                    >
                      {opt.emoji && (
                        <span className="text-2xl">{opt.emoji}</span>
                      )}
                      <span className="flex-1 text-sm font-semibold text-white">
                        {opt.label}
                      </span>
                      {isSelected && (
                        <Check className="h-5 w-5 text-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Voltar */}
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="mt-6 flex items-center justify-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Voltar
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Step 4: captura de email
  if (step === QUESTIONS.length) {
    const progress = ((QUESTIONS.length + 1) / (QUESTIONS.length + 1)) * 100;
    return (
      <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
        <div className="h-1.5 w-full bg-zinc-800">
          <motion.div
            className="h-full bg-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
                  <Zap className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-black leading-tight">
                Quase lá! Onde mandamos seu resultado?
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Vamos calcular quanto você está perdendo e te enviar a análise.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Nome (opcional)</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="border-zinc-700 bg-zinc-900 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="border-zinc-700 bg-zinc-900 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">
                  WhatsApp (opcional — para dicas)
                </Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="border-zinc-700 bg-zinc-900 text-white"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!email || submitting}
                className="w-full bg-emerald-500 py-4 text-base font-bold text-zinc-950 hover:bg-emerald-400"
              >
                {submitting ? "Calculando..." : "Ver meu resultado"}
                {!submitting && <ArrowRight className="ml-1.5 h-4 w-4" />}
              </Button>

              <p className="text-center text-[10px] text-zinc-500">
                Seus dados ficam seguros. Não compartilhamos com terceiros.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Step 5: resultado
  if (step === QUESTIONS.length + 1 && result) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            {/* Ícone de alerta */}
            <div className="mb-6 flex justify-center">
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/30">
                <TrendingDown className="h-10 w-10 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-black leading-tight text-white">
              {result.title}
            </h1>

            {/* Card com valor de perda */}
            {result.weeklyLoss > 0 && (
              <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
                  Estimativa de perda
                </p>
                <p className="mt-1 text-4xl font-black text-red-400">
                  R$ {result.weeklyLoss}
                  <span className="text-base font-normal text-zinc-400">
                    /semana
                  </span>
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  ≈ R$ {(result.weeklyLoss * 4).toFixed(0)}/mês
                </p>
              </div>
            )}

            <p className="mt-6 text-sm leading-relaxed text-zinc-300">
              {result.message}
            </p>

            {/* CTA para o app */}
            <div className="mt-8 space-y-3">
              <Button
                onClick={handleGoToApp}
                className="w-full bg-emerald-500 py-4 text-base font-bold text-zinc-950 hover:bg-emerald-400"
              >
                <Zap className="mr-1.5 h-4 w-4" />
                Baixar grátis e resolver isso
              </Button>
              <p className="text-[10px] text-zinc-500">
                App grátis • 14 dias de trial PRO • sem cartão de crédito
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}
