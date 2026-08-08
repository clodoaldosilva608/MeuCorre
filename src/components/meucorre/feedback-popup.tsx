"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Star, MessageSquare, Send, X } from "lucide-react";

interface FeedbackPopupProps {
  open: boolean;
  onClose: () => void;
}

export function FeedbackPopup({ open, onClose }: FeedbackPopupProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Escolhe de 1 a 5 estrelas aí 😉");
      return;
    }
    if (message.trim().length < 3) {
      toast.error("Conta um pouquinho mais pra gente (mín 3 caracteres)");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, message: message.trim(), page: "app" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao enviar feedback");
        return;
      }
      toast.success("Valeu pelo feedback! 🙏", {
        description: data.thankYouMessage ?? "Vamos usar isso pra melhorar o app",
      });
      // Reset
      setRating(0);
      setMessage("");
      onClose();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = ["", "Ruim 😕", "Mais ou menos 🤔", "Boa 👍", "Muito boa 🔥", "Caramba, top! 🚀"];
  const displayRating = hoverRating || rating;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md gap-0 border-zinc-800 bg-zinc-950 p-0 text-zinc-100">
        <DialogHeader className="border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
              <MessageSquare className="h-4 w-4" />
             Conta pra gente: como tá o app?
            </DialogTitle>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="grid h-7 w-7 place-items-center rounded-full text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <DialogDescription className="mt-1 text-xs text-zinc-400">
            Seu feedback deixa o MeuCorre melhor pra todo mundo 🙏
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5">
          {/* Estrelas */}
          <div className="space-y-2">
            <Label className="text-xs text-zinc-400">
              Quanto cê tá gostando?
            </Label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                  aria-label={`${n} estrelas`}
                >
                  <Star
                    className={`h-9 w-9 ${
                      n <= displayRating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-zinc-800 text-zinc-700"
                    }`}
                  />
                </button>
              ))}
            </div>
            {displayRating > 0 && (
              <p className="text-sm font-medium text-emerald-400">
                {ratingLabels[displayRating]}
              </p>
            )}
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label className="text-xs text-zinc-400">
              O que a gente pode melhorar? (ou o que cê curtiu?)
            </Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Ex: Adorei o controle de despesa! Mas podia ter um botão de exportar pras planilhas do Google..."
              maxLength={1000}
              className="resize-none border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500"
            />
            <p className="text-[10px] text-zinc-500">
              {message.length}/1000 caracteres
            </p>
          </div>

          {/* CTA */}
          <Button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="w-full bg-emerald-500 py-3 font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? (
              "Enviando..."
            ) : (
              <>
                <Send className="mr-1.5 h-4 w-4" />
                Mandar feedback
              </>
            )}
          </Button>
          <button
            onClick={onClose}
            className="block w-full text-center text-[11px] text-zinc-500 hover:text-zinc-400"
          >
            Talvez depois
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
