"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { DeliveryApp } from "@/lib/types";
import { resizeImage } from "@/lib/apps";
import { cn } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  EyeOff,
  Eye,
  ImageIcon,
  X,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";

interface AppManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apps: DeliveryApp[];
  onAdd: (data: Omit<DeliveryApp, "id">) => Promise<void>;
  onUpdate: (id: number, data: Partial<Omit<DeliveryApp, "id">>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onToggleHide: (id: number) => Promise<void>;
}

const EMOJI_OPTIONS = [
  "🍽️", "🟠", "📦", "🛍️", "📮", "🚀", "🍔", "🍕", "🥡", "🛵",
  "🚲", "🛻", "⭐", "💛", "💚", "💙", "💜", "🤎", "⚫", "🔴",
];

const COLOR_OPTIONS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
  "#a855f7", "#ec4899", "#71717a", "#09090b",
];

interface EditingState {
  id?: number;
  name: string;
  label: string;
  color: string;
  emoji: string;
  image?: string;
  isDefault?: boolean;
  hidden?: boolean;
}

export function AppManager({
  open,
  onOpenChange,
  apps,
  onAdd,
  onUpdate,
  onDelete,
  onToggleHide,
}: AppManagerProps) {
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DeliveryApp | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset estado quando o modal fecha — controlado pelo pai via key
  // (sem useEffect para evitar cascading renders)

  const startNew = () => {
    setEditing({
      name: "",
      label: "",
      color: "#10b981",
      emoji: "🚀",
    });
  };

  const startEdit = (a: DeliveryApp) => {
    setEditing({
      id: a.id,
      name: a.name,
      label: a.label,
      color: a.color,
      emoji: a.emoji,
      image: a.image,
      isDefault: a.isDefault,
      hidden: a.hidden,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande", { description: "Máximo 5MB" });
      return;
    }
    try {
      const dataUrl = await resizeImage(file, 256);
      setEditing({ ...editing, image: dataUrl });
      toast.success("Imagem carregada");
    } catch {
      toast.error("Erro ao processar imagem");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = () => {
    if (editing) setEditing({ ...editing, image: undefined });
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.label.trim()) {
      toast.error("Informe o nome do app");
      return;
    }
    // Gera name (chave) a partir do label se for novo
    const name = editing.id
      ? editing.name
      : editing.label
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || `app-${Date.now()}`;

    try {
      if (editing.id) {
        await onUpdate(editing.id, {
          label: editing.label.trim(),
          color: editing.color,
          emoji: editing.emoji,
          image: editing.image,
        });
        toast.success("App atualizado");
      } else {
        await onAdd({
          name,
          label: editing.label.trim(),
          color: editing.color,
          emoji: editing.emoji,
          image: editing.image,
          isDefault: false,
        });
        toast.success("App adicionado!");
      }
      setEditing(null);
    } catch (err) {
      toast.error("Erro ao salvar app", {
        description: err instanceof Error ? err.message : "Tente outro nome",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete?.id) return;
    await onDelete(confirmDelete.id);
    toast.success(
      confirmDelete.isDefault
        ? "App ocultado"
        : "App excluído",
    );
    setConfirmDelete(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 border-zinc-800 bg-zinc-950 p-0 text-zinc-100">
        <DialogHeader className="border-b border-zinc-800 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-400">
            <Settings2 className="h-4 w-4" />
            Apps de Entrega
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Cadastre, edite ou oculte os apps que você usa
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {editing ? (
            // ===== Form de edição/criação =====
            <div className="space-y-4">
              {/* Preview do card */}
              <div className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex flex-col items-center gap-1.5">
                  {editing.image ? (
                    <img
                      src={editing.image}
                      alt={editing.label}
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div
                      className="grid h-16 w-16 place-items-center rounded-xl text-3xl"
                      style={{ backgroundColor: `${editing.color}22` }}
                    >
                      {editing.emoji}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-zinc-200">
                    {editing.label || "Nome do app"}
                  </span>
                </div>
              </div>

              {/* Nome */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-400">
                  Nome do app *
                </Label>
                <Input
                  value={editing.label}
                  onChange={(e) =>
                    setEditing({ ...editing, label: e.target.value })
                  }
                  placeholder="Ex: Uber Eats, James Delivery..."
                  maxLength={30}
                  className="border-zinc-800 bg-zinc-900 text-zinc-100 focus:border-emerald-500"
                />
              </div>

              {/* Imagem oficial */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-400">
                  Imagem oficial (opcional)
                </Label>
                <div className="flex gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    className="flex-1 border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {editing.image ? "Trocar imagem" : "Enviar imagem"}
                  </Button>
                  {editing.image && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={removeImage}
                      className="border-zinc-800 bg-zinc-900 text-red-400 hover:bg-red-950/40"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500">
                  Será redimensionada para 256x256px. Máx 5MB.
                </p>
              </div>

              {/* Emoji (fallback se sem imagem) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-400">
                  Emoji (fallback)
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_OPTIONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEditing({ ...editing, emoji: em })}
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-lg border text-lg transition-all",
                        editing.emoji === em
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700",
                      )}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cor */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-zinc-400">
                  Cor de destaque
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditing({ ...editing, color: c })}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 transition-all",
                        editing.color === c
                          ? "border-white ring-2 ring-emerald-500/40"
                          : "border-zinc-800",
                      )}
                      style={{ backgroundColor: c }}
                      aria-label={`Cor ${c}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditing(null)}
                  className="flex-1 border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 bg-emerald-500 font-bold text-zinc-950 hover:bg-emerald-400"
                >
                  {editing.id ? "Salvar" : "Adicionar"}
                </Button>
              </div>
            </div>
          ) : (
            // ===== Lista de apps =====
            <div className="space-y-2">
              <Button
                type="button"
                onClick={startNew}
                className="w-full border border-dashed border-emerald-500/40 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar novo app
              </Button>

              <div className="space-y-1.5">
                {apps.map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-2.5",
                      a.hidden && "opacity-50",
                    )}
                  >
                    {a.image ? (
                      <img
                        src={a.image}
                        alt={a.label}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="grid h-10 w-10 place-items-center rounded-lg text-lg"
                        style={{ backgroundColor: `${a.color}22` }}
                      >
                        {a.emoji}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-200">
                        {a.label}
                      </p>
                      <div className="flex items-center gap-1.5">
                        {a.isDefault && (
                          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400">
                            padrão
                          </span>
                        )}
                        {a.hidden && (
                          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-500">
                            oculto
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onToggleHide(a.id!)}
                        aria-label={a.hidden ? "Mostrar app" : "Ocultar app"}
                        className="grid h-7 w-7 place-items-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                      >
                        {a.hidden ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => startEdit(a)}
                        aria-label={`Editar ${a.label}`}
                        className="grid h-7 w-7 place-items-center rounded text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(a)}
                        aria-label={`Excluir ${a.label}`}
                        className="grid h-7 w-7 place-items-center rounded text-zinc-500 hover:bg-red-950/40 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Confirmação de exclusão */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              {confirmDelete?.isDefault
                ? "Ocultar app?"
                : "Excluir app?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {confirmDelete?.isDefault ? (
                <>
                  Apps padrão não podem ser excluídos, mas podem ser ocultados.
                  O app <strong className="text-zinc-200">{confirmDelete?.label}</strong> não
                  aparecerá mais no formulário de corrida. Corridas antigas
                  deste app continuam visíveis no histórico.
                </>
              ) : (
                <>
                  Excluir <strong className="text-zinc-200">{confirmDelete?.label}</strong>?
                  Corridas antigas deste app continuam no histórico, mas você
                  não conseguirá lançar novas corridas com ele.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-800 text-zinc-300 hover:bg-zinc-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {confirmDelete?.isDefault ? "Ocultar" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
