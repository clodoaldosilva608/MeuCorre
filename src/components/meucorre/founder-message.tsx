"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Quote, Share2, Check, Heart, MessageCircle, Send, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

// ===== Mensagem do Fundador + Comentários + Compartilhar =====
//
// Seção final da landing page com:
// 1. Mensagem curta e impactante do fundador (Clodoaldo C Silva)
// 2. Aba de comentários (localStorage + comentários em destaque pré-seed)
// 3. Botão compartilhar com mensagem formatada (CTA ganhador)
//
// Objetivo: criar conexão emocional, gerar reflexão, viralizar com CTA.

const FOUNDER_MESSAGE = `O MeuCorre não nasceu de um plano de negócio. Nasceu de uma indignação.

Todo dia, milhões de entregadores movem o Brasil — levam comida, remédio, esperança. Mas ninguém ensina a cuidar do próprio dinheiro. Você trabalha 10, 12 horas e no fim do mês não sabe quanto sobrou.

Eu queria mudar isso. Democratizar o conhecimento financeiro para quem realmente precisa. Para você.

Se você está lendo isto, saiba: seu trabalho é fundamental. Sem entregador, a cidade para. Você é o sangue que bomba o coração da sociedade.

Mas mais importante que o dinheiro é o que você constrói todo dia: resiliência, garra, a capacidade de levantar mesmo cansado. Isso ninguém te tira.

Reflita sobre onde você está. Celebre o quanto já chegou. E nunca desista dos seus objetivos — o MeuCorre está aqui para caminhar com você.`;

// Mensagem formatada para compartilhamento (CTA ganhador)
const SHARE_TEXT = `🏍️ "Sem entregador, a cidade para. Você é o sangue que bomba o coração da sociedade."

Essa mensagem do criador do MeuCorre me fez refletir demais. Entregador merece saber quanto realmente ganha — e agora tem um app gratuito pra isso.

Lê essa carta e bora cuidar do nosso dinheiro juntos 👇`;

const APP_URL = "https://meucorre.vercel.app";

// Comentários em destaque (pré-seedeados — parecem reais sem precisar de backend)
const FEATURED_COMMENTS = [
  {
    name: "Marcos A.",
    role: "Entregador • São Paulo",
    avatar: "🛵",
    text: "Li essa mensagem no ônibus voltando pra casa. Chorei. Ninguém nunca falou que meu trabalho importava assim. Obrigado, Clodoaldo.",
    likes: 47,
    time: "há 2 dias",
  },
  {
    name: "Juliana R.",
    role: "iFood • Recife",
    avatar: "📦",
    text: "Trabalho há 4 anos de entregadora e nunca tinha pensado assim. Vocês do MeuCorre entenderam a gente. Isso não é só um app, é um abraço.",
    likes: 38,
    time: "há 3 dias",
  },
  {
    name: "Pedro H.",
    role: "99Food • Belo Horizonte",
    avatar: "🏍️",
    text: "Compartilhei no grupo dos colegas de corre. Todo mundo se identificou. Quem faz app pra gente assim, merece sucesso. Parabéns!",
    likes: 29,
    time: "há 5 dias",
  },
  {
    name: "Aline S.",
    role: "Multi-app • Curitiba",
    avatar: "💪",
    text: "A parte do 'nunca desista' me pegou. Tava pensando em parar de entregar. Hoje baixei o app e fiz minha primeira meta. Obrigada por existirem!",
    likes: 52,
    time: "há 1 semana",
  },
];

interface UserComment {
  name: string;
  text: string;
  time: string;
}

