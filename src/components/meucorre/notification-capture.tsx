"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { parseNotification, formatBRL } from "@/lib/apps";
import type { DeliveryApp } from "@/lib/types";
import { Bell, Zap, ShieldCheck, Smartphone, Info } from "lucide-react";
import { toast } from "sonner";

interface NotificationCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apps: DeliveryApp[];
  onConfirm: (data: { app: string; value: number; km: number }) => Promise<void>;
}

const EXAMPLE_NOTIFICATIONS = [
  "iFood: Pedido entregue! Você recebeu R$ 15,50",
  "99Food - Corrida finalizada. Ganho: R$ 22,90",
  "Lalamove: Pagamento de R$ 45,00 disponível",
  "Rappi: Entrega concluída. Seus ganhos: R$ 12,75",
];

export function NotificationCapture({
  open,
  onOpenChange,
  apps,
  onConfirm,
}: NotificationCaptureProps) {
  const [text, setText] = useState("");
  const [parsedApp, setParsedApp] = useState<string>("");
  const [parsedValue, setParsedValue] = useState<string>("");
  const [km, setKm] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (open) {
      setText("");
      setParsedApp("");
      setParsedValue("");
      setKm("");
      // Verifica suporte do browser a Notifications API
      if (typeof Notification === "undefined") {
        setPermission("unsupported");
      } else {
        setPermission(Notification.permission);
      }
    }
  }, [open]);

  // Faz parse conforme o usuário digita
  useEffect(() => {
    if (!text.trim()) {
      setParsedApp("");
      setParsedValue("");
      return;
    }
    const parsed = parseNotification(text, apps);
    setParsedApp(parsed.app ?? "");
    setParsedValue(parsed.value ? String(parsed.value).replace(".", ",") : "");
  }, [text, apps]);

  const requestPermission = async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      toast.success("Permissão concedida", {
        description: "Agora o MeuCorre pode ler notificações de corrida",
      });
    } else {
      toast.error("Permissão negada", {
        description: "Sem permissão, a captura automática não funciona",
      });
    }
  };

  const applyExample = (ex: string) => setText(ex);

  const parseNumber = (s: string): number => {
    if (!s) return 0;
    return parseFloat(s.replace(",", ".")) || 0;
  };

  const handleConfirm = async () => {
    const v = parseNumber(parsedValue);
    if (v <= 0 || !parsedApp) {
      toast.error("Dados incompletos", {
        description: "Não consegui identificar app e valor na notificação",
      });
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm({
        app: parsedApp,
        value: v,
        km: parseNumber(km),
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 border-zinc-800 bg-zinc-950 p-0 text-zinc-100">
        <DialogHeader className="border-b border-zinc-800 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
            <Bell className="h-4 w-4" />
            Capturar por notificação
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Cole o texto da notificação do app de entrega e o MeuCorre
            preenche automaticamente
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
          {/* Status de permissão */}
          <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
            <div className="flex items-start gap-2">
              <ShieldCheck
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  permission === "granted"
                    ? "text-emerald-400"
                    : permission === "denied"
                      ? "text-red-400"
                      : "text-zinc-500"
                }`}
              />
              <div className="flex-1 text-[11px]">
                <p className="font-semibold text-zinc-300">
                  {permission === "unsupported"
                    ? "Notificações não suportadas neste navegador"
                    : permission === "granted"
                      ? "Permissão concedida ✓"
                      : permission === "denied"
                        ? "Permissão bloqueada"
                        : "Aguardando permissão"}
                </p>
                <p className="mt-0.5 text-zinc-500">
                  {permission === "granted"
                    ? "Cole a notificação abaixo — vou extrair os dados."
                    : permission === "denied"
                      ? "Habilite nas configurações do navegador para usar a captura automática."
                      : "Conceda permissão para captura automática no futuro."}
                </p>
                {permission === "default" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={requestPermission}
                    className="mt-2 h-7 bg-emerald-500 text-[11px] text-zinc-950 hover:bg-emerald-400"
                  >
                    <Smartphone className="mr-1.5 h-3 w-3" />
                    Permitir notificações
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Textarea da notificação */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-zinc-400">
              Texto da notificação
            </Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ex: iFood: Pedido entregue! Você recebeu R$ 15,50"
              rows={3}
              className="resize-none border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-emerald-500/20"
            />
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] text-zinc-500">Exemplos:</span>
              {EXAMPLE_NOTIFICATIONS.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyExample(ex)}
                  className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                >
                  {ex.split(":")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Preview do parse */}
          {(parsedApp || parsedValue) && (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                <Zap className="h-3 w-3" />
                Dados detectados — confirme antes de lançar:
              </p>
              <div className="space-y-2.5">
                {/* App detectado */}
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-zinc-500">
                    App
                  </Label>
                  <Select value={parsedApp} onValueChange={setParsedApp}>
                    <SelectTrigger className="border-zinc-800 bg-zinc-900 text-zinc-100">
                      <SelectValue placeholder="App não detectado" />
                    </SelectTrigger>
                    <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                      {apps.map((a) => (
                        <SelectItem
                          key={a.name}
                          value={a.name}
                          className="focus:bg-zinc-800"
                        >
                          {a.emoji} {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Valor + km */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-zinc-500">
                      Valor
                    </Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={parsedValue}
                      onChange={(e) => setParsedValue(e.target.value)}
                      placeholder="0,00"
                      className="border-zinc-800 bg-zinc-900 font-semibold text-emerald-400 focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-zinc-500">
                      Km (opcional)
                    </Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={km}
                      onChange={(e) => setKm(e.target.value)}
                      placeholder="0,0"
                      className="border-zinc-800 bg-zinc-900 text-zinc-100 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info box sobre a API */}
          <div className="mt-4 flex gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <p className="text-[10px] leading-relaxed text-zinc-500">
              <strong className="text-zinc-400">Como funciona:</strong> cole a
              notificação que chegou no celular (de apps como iFood, 99Food,
              Lalamove). O MeuCorre extrai automaticamente o app e o valor.
              Em breve, com a Notification Listener API nativa do Android, o
              preenchimento será 100% automático.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-zinc-800 px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !parsedApp || parseNumber(parsedValue) <= 0}
            className="flex-1 bg-emerald-500 font-bold text-zinc-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 disabled:opacity-50"
          >
            {submitting
              ? "Lançando..."
              : `Lançar ${parsedValue ? formatBRL(parseNumber(parsedValue)) : "corrida"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
