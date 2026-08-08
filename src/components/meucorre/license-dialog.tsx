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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Crown,
  Sparkles,
  Check,
  ShieldCheck,
  Zap,
  FileText,
  Cloud,
  Target,
  Wrench,
  ExternalLink,
} from "lucide-react";

interface LicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPro: boolean;
  onActivate: (key: string) => Promise<boolean>;
}

const PRO_FEATURES = [
  { icon: ShieldCheck, label: "Sem anúncios no app" },
  { icon: FileText, label: "Relatórios PDF mensais" },
  { icon: Cloud, label: "Backup em nuvem entre dispositivos" },
  { icon: Target, label: "Metas diárias e semanais" },
  { icon: Wrench, label: "Lembretes de manutenção" },
];

export function LicenseDialog({
  open,
  onOpenChange,
  isPro,
  onActivate,
}: LicenseDialogProps) {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setKey("");
  }, [open]);

  const handleActivate = async () => {
    if (!key.trim()) return;
    setLoading(true);
    await onActivate(key.trim());
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 border-zinc-800 bg-zinc-950 p-0 text-zinc-100">
        <DialogHeader className="border-b border-zinc-800 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
            <Crown className="h-4 w-4" />
            {isPro ? "MeuCorre PRO ativo" : "Ativar MeuCorre PRO"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            {isPro
              ? "Sua licença está ativa. Obrigado por apoiar o MeuCorre!"
              : "Digite sua chave de licença para liberar os recursos PRO"}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-5">
          {isPro ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
                <Check className="h-8 w-8 text-zinc-950" strokeWidth={3} />
              </div>
              <h3 className="text-lg font-bold text-emerald-400">
                Você é PRO! 🎉
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                Todos os recursos premium estão liberados. Sem anúncios, com
                backup em nuvem, relatórios PDF, metas e lembretes.
              </p>
            </div>
          ) : (
            <>
              {/* Features PRO */}
              <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                  <Sparkles className="h-3 w-3" />
                  Recursos PRO inclusos:
                </p>
                <ul className="space-y-1.5">
                  {PRO_FEATURES.map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-[11px] text-zinc-300"
                      >
                        <Icon className="h-3 w-3 text-emerald-400" />
                        {f.label}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Comprar CTA */}
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 flex items-center justify-between rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 text-zinc-950 transition-transform hover:scale-[1.02]"
              >
                <div>
                  <p className="text-xs font-bold">
                    Ainda não tem uma licença?
                  </p>
                  <p className="text-[10px] opacity-90">
                    Plano vitalício — R$ 97,00 (pagamento único)
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold">
                  Comprar
                  <ExternalLink className="h-3 w-3" />
                </div>
              </a>

              {/* Input da licença */}
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">
                  Chave de licença
                </Label>
                <Input
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="cole-aqui-sua-chave-de-32-caracteres"
                  className="border-zinc-800 bg-zinc-900 font-mono text-xs text-zinc-100 focus:border-emerald-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && key.trim()) {
                      handleActivate();
                    }
                  }}
                />
                <p className="text-[10px] text-zinc-500">
                  Você recebeu a chave por email após o pagamento ser aprovado
                </p>
              </div>
            </>
          )}
        </div>

        {!isPro && (
          <DialogFooter className="border-t border-zinc-800 px-5 py-4">
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
              onClick={handleActivate}
              disabled={loading || !key.trim()}
              className="flex-1 bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {loading ? (
                "Verificando..."
              ) : (
                <>
                  <Zap className="mr-1.5 h-4 w-4" />
                  Ativar PRO
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
