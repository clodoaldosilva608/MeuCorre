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
  Lock,
  Sparkles,
  PartyPopper,
  CreditCard,
} from "lucide-react";

// ===== Página /quiz — Quiz de captação de leads com criação de conta =====
//
// Funil: Landing → Quiz (4 perguntas) → captura email/WhatsApp + senha
// → resultado personalizado → cria conta automaticamente (trial 14 dias)
// → login automático → redireciona para /app
//
// Diferente do fluxo original, o lead é OBRIGADO a criar conta para ver o
// resultado completo. Isso converte lead em usuário ativo imediatamente,
// ativando o trial de 14 dias desde o primeiro contato.

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
  {
    id: "q5",
    icon: Sparkles,
    title: "Onde você nos encontrou?",
    subtitle: "Ajude a gente a chegar em mais entregadores",
    options: [
      { value: "instagram", label: "Instagram", emoji: "📷" },
      { value: "tiktok", label: "TikTok", emoji: "🎵" },
      { value: "youtube", label: "YouTube", emoji: "▶️" },
      { value: "facebook", label: "Facebook", emoji: "👍" },
      { value: "indicacao", label: "Indicação de amigo", emoji: "🤝" },
      { value: "google", label: "Google", emoji: "🔍" },
      { value: "outro", label: "Outro", emoji: "✨" },
    ],
  },
];

interface Answers {
  q1?: string;
  q2?: string;
  q3?: string;
  q4?: string;
  q5?: string;
}