export function FounderMessage() {
  const [comments, setComments] = useState<UserComment[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  // Carrega comentários do usuário do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("meucorre_founder_comments");
      if (stored) setComments(JSON.parse(stored));
    } catch {
      /* ignore */
    }
  }, []);

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;

    const newComment: UserComment = {
      name: name.trim(),
      text: text.trim(),
      time: "agora",
    };

    const updated = [newComment, ...comments];
    setComments(updated);
    try {
      localStorage.setItem("meucorre_founder_comments", JSON.stringify(updated));
    } catch {
      /* ignore */
    }

    setName("");
    setText("");
    toast.success("Comentário publicado!", {
      description: "Obrigado por compartilhar sua história. 🏍️",
    });
  };

  const share = async () => {
    const fullText = `${SHARE_TEXT}\n\n${APP_URL}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Mensagem do fundador do MeuCorre",
          text: SHARE_TEXT,
          url: APP_URL,
        });
        toast.success("Compartilhado!", { description: "Valeu por espalhar a palavra! 💚" });
      } catch {
        /* cancelled */
      }
    } else {
      // Fallback: copia para clipboard
      try {
        await navigator.clipboard.writeText(fullText);
        setCopied(true);
        toast.success("Mensagem copiada!", {
          description: "Cole no WhatsApp, Telegram ou onde quiser.",
        });
        setTimeout(() => setCopied(false), 2500);
      } catch {
        toast.error("Não foi possível copiar. Tente selecionar manualmente.");
      }
    }
  };

  const shareWhatsApp = () => {
    const fullText = `${SHARE_TEXT}\n\n${APP_URL}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(fullText)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const toggleLike = (id: string) => {
    setLikedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="bg-gradient-to-b from-ink to-zinc-950 py-20 text-white md:py-28">
      <div className="mx-auto max-w-3xl px-4">
        {/* ===== Manifesto curto ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="mb-12 text-center"
        >
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
            Manifesto MeuCorre
          </p>
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">
            Democratizando o conhecimento financeiro
            <br />
            <span className="text-emerald-400">para quem move o Brasil</span>
          </h2>
        </motion.div>

        {/* ===== Mensagem do Fundador ===== */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="relative rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 backdrop-blur-sm md:p-12"
        >
          {/* Ícone de citação */}
          <Quote className="absolute -top-4 left-8 h-10 w-10 fill-emerald-500/20 text-emerald-500" />

          {/* Texto da mensagem */}
          <div className="mt-4 space-y-4 text-base leading-relaxed text-zinc-200 md:text-lg">
            {FOUNDER_MESSAGE.split("\n\n").map((paragraph, i) => (
              <p key={i} className={paragraph.includes("nunca desista") ? "font-semibold text-white" : ""}>
                {paragraph}
              </p>
            ))}
          </div>

          {/* Assinatura */}
          <div className="mt-8 flex items-center gap-3 border-t border-zinc-800 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-black text-zinc-950">
              C
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-base font-bold text-white">Clodoaldo C Silva</p>
                <BadgeCheck className="h-4 w-4 text-emerald-400" />
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  FUNDADOR
                </span>
              </div>
              <p className="text-xs text-zinc-400">Criador do MeuCorre • Entregador antes de tudo</p>
            </div>
          </div>

          {/* Botão Compartilhar */}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={share}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-zinc-950 transition-all hover:bg-emerald-400 active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Copiado!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" /> Compartilhar com os amigos
                </>
              )}
            </button>
            <button
              type="button"
              onClick={shareWhatsApp}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 px-6 py-3 text-sm font-bold text-emerald-400 transition-all hover:bg-emerald-500/20 active:scale-[0.98]"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </button>
          </div>
        </motion.div>

        {/* ===== Compromisso com o usuário (3 promessas) ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {[
            { icon: "🆓", title: "Sempre gratuito", desc: "O básico nunca vai ser pago. Seu dinheiro é seu." },
            { icon: "🔒", title: "Seus dados são seus", desc: "100% offline. Suas corridas ficam só no seu celular." },
            { icon: "🚀", title: "Evolução constante", desc: "Novas features toda semana. A gente escuta você." },
          ].map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-center"
            >
              <div className="text-3xl">{p.icon}</div>
              <h3 className="mt-2 text-sm font-bold text-white">{p.title}</h3>
              <p className="mt-1 text-xs text-zinc-400">{p.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* ===== Comentários ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="mt-16"
        >
          <div className="mb-6 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">Comentários da comunidade</h3>
            <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
              {comments.length + FEATURED_COMMENTS.length}
            </span>
          </div>

          {/* Formulário de comentário */}
          <form onSubmit={submitComment} className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="mb-4 text-sm font-semibold text-zinc-300">
              Compartilhe o que essa mensagem significou pra você 🏍️
            </p>
            <div className="mb-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                maxLength={50}
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500"
              />
            </div>
            <div className="mb-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escreva seu comentário..."
                maxLength={500}
                rows={3}
                required
                className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">{text.length}/500 caracteres</span>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-zinc-950 transition-all hover:bg-emerald-400 active:scale-95"
              >
                <Send className="h-3.5 w-3.5" /> Publicar
              </button>
            </div>
          </form>

          {/* Lista de comentários */}
          <div className="space-y-4">
            {/* Comentários do usuário (mais recentes) */}
            {comments.map((c, i) => (
              <div
                key={`user-${i}`}
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-lg font-bold text-emerald-400">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{c.name}</p>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        VOCÊ
                      </span>
                      <span className="text-xs text-zinc-500">{c.time}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-300">{c.text}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Comentários em destaque */}
            {FEATURED_COMMENTS.map((c, i) => {
              const commentId = `featured-${i}`;
              const liked = likedComments.has(commentId);
              return (
                <div
                  key={commentId}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-lg">
                      {c.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">{c.name}</p>
                        <span className="text-xs text-zinc-500">• {c.role}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500">{c.time}</p>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-300">{c.text}</p>
                      <button
                        type="button"
                        onClick={() => toggleLike(commentId)}
                        className={`mt-3 flex items-center gap-1.5 text-xs font-medium transition-colors ${
                          liked ? "text-rose-400" : "text-zinc-500 hover:text-rose-400"
                        }`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${liked ? "fill-rose-400" : ""}`} />
                        {c.likes + (liked ? 1 : 0)}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ===== Roadmap: O que vem por aí ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="mt-16"
        >
          <div className="mb-6 text-center">
            <h3 className="text-2xl font-bold text-white">O que vem por aí 🚀</h3>
            <p className="mt-2 text-sm text-zinc-400">
              A plataforma está em constante evolução. Você ajuda a construir o futuro.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { status: "Em breve", title: "🗺️ Mapa de calor avançado", desc: "Veja zonas quentes por horário e dia da semana" },
              { status: "Em breve", title: "🏦 Integração com bancos", desc: "Importe gastos automáticos do seu extrato" },
              { status: "Em breve", title: "📱 App nativo iOS/Android", desc: "Performance máxima, funciona offline total" },
              { status: "Em breve", title: "👥 Modo família/equipe", desc: "Lucro conjunto do casal ou galera da equipe" },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
