"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { Loader2, Building2, MapPin } from "lucide-react";
import {
  STAGES,
  STAGE_LABELS,
  STAGE_COLORS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  formatBRL,
  type Partner,
  type PartnerStage,
} from "@/lib/partner-types";
import { toast } from "sonner";

interface Props {
  onSelectPartner: (id: string) => void;
}

interface PartnerCard extends Partner {
  _count?: { contacts: number; opportunities: number; activities: number };
}

export function KanbanView({ onSelectPartner }: Props) {
  const [partners, setPartners] = useState<PartnerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/partners?limit=500");
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Agrupa por estágio
  const byStage = (stage: PartnerStage): PartnerCard[] =>
    partners.filter((p) => p.stage === stage);

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const partnerId = active.id as string;
    const newStage = over.id as PartnerStage;
    const partner = partners.find((p) => p.id === partnerId);
    if (!partner || partner.stage === newStage) return;

    // Otimistic: move localmente
    setPartners((arr) =>
      arr.map((p) => (p.id === partnerId ? { ...p, stage: newStage } : p)),
    );

    // Persiste: PATCH no partner com novo stage
    const res = await fetch(`/api/admin/partners/${partnerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });

    if (res.ok) {
      toast.success(
        `${partner.companyName} → ${STAGE_LABELS[newStage]}`,
      );
    } else {
      // Reverte em caso de erro
      toast.error("Erro ao mover — revertendo");
      setPartners((arr) =>
        arr.map((p) =>
          p.id === partnerId ? { ...p, stage: partner.stage } : p,
        ),
      );
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando pipeline...
      </div>
    );
  }

  const activePartner = activeId ? partners.find((p) => p.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stageInfo) => {
          const stagePartners = byStage(stageInfo.value);
          return (
            <KanbanColumn
              key={stageInfo.value}
              stage={stageInfo.value}
              label={stageInfo.label}
              color={stageInfo.color}
              partners={stagePartners}
              onSelectPartner={onSelectPartner}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activePartner ? (
          <div className="w-64 cursor-grabbing rounded-lg border-2 border-emerald-500 bg-zinc-800 p-3 shadow-2xl">
            <p className="truncate text-sm font-semibold text-zinc-100">
              {activePartner.companyName}
            </p>
            {activePartner.city && (
              <p className="mt-1 text-[10px] text-zinc-400">
                <MapPin className="mr-0.5 inline h-2 w-2" />
                {activePartner.city}
              </p>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  stage,
  label,
  color,
  partners,
  onSelectPartner,
}: {
  stage: PartnerStage;
  label: string;
  color: string;
  partners: PartnerCard[];
  onSelectPartner: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="flex w-64 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-semibold text-zinc-200">{label}</span>
        </div>
        <span className="text-[10px] text-zinc-500">{partners.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 rounded-lg border p-2 transition-colors ${
          isOver
            ? "border-emerald-500 bg-emerald-500/5"
            : "border-zinc-800 bg-zinc-950/50"
        }`}
        style={{ minHeight: "120px" }}
      >
        {partners.length === 0 ? (
          <div className="py-8 text-center text-[10px] text-zinc-700">
            Vazio
          </div>
        ) : (
          partners.map((p) => (
            <KanbanCard
              key={p.id}
              partner={p}
              onClick={() => onSelectPartner(p.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function KanbanCard({
  partner,
  onClick,
}: {
  partner: PartnerCard;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: partner.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`group cursor-pointer rounded-md border border-zinc-800 bg-zinc-900 p-2 transition-all hover:border-zinc-700 hover:bg-zinc-800 ${
        isDragging ? "opacity-30" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-100">
          {partner.companyName}
        </p>
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{
            backgroundColor: PRIORITY_COLORS[partner.priority],
          }}
          title={`Prioridade: ${PRIORITY_LABELS[partner.priority]}`}
        />
      </div>

      {partner.city && (
        <p className="mt-1 flex items-center gap-0.5 text-[10px] text-zinc-500">
          <MapPin className="h-2 w-2" />
          {partner.city}
          {partner.state ? `/${partner.state}` : ""}
        </p>
      )}

      <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-600">
        <span>
          {partner._count?.contacts ?? 0}C · {partner._count?.opportunities ?? 0}O
        </span>
        {partner.potentialValue ? (
          <span className="font-medium text-emerald-400">
            {formatBRL(partner.potentialValue)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
