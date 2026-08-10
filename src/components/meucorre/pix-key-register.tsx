"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Key, Check, Loader2 } from "lucide-react";

// Componente para cadastrar/atualizar chave PIX do usuário.
// Sem PIX cadastrada, recompensas de referral não são pagas.
export function PixKeyRegister() {
  const [pixKey, setPixKey] = useState("");
  const [savedPixKey, setSavedPixKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetch("/api/referral/pix")
      .then((r) => r.json())
      .then((data) => {
        if (data.pixKey) {
          setSavedPixKey(data.pixKey);
          setPixKey(data.pixKey);
        } else {
          setEditing(true); // Abre edição automaticamente se não tem PIX
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!pixKey.trim() || pixKey.trim().length < 3) {
      toast.error("Chave PIX inválida (mínimo 3 caracteres)");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/referral/pix", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pixKey: pixKey.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSavedPixKey(data.pixKey);
        setEditing(false);
        toast.success("Chave PIX salva! ✅", {
          description: "Agora você pode receber recompensas por indicação.",
        });
      } else {
        toast.error(data.error || "Erro ao salvar");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  if (savedPixKey && !editing) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <span className="text-[11px] text-zinc-400">PIX:</span>
          <span className="truncate text-[11px] font-medium text-emerald-400">
            {savedPixKey}
          </span>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="shrink-0 text-[10px] text-zinc-500 underline hover:text-zinc-300"
        >
          Alterar
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Key className="h-3.5 w-3.5 shrink-0 text-amber-400" />
        <span className="text-[11px] font-medium text-amber-300">
          Cadastre sua chave PIX para receber:
        </span>
      </div>
      <div className="flex gap-1.5">
        <input
          type="text"
          value={pixKey}
          onChange={(e) => setPixKey(e.target.value)}
          placeholder="email, telefone, CPF ou chave aleatória"
          className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600"
          maxLength={140}
        />
        <button
          onClick={handleSave}
          disabled={loading || !pixKey.trim()}
          className="shrink-0 rounded bg-emerald-500 px-3 py-1.5 text-xs font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : savedPixKey ? (
            "Atualizar"
          ) : (
            "Salvar PIX"
          )}
        </button>
      </div>
      {!savedPixKey && (
        <p className="mt-1 text-[10px] text-amber-400/60">
          ⚠️ Sem PIX cadastrada, você não receberá as recompensas de indicação.
        </p>
      )}
    </div>
  );
}