export default function QuizPage() {
  const router = useRouter();
  // Steps: 0-4 = perguntas, 5 = criação de conta, 6 = sucesso (conta criada)
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
    setTimeout(() => {
      if (step < QUESTIONS.length - 1) {
        setStep(step + 1);
      } else {
        setStep(QUESTIONS.length); // vai para criação de conta
      }
    }, 300);
  };

  // Validação de WhatsApp — aceita formatos (11) 99999-9999, 11999999999, etc.
  const isValidPhone = (p: string) => {
    const digits = p.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 13;
  };

  // Validação de senha — mínimo 6 caracteres
  const isValidPassword = (p: string) => p.length >= 6;

  // Submete o quiz + cria conta + faz login automaticamente
  const handleCreateAccount = async () => {
    // Validações
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Digite seu nome completo");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      toast.error("Digite um email válido");
      return;
    }
    if (!isValidPhone(phone)) {
      toast.error("Digite um WhatsApp válido (ex: (11) 99999-9999)");
      return;
    }
    if (!isValidPassword(password)) {
      toast.error("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Salva o lead (quiz answers + score)
      const quizRes = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          name: name.trim(),
          answers,
          referrerCode: referrerCode || undefined,
        }),
      });
      if (!quizRes.ok) {
        const data = await quizRes.json().catch(() => ({}));
        // Continua mesmo se o lead falhar — o registro é mais importante
        console.warn("[quiz] Lead save falhou:", data.error);
      }

      // 2. Cria a conta do usuário (ativa trial de 14 dias automaticamente)
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password,
          phone: phone.trim(),
          referralCode: referrerCode || undefined,
        }),
      });
      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        // Se email já existe, tenta fazer login com a senha informada
        if (registerData.error?.includes("já cadastrado")) {
          toast.error("Email já cadastrado. Redirecionando para login...", {
            duration: 2000,
          });
          setTimeout(() => router.push("/login"), 1500);
          return;
        }
        toast.error(registerData.error || "Erro ao criar conta");
        return;
      }

      // 3. Conta criada + login automático (cookie httpOnly setado pela API)
      // Marca o lead como convertido (best-effort, não bloqueia)
      fetch("/api/quiz/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      }).catch(() => {});

      // 4. Vai para a tela de sucesso
      setStep(QUESTIONS.length + 1);
      toast.success("Conta criada! Seu trial de 14 dias está ativo 🎉");
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
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

  // Step 4: criação de conta (email + WhatsApp + senha obrigatórios)
  if (step === QUESTIONS.length) {
    const progress = ((QUESTIONS.length + 1) / (QUESTIONS.length + 1)) * 100;
    const canSubmit =
      name.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
      isValidPhone(phone) &&
      isValidPassword(password);

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
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-black leading-tight">
                Crie sua conta grátis
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Veja seu resultado e ative seu <strong className="text-emerald-400">trial de 14 dias PRO</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Nome completo *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="João Silva"
                  className="border-zinc-700 bg-zinc-900 text-white"
                  autoComplete="name"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="border-zinc-700 bg-zinc-900 text-white"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">WhatsApp *</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="border-zinc-700 bg-zinc-900 text-white"
                  autoComplete="tel"
                  inputMode="tel"
                />
                <p className="text-[10px] text-zinc-500">
                  Usamos para enviar dicas e lembretes. Não compartilhamos.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Senha *</Label>
                <div className="relative">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="border-zinc-700 bg-zinc-900 pl-9 text-white"
                    autoComplete="new-password"
                  />
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                </div>
              </div>

              <Button
                onClick={handleCreateAccount}
                disabled={!canSubmit || submitting}
                className="w-full bg-emerald-500 py-4 text-base font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {submitting ? (
                  "Criando sua conta..."
                ) : (
                  <>
                    <Check className="mr-1.5 h-4 w-4" />
                    Ver resultado e ativar trial
                  </>
                )}
                {!submitting && <ArrowRight className="ml-1.5 h-4 w-4" />}
              </Button>

              <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" />
                  Dados seguros
                </span>
                <span>•</span>
                <span>Sem cartão de crédito</span>
                <span>•</span>
                <span>Cancele quando quiser</span>
              </div>

              {/* Separador */}
              <div className="my-2 flex items-center gap-3">
                <div className="h-px flex-1 bg-zinc-800" />
                <span className="text-[10px] font-medium text-zinc-600">ou</span>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>

              {/* Opções alternativas */}
              <a
                href="/login"
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 py-3.5 text-sm font-bold text-emerald-400 transition-all hover:bg-emerald-500/10"
              >
                Já tenho conta — fazer login
              </a>

              <a
                href="/#planos"
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 py-3.5 text-sm font-bold text-amber-400 transition-all hover:bg-amber-500/10"
              >
                <CreditCard className="h-4 w-4" />
                Quero ser PRO agora
              </a>

              <button
                onClick={() => {
                  const deferredPrompt = (window as unknown as { deferredPrompt?: { prompt: () => void } }).deferredPrompt;
                  if (deferredPrompt) {
                    deferredPrompt.prompt();
                  } else {
                    toast.info("Para instalar:", {
                      description: "Toque no menu do navegador (⋮) → 'Adicionar à tela inicial'",
                    });
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10"
              >
                <Sparkles className="h-4 w-4" />
                Instalar no celular
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Step 5: sucesso — conta criada + trial ativo
  if (step === QUESTIONS.length + 1) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Ícone de sucesso */}
            <div className="mb-6 flex justify-center">
              <div className="grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-2xl shadow-emerald-500/40">
                <PartyPopper className="h-12 w-12 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-black leading-tight text-white">
              Conta criada! 🎉
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Seu trial de <strong className="text-emerald-400">14 dias PRO</strong> está ativo
            </p>

            {/* Card com benefícios do trial */}
            <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-left">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                O que você tem agora:
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  Acesso total ao app por 14 dias
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  Corridas, despesas e gráficos ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  Corre do dia com GPS
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  Mapa de calor de áreas quentes
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  Sem anúncios por 14 dias
                </li>
              </ul>
            </div>

            {/* CTAs: Criar conta + Fazer login + Adquirir plano + Instalar PWA */}
            <div className="mt-8 space-y-3">
              {/* Criar conta (ação principal) */}
              <Button
                onClick={handleGoToApp}
                className="w-full bg-emerald-500 py-4 text-base font-bold text-zinc-950 hover:bg-emerald-400"
              >
                <Zap className="mr-1.5 h-4 w-4" />
                Criar conta e começar
              </Button>

              {/* Fazer login */}
              <a
                href="/login"
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 py-3.5 text-sm font-bold text-emerald-400 transition-all hover:bg-emerald-500/10"
              >
                Já tenho conta — fazer login
              </a>

              {/* Adquirir um plano */}
              <a
                href="/#planos"
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 py-3.5 text-sm font-bold text-amber-400 transition-all hover:bg-amber-500/10"
              >
                <CreditCard className="h-4 w-4" />
                Quero ser PRO agora
              </a>

              {/* Instalar PWA */}
              <button
                onClick={() => {
                  const deferredPrompt = (window as unknown as { deferredPrompt?: { prompt: () => void } }).deferredPrompt;
                  if (deferredPrompt) {
                    deferredPrompt.prompt();
                  } else {
                    toast.info("Para instalar:", {
                      description: "Toque no menu do navegador (⋮) → 'Adicionar à tela inicial'",
                    });
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10"
              >
                <Sparkles className="h-4 w-4" />
                Instalar no celular
              </button>

              <p className="text-[10px] text-zinc-500">
                Após 14 dias: 5 lançamentos/dia grátis para sempre ou PRO a partir de R$ 14,90/mês
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}
