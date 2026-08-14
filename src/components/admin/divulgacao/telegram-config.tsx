"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  Send,
  Check,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Trash2,
} from "lucide-react";

// ===== Componente de configuração do Telegram Bot =====
//
// Modal que permite ao admin configurar o bot token do Telegram.
// Mostra status (configurado/valido), valida o token, e permite
// remover a configuração.

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved?: () => void;
}

interface BotInfo {
  username: string;
  firstName: string;
  canJoinGroups?: boolean;
  canReadAllGroupMessages?: boolean;
}

interface ConfigStatus {
  configured: boolean;
  valid?: boolean;
  botInfo?: BotInfo;
  error?: string;
  message?: string;
  needsConfig?: boolean;
}

export function TelegramConfig({ open, onOpenChange, onSaved }: Props) {
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [botToken, setBotToken] = useState("");
  const [saving, setSaving] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promotion/telegram-config");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({
        configured: false,
        message: "Erro de conexão ao verificar status",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadStatus();
      setBotToken("");
    }
  }, [open, loadStatus]);

  const handleSave = async () => {
    if (!botToken.trim()) {
      toast.error("Cole o bot token");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/promotion/telegram-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: botToken.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar token");
        return;
      }
      toast.success("Bot configurado!", {
        description: `@${data.botInfo.username} está pronto`,
      });
      setBotToken("");
      onSaved?.();
      loadStatus();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Remover configuração do Telegram?")) return;
    try {
      await fetch("/api/admin/promotion/telegram-config", { method: "DELETE" });
      toast.success("Configuração removida");
      onSaved?.();
      loadStatus();
    } catch {
      toast.error("Erro ao remover");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 border-zinc-800 bg-zinc-900 p-0 text-zinc-100">
        <DialogHeader className="border-b border-zinc-800 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
            <Send className="h-4 w-4" />
            Configurar Telegram Bot
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Configure um bot do Telegram para publicação automática em grupos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : status?.configured && status.valid ? (
            // Bot configurado e válido
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-500/10">
                  <Check className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-emerald-400">
                    Bot conectado!
                  </p>
                  <p className="mt-1 text-xs text-zinc-300">
                    @{status.botInfo?.username}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {status.botInfo?.firstName}
                  </p>
                  {status.botInfo?.canReadAllGroupMessages === false && (
                    <p className="mt-2 text-[11px] text-amber-400">
                      ⚠️ Privacy Mode ativo — o bot não lê todas as mensagens dos grupos.
                      Para publicar, basta ser membro.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : status?.configured && !status.valid ? (
            // Bot configurado mas inválido
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-400">
                    Token inválido
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {status.error || "O token salvo não é mais válido"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Não configurado
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-400">
                    Bot não configurado
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Crie um bot com @BotFather no Telegram e cole o token abaixo
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instruções */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
            <p className="mb-2 text-xs font-semibold text-zinc-300">
              Como obter um bot token:
            </p>
            <ol className="space-y-1 text-[11px] text-zinc-400">
              <li>
                1. Abra o Telegram e procure{" "}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline"
                >
                  @BotFather <ExternalLink className="inline h-2.5 w-2.5" />
                </a>
              </li>
              <li>2. Envie o comando <code className="text-emerald-400">/newbot</code></li>
              <li>3. Escolha um nome (ex: "MeuCorre Divulgação")</li>
              <li>4. Escolha um username (ex: "meucorre_div_bot")</li>
              <li>5. Copie o token (formato: <code className="text-emerald-400">123456789:ABCdef...</code>)</li>
              <li>6. <strong>Adicione o bot aos grupos do Telegram</strong> como administrador</li>
            </ol>
          </div>

          {/* Campo do token */}
          <div>
            <Label className="mb-1.5 block text-xs text-zinc-400">
              Bot Token {status?.configured && "(atualizar)"}
            </Label>
            <Input
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
              type="password"
              className="border-zinc-700 bg-zinc-950 font-mono text-xs text-zinc-100 focus:border-emerald-500"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-zinc-800 px-5 py-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={loadStatus}
                className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                size="sm"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Atualizar
              </Button>
              {status?.configured && (
                <Button
                  variant="ghost"
                  onClick={handleDelete}
                  className="text-red-400 hover:bg-red-950/40 hover:text-red-300"
                  size="sm"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Remover
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
              >
                Fechar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !botToken.trim()}
                className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <Check className="mr-1.5 h-4 w-4" />
                    Salvar token
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
